-- Closing what an audit of every migration found.
--
-- Six of these are correctness or security; the rest are the cost of a query or a
-- write nobody was measuring. Each is stated with the reason, because a hardening
-- migration with no reasons is a list nobody can review.

-- ---------------------------------------------------------------------------
-- 1. Two security definer functions were executable by everybody.
--
-- A function in the public schema is callable through PostgREST, and these two run
-- as their owner: gist_file_snapshot returns any gist's file contents by id, and
-- snapshot_gist writes a revision row. They exist only to be called by
-- replace_gist_files, which is itself security definer, so nobody else needs them.
-- ---------------------------------------------------------------------------

revoke all on function gist_file_snapshot(uuid) from public, anon, authenticated;
revoke all on function snapshot_gist(gists) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. The blob queue was the one table without row-level security.
--
-- No policy is added: the queue is touched only by claim_orphaned_blobs and
-- release_orphaned_blob, which are security definer, exactly as gist_revisions and
-- gist_file_renders work.
-- ---------------------------------------------------------------------------

alter table orphaned_blobs enable row level security;

-- ---------------------------------------------------------------------------
-- 3. Reading a gist was counted as editing it.
--
-- get_gist increments view_count, and the update trigger had no column list, so
-- updated_at meant "last viewed" rather than "last changed" on every gist anybody
-- had opened. That is a lie in the payload and a wasted row version per read.
-- ---------------------------------------------------------------------------

drop trigger if exists gists_touch_updated_at on gists;

create trigger gists_touch_updated_at
    before update of title, description, visibility, expires_at on gists
    for each row
    execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- 4. A twenty-file save wrote the parent gist twenty times.
--
-- The per-row trigger issued one update of the same gists row per file, and
-- replace_gist_files pays it twice: once deleting the old set, once inserting the
-- new one. A statement-level trigger touches the parent once per statement, which
-- is all the timestamp needs.
-- ---------------------------------------------------------------------------

create or replace function touch_parent_gists()
returns trigger
language plpgsql
as $$
begin
    update gists g set updated_at = now()
    where g.id in (
        select gist_id from changed_files
    );
    return null;
end;
$$;

drop trigger if exists gist_files_touch_parent on gist_files;
drop trigger if exists gist_files_touch_parent_ins on gist_files;
drop trigger if exists gist_files_touch_parent_upd on gist_files;
drop trigger if exists gist_files_touch_parent_del on gist_files;

create trigger gist_files_touch_parent_ins
    after insert on gist_files
    referencing new table as changed_files
    for each statement
    execute function touch_parent_gists();

create trigger gist_files_touch_parent_upd
    after update on gist_files
    referencing new table as changed_files
    for each statement
    execute function touch_parent_gists();

create trigger gist_files_touch_parent_del
    after delete on gist_files
    referencing old table as changed_files
    for each statement
    execute function touch_parent_gists();

-- ---------------------------------------------------------------------------
-- 5. The feed's sort key had no index behind it.
--
-- 0009 made the ordering (created_at desc, slug desc) so a cursor could not skip
-- rows sharing a timestamp. No index matched that, so the keyset it was written to
-- support still ended in a sort of every public row.
--
-- The author index gets the same treatment, because /u/:handle pages the same way.
-- ---------------------------------------------------------------------------

drop index if exists gists_public_created_idx;
drop index if exists gists_author_created_idx;

create index if not exists gists_public_feed_idx
    on gists (created_at desc, slug desc)
    where visibility = 'public';

create index if not exists gists_author_feed_idx
    on gists (author_id, created_at desc, slug desc)
    where author_id is not null;

-- The revision index duplicated the unique constraint's own index on the same
-- leading columns, so every lookup it could serve was already served.
drop index if exists gist_revisions_gist_idx;

-- ---------------------------------------------------------------------------
-- 6. list_gists could not use a partial index.
--
-- The visibility test was a case expression over the parameter, which tells the
-- planner nothing about visibility, so a generic plan could not prove the partial
-- index's predicate. Branching in plpgsql gives each query a static predicate.
-- ---------------------------------------------------------------------------

create or replace function list_gists(
    p_handle      text default null,
    p_limit       int default 30,
    p_before      timestamptz default null,
    p_before_slug text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    page  jsonb;
    take  int := least(greatest(p_limit, 1), 100);
    cursor_slug text := coalesce(p_before_slug, '');
begin
    if p_handle is null then
        select coalesce(jsonb_agg(gist_summary(v.*::gists) order by v.created_at desc, v.slug desc), '[]'::jsonb)
        into page
        from (
            select g.*
            from gists g
            where g.visibility = 'public'
              and (g.expires_at is null or g.expires_at > now())
              and (p_before is null or (g.created_at, g.slug) < (p_before, cursor_slug))
            order by g.created_at desc, g.slug desc
            limit take
        ) v;
        return page;
    end if;

    select coalesce(jsonb_agg(gist_summary(v.*::gists) order by v.created_at desc, v.slug desc), '[]'::jsonb)
    into page
    from (
        select g.*
        from gists g
        join profiles p on p.id = g.author_id
        where p.handle = p_handle
          and (g.expires_at is null or g.expires_at > now())
          and (g.visibility = 'public' or g.author_id = auth.uid())
          and (p_before is null or (g.created_at, g.slug) < (p_before, cursor_slug))
        order by g.created_at desc, g.slug desc
        limit take
    ) v;
    return page;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Restoring a revision restored half of it.
--
-- A revision stores the title and description it was saved with, and get_revision
-- returns them, but restore put back only the files. The gist then showed one
-- version's files under another version's title.
-- ---------------------------------------------------------------------------

create or replace function restore_revision(p_slug text, p_revision integer)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    g   gists;
    rev gist_revisions;
begin
    if auth.uid() is null then
        raise exception 'authentication required' using errcode = 'insufficient_privilege';
    end if;

    select * into g from gists where slug = p_slug and author_id = auth.uid();
    if not found then
        return null;
    end if;

    select * into rev from gist_revisions
    where gist_id = g.id and revision = p_revision;

    if not found then
        return null;
    end if;

    perform replace_gist_files(p_slug, rev.files);

    update gists
       set title = rev.title,
           description = rev.description
     where id = g.id;

    return get_gist_meta(p_slug);
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Two saves at once could lose one of them.
--
-- snapshot_gist read max(revision) and then inserted, so two concurrent saves of
-- the same gist read the same number and the loser aborted on the unique
-- constraint. Locking the gist row first serialises the pair.
-- ---------------------------------------------------------------------------

create or replace function snapshot_gist(p_gist gists)
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    next_revision integer;
    files         jsonb;
begin
    perform 1 from gists where id = p_gist.id for update;

    files := gist_file_snapshot(p_gist.id);

    if jsonb_array_length(files) = 0 then
        return null;
    end if;

    select coalesce(max(revision), 0) + 1 into next_revision
    from gist_revisions
    where gist_id = p_gist.id;

    insert into gist_revisions (gist_id, revision, title, description, files)
    values (p_gist.id, next_revision, p_gist.title, p_gist.description, files);

    -- History is kept, but not forever: a gist edited daily for a year would hold a
    -- year of full file sets. The oldest go once there are more than the cap.
    delete from gist_revisions
    where gist_id = p_gist.id
      and revision <= next_revision - max_revisions_kept();

    return next_revision;
end;
$$;

create or replace function max_revisions_kept()
returns integer
language sql
immutable
as $$ select 50 $$;

revoke all on function snapshot_gist(gists) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 9. The blob janitor claimed nothing and swept everything.
--
-- claim_orphaned_blobs only read rows, so two overlapping sweeps received the same
-- paths and both tried to delete the same objects. It now locks what it hands out.
--
-- delete_expired_blobs ran a full anti-join over every gist every hour, and deleted
-- any gist that had reached zero files by any route. It now only considers the
-- gists whose files it just removed.
-- ---------------------------------------------------------------------------

create or replace function claim_orphaned_blobs(p_limit int default 100)
returns setof text
language sql
volatile
security definer
set search_path = public
as $$
    select storage_path
    from orphaned_blobs
    order by orphaned_at
    limit least(greatest(p_limit, 1), 1000)
    for update skip locked;
$$;

create or replace function delete_expired_blobs()
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    removed integer;
    touched uuid[];
begin
    with gone as (
        delete from gist_files
        where blob_expires_at is not null and blob_expires_at <= now()
        returning gist_id
    )
    select count(*), coalesce(array_agg(distinct gist_id), '{}') into removed, touched from gone;

    delete from gists g
    where g.id = any(touched)
      and not exists (select 1 from gist_files f where f.gist_id = g.id);

    return removed;
end;
$$;

-- ---------------------------------------------------------------------------
-- 10. An expiry could be set but never cleared.
--
-- update_gist read null as "leave alone" for every column, so a gist put on a timer
-- stayed on it. An explicit flag says the difference between "unchanged" and
-- "remove it", which a nullable parameter cannot.
-- ---------------------------------------------------------------------------

create or replace function update_gist(
    p_slug         text,
    p_title        text default null,
    p_description  text default null,
    p_visibility   gist_visibility default null,
    p_expires_at   timestamptz default null,
    p_clear_expiry boolean default false
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    g gists;
begin
    if auth.uid() is null then
        raise exception 'authentication required' using errcode = 'insufficient_privilege';
    end if;

    update gists set
        title       = coalesce(btrim(p_title), title),
        description = coalesce(btrim(p_description), description),
        visibility  = coalesce(p_visibility, visibility),
        expires_at  = case when p_clear_expiry then null else coalesce(p_expires_at, expires_at) end
    where slug = p_slug
      and author_id = auth.uid()
    returning * into g;

    if not found then
        return null;
    end if;

    return gist_payload(g);
end;
$$;

-- The five-argument form goes, so a named-argument call cannot be ambiguous and
-- nothing can reach the version with no way to clear an expiry.
drop function if exists update_gist(text, text, text, gist_visibility, timestamptz);

grant execute on function update_gist(text, text, text, gist_visibility, timestamptz, boolean)
    to authenticated;

-- ---------------------------------------------------------------------------
-- 11. Deleting an account was impossible for anyone who had written a private gist.
--
-- profiles cascades from auth.users, gists.author_id is set null on that delete,
-- and private_gists_need_an_author then rejects the row, aborting the whole delete.
-- A private gist belongs to its author in a way a public one does not, so it goes
-- with them; the rest are kept and become anonymous.
-- ---------------------------------------------------------------------------

create or replace function delete_private_gists_of_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    delete from gists where author_id = old.id and visibility = 'private';
    return old;
end;
$$;

drop trigger if exists profiles_delete_private_gists on profiles;

create trigger profiles_delete_private_gists
    before delete on profiles
    for each row
    execute function delete_private_gists_of_profile();

-- ---------------------------------------------------------------------------
-- 12. Search returned equally ranked results in an arbitrary order.
--
-- Prefix terms make ts_rank ties common, and the outer aggregate dropped the
-- tiebreak the inner query had applied, so the same query could answer in a
-- different order each time.
-- ---------------------------------------------------------------------------

create or replace function search_gists(
    p_query text,
    p_limit int default 30
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    with q as (
        select search_terms(p_query) as tsq
    ),
    matches as (
        select
            g.id,
            g.created_at,
            g.slug,
            ts_rank(g.search_vector, q.tsq)
                + coalesce((
                    select max(ts_rank(f.search_vector, q.tsq)) * 0.5
                    from gist_files f where f.gist_id = g.id
                  ), 0) as rank
        from gists g, q
        where q.tsq is not null
          and g.visibility = 'public'
          and (g.expires_at is null or g.expires_at > now())
          and (
              g.search_vector @@ q.tsq
              or exists (
                  select 1 from gist_files f
                  where f.gist_id = g.id and f.search_vector @@ q.tsq
              )
          )
        order by rank desc, g.created_at desc, g.slug desc
        limit least(greatest(p_limit, 1), 100)
    )
    select coalesce(
        jsonb_agg(gist_summary(g) order by m.rank desc, m.created_at desc, m.slug desc),
        '[]'::jsonb
    )
    from matches m
    join gists g on g.id = m.id;
$$;

grant execute on function search_gists(text, int) to anon, authenticated, service_role;
