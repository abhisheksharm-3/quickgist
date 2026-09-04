-- The API surface. Go calls these; it does not assemble SQL.
--
-- Every function is `security definer` with a pinned search_path, because each one
-- needs to do something the caller's own policies forbid: read an unlisted gist by
-- slug, attribute a gist to nobody, or write the render cache.
--
-- Ownership is never taken from an argument. It is always auth.uid(), which comes
-- from the verified JWT the Go layer puts into request.jwt.claims. That is the whole
-- reason the old forge-any-gist bug cannot come back.

-- Turns a caller's requested retention into an expiry timestamp, for uploads only.
--
-- The range is clamped here so a request slightly out of bounds still succeeds, and
-- set_blob_expiry() clamps again against the 30-day ceiling. Text files get null,
-- because only stored objects expire.
create or replace function requested_blob_expiry(p_file jsonb)
returns timestamptz
language sql
stable
as $$
    select case
        when p_file ->> 'storage_path' is null then null
        when p_file ->> 'retention_days' is null then null
        else now() + (least(greatest((p_file ->> 'retention_days')::int, 1), 30)
                      || ' days')::interval
    end;
$$;

-- Shape a gist and its files as one JSON document, so a page load is one round trip
-- rather than a query per file plus a query per cached render.
create or replace function gist_payload(p_gist gists)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    select jsonb_build_object(
        'slug',        p_gist.slug,
        'title',       p_gist.title,
        'description', p_gist.description,
        'visibility',  p_gist.visibility,
        'view_count',  p_gist.view_count,
        'created_at',  p_gist.created_at,
        'updated_at',  p_gist.updated_at,
        'expires_at',  p_gist.expires_at,
        'author', case when p.id is null then null else jsonb_build_object(
            'handle',       p.handle,
            'display_name', p.display_name,
            'avatar_url',   p.avatar_url
        ) end,
        'files', coalesce((
            select jsonb_agg(
                jsonb_build_object(
                    'id',            f.id,
                    'filename',      f.filename,
                    'language',      f.language,
                    'content',       f.content,
                    'storage_path',  f.storage_path,
                    'byte_size',      f.byte_size,
                    'blob_expires_at', f.blob_expires_at,
                    'rendered_html', r.html,
                    'renderer_hash', r.renderer_hash
                ) order by f.position
            )
            from gist_files f
            left join gist_file_renders r on r.file_id = f.id
            where f.gist_id = p_gist.id
        ), '[]'::jsonb)
    )
    from (select p_gist.author_id as aid) x
    left join profiles p on p.id = x.aid;
$$;

-- Read a gist by slug. This is the only path to an `unlisted` gist, which is why the
-- SELECT policy excludes them: knowing the 60-bit slug *is* the authorization.
create or replace function get_gist(p_slug text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    g gists;
begin
    select * into g from gists where slug = p_slug;

    if not found or (g.expires_at is not null and g.expires_at <= now()) then
        return null;
    end if;

    if g.visibility = 'private' and g.author_id is distinct from auth.uid() then
        return null;
    end if;

    -- Counting a view costs one row lock per read. Fine at this scale; a gist that
    -- goes viral would serialize on it, and the fix is an append-only event table
    -- plus a rollup rather than a counter here.
    update gists set view_count = view_count + 1 where id = g.id returning * into g;

    return gist_payload(g);
end;
$$;

-- Create a gist and all its files in one transaction. The old handler wrote the gist,
-- uploaded the file, then wrote again, and silently returned 201 when the upload
-- failed. There is no partial state to return here.
create or replace function create_gist(
    p_title       text,
    p_description text default '',
    p_visibility  gist_visibility default 'unlisted',
    p_expires_at  timestamptz default null,
    p_files       jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    g       gists;
    n_files int;
begin
    n_files := jsonb_array_length(p_files);

    if n_files = 0 then
        raise exception 'a gist needs at least one file' using errcode = 'check_violation';
    end if;
    if n_files > 20 then
        raise exception 'a gist takes at most 20 files' using errcode = 'check_violation';
    end if;
    if p_visibility = 'private' and auth.uid() is null then
        raise exception 'a private gist needs an authenticated author'
            using errcode = 'insufficient_privilege';
    end if;

    insert into gists (author_id, title, description, visibility, expires_at)
    values (auth.uid(), btrim(p_title), coalesce(btrim(p_description), ''), p_visibility, p_expires_at)
    returning * into g;

    insert into gist_files (
        gist_id, position, filename, language, content, storage_path, byte_size, blob_expires_at
    )
    select
        g.id,
        (ordinal - 1)::smallint,
        btrim(f ->> 'filename'),
        nullif(f ->> 'language', ''),
        f ->> 'content',
        f ->> 'storage_path',
        coalesce((f ->> 'byte_size')::int, octet_length(f ->> 'content'), 0),
        requested_blob_expiry(f)
    from jsonb_array_elements(p_files) with ordinality as t(f, ordinal);

    return gist_payload(g);
end;
$$;

-- Update metadata only. Editing file bodies goes through replace_gist_files, so the
-- render-invalidation trigger has a single path to fire on.
create or replace function update_gist(
    p_slug        text,
    p_title       text default null,
    p_description text default null,
    p_visibility  gist_visibility default null,
    p_expires_at  timestamptz default null
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
        expires_at  = coalesce(p_expires_at, expires_at)
    where slug = p_slug
      and author_id = auth.uid()
    returning * into g;

    if not found then
        return null;
    end if;

    return gist_payload(g);
end;
$$;

-- Superseded by 0008_revisions.sql, which redefines this function to snapshot the
-- file set it is about to overwrite. Change it there; this definition never runs
-- after 0008 has been applied.
create or replace function replace_gist_files(p_slug text, p_files jsonb)
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
    if jsonb_array_length(p_files) not between 1 and 20 then
        raise exception 'a gist takes between 1 and 20 files' using errcode = 'check_violation';
    end if;

    select * into g from gists where slug = p_slug and author_id = auth.uid();
    if not found then
        return null;
    end if;

    delete from gist_files where gist_id = g.id;

    insert into gist_files (
        gist_id, position, filename, language, content, storage_path, byte_size, blob_expires_at
    )
    select
        g.id,
        (ordinal - 1)::smallint,
        btrim(f ->> 'filename'),
        nullif(f ->> 'language', ''),
        f ->> 'content',
        f ->> 'storage_path',
        coalesce((f ->> 'byte_size')::int, octet_length(f ->> 'content'), 0),
        requested_blob_expiry(f)
    from jsonb_array_elements(p_files) with ordinality as t(f, ordinal);

    select * into g from gists where id = g.id;
    return gist_payload(g);
end;
$$;

create or replace function delete_gist(p_slug text)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
    if auth.uid() is null then
        raise exception 'authentication required' using errcode = 'insufficient_privilege';
    end if;

    -- The cascade into gist_files fires enqueue_orphaned_blob for each blob.
    delete from gists where slug = p_slug and author_id = auth.uid();
    return found;
end;
$$;

-- Keyset pagination, not offset: page 500 of a feed costs the same as page 1.
create or replace function list_gists(
    p_handle text default null,
    p_limit  int default 30,
    p_before timestamptz default null
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(jsonb_agg(gist_payload(g) order by g.created_at desc), '[]'::jsonb)
    from gists g
    left join profiles p on p.id = g.author_id
    where (g.expires_at is null or g.expires_at > now())
      and (p_before is null or g.created_at < p_before)
      and case
            when p_handle is null then g.visibility = 'public'
            -- Your own listing shows unlisted and private gists too.
            when p.handle = p_handle and g.author_id = auth.uid() then true
            else p.handle = p_handle and g.visibility = 'public'
          end
    limit least(greatest(p_limit, 1), 100);
$$;

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
        select websearch_to_tsquery('english', p_query) as tsq
    ),
    -- Rank and limit together. Ranking after the limit would sort an arbitrary page.
    matches as (
        select
            g.id,
            ts_rank(g.search_vector, q.tsq)
                -- A title match outranks a body match, so file content is discounted.
                + coalesce((
                    select max(ts_rank(f.search_vector, q.tsq)) * 0.5
                    from gist_files f where f.gist_id = g.id
                  ), 0) as rank
        from gists g, q
        where g.visibility = 'public'
          and (g.expires_at is null or g.expires_at > now())
          and (
              g.search_vector @@ q.tsq
              or exists (
                  select 1 from gist_files f
                  where f.gist_id = g.id and f.search_vector @@ q.tsq
              )
          )
        order by rank desc
        limit least(greatest(p_limit, 1), 100)
    )
    select coalesce(jsonb_agg(gist_payload(g) order by m.rank desc), '[]'::jsonb)
    from matches m
    join gists g on g.id = m.id;
$$;

-- The render cache has no RLS policies, so this is the only way in.
create or replace function cache_render(
    p_file_id       uuid,
    p_html          text,
    p_renderer_hash text
)
returns void
language sql
volatile
security definer
set search_path = public
as $$
    insert into gist_file_renders (file_id, html, renderer_hash)
    values (p_file_id, p_html, p_renderer_hash)
    on conflict (file_id) do update
        set html = excluded.html,
            renderer_hash = excluded.renderer_hash,
            rendered_at = now();
$$;

-- Scheduled in 0004. Blobs are handled by the trigger, not by this function.
create or replace function delete_expired_gists()
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    removed integer;
begin
    with gone as (
        delete from gists
        where expires_at is not null and expires_at <= now()
        returning 1
    )
    select count(*) into removed from gone;

    return removed;
end;
$$;

-- Anonymous callers may read and create; everything else needs a real session.
-- gist_payload and cache_render are internal, so neither role gets them.
revoke all on function gist_payload(gists), requested_blob_expiry(jsonb),
                       cache_render(uuid, text, text),
                       delete_expired_gists() from public, anon, authenticated;

grant execute on function get_gist(text)                 to anon, authenticated;
grant execute on function list_gists(text, int, timestamptz) to anon, authenticated;
grant execute on function search_gists(text, int)        to anon, authenticated;
grant execute on function create_gist(text, text, gist_visibility, timestamptz, jsonb)
                                                         to anon, authenticated;
grant execute on function update_gist(text, text, text, gist_visibility, timestamptz)
                                                         to authenticated;
grant execute on function replace_gist_files(text, jsonb) to authenticated;
grant execute on function delete_gist(text)              to authenticated;
