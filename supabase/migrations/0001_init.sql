-- quickgist core schema.
-- Replaces the Firestore `userSnippets` collection, which stored one flat document
-- per gist with a single inline file and no constraints.

-- A gist is reachable by slug. `public` gists are listed, `unlisted` ones need the
-- link, `private` ones need to be the author. This replaces the old `isDraft` bool,
-- which conflated "not finished" with "not listed".
create type gist_visibility as enum ('public', 'unlisted', 'private');

-- Mirror of auth.users, so gists can reference a profile without a foreign key into
-- the auth schema and without duplicating email into application tables.
create table profiles (
    id            uuid primary key references auth.users (id) on delete cascade,
    handle        text not null unique
                  check (handle ~ '^[a-z0-9][a-z0-9-]{1,38}$'),
    display_name  text,
    avatar_url    text,
    created_at    timestamptz not null default now()
);

comment on table profiles is 'Public user data, kept in sync with auth.users by handle_new_user().';

-- Slugs are the public identifier, and for an `unlisted` gist the slug *is* the
-- authorization, so it has to be unguessable.
--
-- The alphabet is 32 characters, which is exactly 5 bits each: 12 characters is 60
-- unbiased bits. A 33-character alphabet would make `% 32` a biased `% 33` instead.
-- Both `l` and `o` are omitted so a slug read aloud or retyped cannot collide with
-- `1` or `0`. Entropy comes from gen_random_uuid(), which is core Postgres and needs
-- no extension on the search_path.
create or replace function generate_slug()
returns text
language sql
volatile
as $$
    select string_agg(
        substr('abcdefghijkmnpqrstuvwxyz23456789', 1 + (get_byte(b, i) & 31), 1),
        ''
    )
    from (select decode(replace(gen_random_uuid()::text, '-', ''), 'hex') as b) g,
         generate_series(0, 11) as i;
$$;

create table gists (
    id          uuid primary key default gen_random_uuid(),
    slug        text not null unique default generate_slug(),
    author_id   uuid references profiles (id) on delete set null,
    title       text not null check (length(btrim(title)) between 1 and 200),
    description text not null default '' check (length(description) <= 2000),
    visibility  gist_visibility not null default 'unlisted',
    view_count  bigint not null default 0 check (view_count >= 0),
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    expires_at  timestamptz check (expires_at > created_at),

    -- A private gist nobody owns would be unreachable by anyone, including its creator.
    constraint private_gists_need_an_author
        check (visibility <> 'private' or author_id is not null)
);

comment on column gists.expires_at is 'Null means never. Enforced by delete_expired_gists(), scheduled in 0004.';

-- A gist has many files. The old schema allowed exactly one inline body plus one
-- attachment, which is why multi-file sharing needed a rewrite rather than a column.
create table gist_files (
    id           uuid primary key default gen_random_uuid(),
    gist_id      uuid not null references gists (id) on delete cascade,
    position     smallint not null check (position >= 0),
    filename     text not null check (length(btrim(filename)) between 1 and 255),
    language     text,
    content      text check (length(content) <= 1048576),
    storage_path text,
    byte_size    integer not null check (byte_size >= 0),
    created_at   timestamptz not null default now(),

    -- Uploads expire. The caller chooses how long, up to a hard ceiling of 30 days.
    -- Set by set_blob_expiry() rather than a column default, so no insert path can
    -- skip it and none can exceed the ceiling.
    blob_expires_at timestamptz,

    -- Text lives in Postgres so it is searchable and renderable; binaries live in
    -- object storage. Exactly one, never both, never neither.
    constraint text_or_blob_not_both
        check ((content is null) <> (storage_path is null)),

    -- An upload without an expiry would be retained forever, which is the bug this
    -- constraint exists to make unrepresentable.
    constraint blobs_always_expire
        check ((storage_path is null) = (blob_expires_at is null)),

    -- The 30-day ceiling, enforced by the database rather than trusted to callers.
    -- A CHECK cannot call now(), so it compares against this row's own created_at,
    -- which is equivalent at insert time and immutable afterwards.
    constraint blob_retention_within_ceiling
        check (
            blob_expires_at is null
            or (blob_expires_at > created_at
                and blob_expires_at <= created_at + interval '30 days')
        ),

    unique (gist_id, position),
    unique (gist_id, filename)
);

create index gist_files_gist_id_idx on gist_files (gist_id, position);

create index gist_files_blob_expiry_idx
    on gist_files (blob_expires_at)
    where blob_expires_at is not null;

-- Retention is caller-chosen but capped. This is a trigger and not a column default
-- because it must also apply to an update that turns a text file into an upload, and
-- because a default cannot clamp a value the caller supplied.
--
-- Out-of-range requests are clamped rather than rejected, so this is a backstop and
-- never the error a client sees: the API validates the range first and returns 422.
create or replace function set_blob_expiry()
returns trigger
language plpgsql
as $$
declare
    ceiling timestamptz;
begin
    if new.storage_path is null then
        new.blob_expires_at := null;
        return new;
    end if;

    ceiling := new.created_at + interval '30 days';

    new.blob_expires_at := least(
        coalesce(new.blob_expires_at, ceiling),
        ceiling
    );

    -- An expiry already in the past would make the upload unreadable from the moment
    -- it was stored.
    if new.blob_expires_at <= new.created_at then
        new.blob_expires_at := new.created_at + interval '1 hour';
    end if;

    return new;
end;
$$;

create trigger gist_files_set_blob_expiry
    before insert or update of storage_path on gist_files
    for each row
    execute function set_blob_expiry();

-- Rendered Markdown and highlighted code are expensive and pure, so they are cached
-- next to the source and invalidated by the trigger below when content changes.
create table gist_file_renders (
    file_id       uuid primary key references gist_files (id) on delete cascade,
    html          text not null,
    renderer_hash text not null,
    rendered_at   timestamptz not null default now()
);

comment on column gist_file_renders.renderer_hash is 'Renderer version. A deploy that changes rendering bumps it, which invalidates every row without a migration.';

create index gists_author_created_idx
    on gists (author_id, created_at desc)
    where author_id is not null;

create index gists_public_created_idx
    on gists (created_at desc)
    where visibility = 'public';

create index gists_expires_at_idx
    on gists (expires_at)
    where expires_at is not null;

-- Full-text search over title and description. File content is indexed separately so
-- a huge file cannot dominate the ranking of its own gist.
alter table gists add column search_vector tsvector
    generated always as (
        setweight(to_tsvector('english', title), 'A') ||
        setweight(to_tsvector('english', description), 'B')
    ) stored;

create index gists_search_idx on gists using gin (search_vector);

alter table gist_files add column search_vector tsvector
    generated always as (
        setweight(to_tsvector('english', filename), 'A') ||
        setweight(to_tsvector('english', coalesce(content, '')), 'D')
    ) stored;

create index gist_files_search_idx on gist_files using gin (search_vector);

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

create trigger gists_touch_updated_at
    before update on gists
    for each row
    execute function touch_updated_at();

-- Editing a file is editing its gist, so the parent timestamp has to follow.
create or replace function touch_parent_gist()
returns trigger
language plpgsql
as $$
begin
    update gists set updated_at = now()
    where id = coalesce(new.gist_id, old.gist_id);
    return null;
end;
$$;

create trigger gist_files_touch_parent
    after insert or update or delete on gist_files
    for each row
    execute function touch_parent_gist();

-- Changing content invalidates the cached HTML. Deleting the row is correct here:
-- the renderer treats a missing row as a cache miss and repopulates it.
create or replace function invalidate_render()
returns trigger
language plpgsql
as $$
begin
    if new.content is distinct from old.content then
        delete from gist_file_renders where file_id = new.id;
    end if;
    return new;
end;
$$;

create trigger gist_files_invalidate_render
    after update of content on gist_files
    for each row
    execute function invalidate_render();

-- Every new auth user gets a profile, so application code never has to check whether
-- one exists. The handle is derived from the OAuth metadata and de-duplicated.
-- Postgres cannot reach the storage bucket, so a deleted file's blob would leak and
-- bill forever. Every deletion path -- author delete, expiry sweep, or the cascade
-- from dropping a gist -- passes through this trigger, so there is one mechanism to
-- get right instead of a return value on three separate functions.
create table orphaned_blobs (
    storage_path text primary key,
    orphaned_at  timestamptz not null default now()
);

comment on table orphaned_blobs is 'Work queue drained by the Go janitor, which owns bucket access.';

create index orphaned_blobs_orphaned_at_idx on orphaned_blobs (orphaned_at);

create or replace function enqueue_orphaned_blob()
returns trigger
language plpgsql
as $$
begin
    if old.storage_path is not null then
        insert into orphaned_blobs (storage_path)
        values (old.storage_path)
        on conflict (storage_path) do nothing;
    end if;
    return null;
end;
$$;

create trigger gist_files_enqueue_orphaned_blob
    after delete on gist_files
    for each row
    execute function enqueue_orphaned_blob();

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    base_handle text;
    candidate   text;
    suffix      int := 0;
begin
    base_handle := regexp_replace(
        lower(coalesce(
            new.raw_user_meta_data ->> 'user_name',
            new.raw_user_meta_data ->> 'preferred_username',
            split_part(new.email, '@', 1),
            'user'
        )),
        '[^a-z0-9-]', '', 'g'
    );

    if length(base_handle) < 2 then
        base_handle := 'user' || base_handle;
    end if;
    base_handle := left(base_handle, 32);

    candidate := base_handle;
    while exists (select 1 from profiles where handle = candidate) loop
        suffix := suffix + 1;
        candidate := left(base_handle, 32 - length(suffix::text) - 1) || '-' || suffix;
    end loop;

    insert into profiles (id, handle, display_name, avatar_url)
    values (
        new.id,
        candidate,
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'avatar_url'
    );

    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function handle_new_user();
