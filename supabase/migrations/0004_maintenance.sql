-- Scheduled work and the storage bucket.

create extension if not exists pg_cron;

-- Expiry is a database concern. Putting it on a Go ticker would mean gists stop
-- expiring whenever the API is scaled to zero or redeployed.
select cron.schedule(
    'delete-expired-gists',
    '*/15 * * * *',
    $$select delete_expired_gists()$$
);

-- Uploads are retained 30 days. Deleting the row fires enqueue_orphaned_blob, so
-- the bucket object is cleaned up by the same janitor that handles every other
-- deletion. A gist left with no files at all is removed too, since a gist whose only
-- content was an expired upload has nothing left to show.
create or replace function delete_expired_blobs()
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
        delete from gist_files
        where blob_expires_at is not null and blob_expires_at <= now()
        returning 1
    )
    select count(*) into removed from gone;

    delete from gists g
    where not exists (select 1 from gist_files f where f.gist_id = g.id);

    return removed;
end;
$$;

select cron.schedule(
    'delete-expired-blobs',
    '7 * * * *',
    $$select delete_expired_blobs()$$
);

-- Private bucket. Reads go through the API, which checks visibility first; a public
-- bucket would make every `private` gist's attachment world-readable by URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'gist-files',
    'gist-files',
    false,
    10485760,
    null
)
on conflict (id) do update
    set public = false,
        file_size_limit = excluded.file_size_limit;

-- No storage policies are created on purpose. Only the service role touches this
-- bucket, and it bypasses them; granting anon or authenticated direct object access
-- would route around the visibility check in get_gist.

-- Drained by the Go janitor: it deletes the object, then the row.
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
    limit least(greatest(p_limit, 1), 1000);
$$;

create or replace function release_orphaned_blob(p_storage_path text)
returns void
language sql
volatile
security definer
set search_path = public
as $$
    delete from orphaned_blobs where storage_path = p_storage_path;
$$;

revoke all on function claim_orphaned_blobs(int), release_orphaned_blob(text),
                       delete_expired_blobs()
    from public, anon, authenticated;
