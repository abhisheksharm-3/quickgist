-- Revision history.
--
-- Files are replaced wholesale on every save, so the state being thrown away is a
-- complete file set. Keeping it is the whole feature: a snapshot of what the gist
-- was, taken by the function that is about to overwrite it, which is the only place
-- that can be sure a version existed.
--
-- The snapshot is jsonb rather than rows in gist_files, because a revision is read
-- as a document and never joined, indexed, or searched. One row per version keeps
-- the current file set the only thing the rest of the schema has to reason about.

create table if not exists gist_revisions (
    id          uuid primary key default gen_random_uuid(),
    gist_id     uuid not null references gists(id) on delete cascade,
    revision    integer not null,
    title       text not null,
    description text not null default '',
    files       jsonb not null,
    created_at  timestamptz not null default now(),

    unique (gist_id, revision),
    constraint gist_revisions_files_is_array check (jsonb_typeof(files) = 'array')
);

create index if not exists gist_revisions_gist_idx
    on gist_revisions (gist_id, revision desc);

-- No policies, deliberately. Every read and write goes through the functions below,
-- which apply the same visibility rule the gist itself has. A table with RLS on and
-- no policy is unreachable except through a security definer function, which is how
-- unlisted gists already work.
alter table gist_revisions enable row level security;

-- The current file set, in the shape a revision stores and replace_gist_files takes.
create or replace function gist_file_snapshot(p_gist_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(
        jsonb_agg(
            jsonb_strip_nulls(jsonb_build_object(
                'filename', f.filename,
                'language', f.language,
                'content', f.content,
                'storage_path', f.storage_path,
                'byte_size', f.byte_size
            ))
            order by f.position
        ),
        '[]'::jsonb
    )
    from gist_files f
    where f.gist_id = p_gist_id;
$$;

-- Take a snapshot of a gist as it stands, returning the revision number used.
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
    files := gist_file_snapshot(p_gist.id);

    if jsonb_array_length(files) = 0 then
        return null;
    end if;

    select coalesce(max(revision), 0) + 1 into next_revision
    from gist_revisions
    where gist_id = p_gist.id;

    insert into gist_revisions (gist_id, revision, title, description, files)
    values (p_gist.id, next_revision, p_gist.title, p_gist.description, files);

    return next_revision;
end;
$$;

-- Replace a gist's files, keeping what was there as a revision first.
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

    perform snapshot_gist(g);

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

-- The version list. Readable by whoever can read the gist, so a reader can see how
-- a document changed and not only what it says now.
create or replace function list_revisions(p_slug text)
returns jsonb
language plpgsql
stable
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

    return coalesce(
        (
            select jsonb_agg(
                jsonb_build_object(
                    'revision', r.revision,
                    'title', r.title,
                    'fileCount', jsonb_array_length(r.files),
                    'createdAt', r.created_at
                )
                order by r.revision desc
            )
            from gist_revisions r
            where r.gist_id = g.id
        ),
        '[]'::jsonb
    );
end;
$$;

-- One revision, with the text of its files.
create or replace function get_revision(p_slug text, p_revision integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
    g gists;
    r gist_revisions;
begin
    select * into g from gists where slug = p_slug;

    if not found or (g.expires_at is not null and g.expires_at <= now()) then
        return null;
    end if;
    if g.visibility = 'private' and g.author_id is distinct from auth.uid() then
        return null;
    end if;

    select * into r from gist_revisions
    where gist_id = g.id and revision = p_revision;

    if not found then
        return null;
    end if;

    return jsonb_build_object(
        'revision', r.revision,
        'title', r.title,
        'description', r.description,
        'createdAt', r.created_at,
        'files', r.files
    );
end;
$$;

-- Put a revision back. The current state is snapshotted first by
-- replace_gist_files, so restoring is itself undoable.
create or replace function restore_revision(p_slug text, p_revision integer)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
    g     gists;
    files jsonb;
begin
    if auth.uid() is null then
        raise exception 'authentication required' using errcode = 'insufficient_privilege';
    end if;

    select * into g from gists where slug = p_slug and author_id = auth.uid();
    if not found then
        return null;
    end if;

    select r.files into files from gist_revisions r
    where r.gist_id = g.id and r.revision = p_revision;

    if files is null then
        return null;
    end if;

    return replace_gist_files(p_slug, files);
end;
$$;

grant execute on function list_revisions(text) to anon, authenticated, service_role;
grant execute on function get_revision(text, integer) to anon, authenticated, service_role;
grant execute on function restore_revision(text, integer) to authenticated, service_role;
