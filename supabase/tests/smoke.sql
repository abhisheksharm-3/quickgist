-- Behavioural check for the schema, policies and RPCs.
-- Runs in a transaction and rolls back, so it is safe against a live database:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/smoke.sql
-- Any failed assertion aborts with a message naming what broke.

begin;

set local client_min_messages = notice;

do $$
declare
    author_id  uuid := gen_random_uuid();
    pub_slug   text;
    priv_slug  text;
    blob_slug  text;
    payload    jsonb;
    handle     text;
    n          int;
begin
    -- A new auth user must get a profile, with a handle derived from OAuth metadata.
    insert into auth.users (id, email, raw_user_meta_data)
    values (author_id, 'smoke@example.com',
            '{"user_name":"Smoke.Tester","full_name":"Smoke Tester"}'::jsonb);

    select p.handle into handle from profiles p where p.id = author_id;
    assert handle = 'smoketester', format('handle not derived, got %L', handle);

    -- ---- anonymous create -------------------------------------------------
    perform set_config('request.jwt.claims', null, true);

    payload := create_gist(
        p_title       => '  Readme  ',
        p_description => 'notes',
        p_visibility  => 'public',
        p_files       => '[{"filename":"README.md","language":"markdown","content":"# hi"}]'::jsonb
    );
    pub_slug := payload ->> 'slug';

    assert payload ->> 'title' = 'Readme', 'title was not trimmed';
    assert payload ->> 'author' is null, 'anonymous gist gained an author';
    assert length(pub_slug) = 12, format('slug length %s, expected 12', length(pub_slug));
    assert jsonb_array_length(payload -> 'files') = 1, 'file was not inserted';
    assert payload -> 'files' -> 0 ->> 'content' = '# hi', 'content did not round-trip';
    assert (payload -> 'files' -> 0 ->> 'byte_size')::int = 4, 'byte_size not computed';

    -- An anonymous private gist is unreachable by anyone, so it must be refused.
    begin
        perform create_gist(p_title => 'x', p_visibility => 'private',
                            p_files => '[{"filename":"a.txt","content":"a"}]'::jsonb);
        assert false, 'anonymous private gist was allowed';
    exception when insufficient_privilege then null;
    end;

    -- A gist with no files is meaningless.
    begin
        perform create_gist(p_title => 'x', p_files => '[]'::jsonb);
        assert false, 'gist with zero files was allowed';
    exception when check_violation then null;
    end;

    -- ---- view counting ----------------------------------------------------
    payload := get_gist(pub_slug);
    assert (payload ->> 'view_count')::int = 1,
        format('first view counted %s', payload ->> 'view_count');
    payload := get_gist(pub_slug);
    assert (payload ->> 'view_count')::int = 2, 'view count did not increment';

    assert get_gist('nosuchslug00') is null, 'unknown slug did not return null';

    -- ---- authenticated create --------------------------------------------
    perform set_config('request.jwt.claims',
        json_build_object('sub', author_id, 'role', 'authenticated')::text, true);

    payload := create_gist(
        p_title      => 'Secret',
        p_visibility => 'private',
        p_files      => '[{"filename":"s.md","content":"# secret"}]'::jsonb
    );
    priv_slug := payload ->> 'slug';
    assert payload -> 'author' ->> 'handle' = 'smoketester', 'author was not attached';

    assert get_gist(priv_slug) is not null, 'author cannot read own private gist';

    -- The core of the old vulnerability: another identity must not read it.
    perform set_config('request.jwt.claims',
        json_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text, true);
    assert get_gist(priv_slug) is null, 'private gist readable by another user';

    perform set_config('request.jwt.claims', null, true);
    assert get_gist(priv_slug) is null, 'private gist readable anonymously';

    -- ...and must not be editable or deletable by them either.
    perform set_config('request.jwt.claims',
        json_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text, true);
    assert update_gist(priv_slug, p_title => 'pwned') is null, 'gist updatable by non-author';
    assert delete_gist(priv_slug) = false, 'gist deletable by non-author';
    assert (select title from gists where slug = priv_slug) = 'Secret', 'title was changed';

    -- ---- search -----------------------------------------------------------
    perform set_config('request.jwt.claims', null, true);

    assert jsonb_array_length(search_gists('readme')) = 1,
        'title search missed the public gist';
    assert jsonb_array_length(search_gists('secret')) = 0,
        'search leaked a private gist';
    assert jsonb_array_length(search_gists('zzzznomatch')) = 0,
        'search matched nothing but returned rows';

    -- ---- listing ----------------------------------------------------------
    assert jsonb_array_length(list_gists()) = 1, 'public feed wrong size';
    assert jsonb_array_length(list_gists(p_handle => 'smoketester')) = 0,
        'anonymous caller saw a private gist in an author listing';

    perform set_config('request.jwt.claims',
        json_build_object('sub', author_id, 'role', 'authenticated')::text, true);
    assert jsonb_array_length(list_gists(p_handle => 'smoketester')) = 1,
        'author cannot list own private gist';

    -- ---- render cache -----------------------------------------------------
    perform cache_render((payload -> 'files' -> 0 ->> 'id')::uuid, '<h1>secret</h1>', 'v1');
    assert (get_gist(priv_slug) -> 'files' -> 0 ->> 'rendered_html') = '<h1>secret</h1>',
        'cached render not returned';

    -- Editing content must drop the cached HTML, or stale renders are served.
    perform replace_gist_files(priv_slug,
        '[{"filename":"s.md","content":"# changed"}]'::jsonb);
    assert (get_gist(priv_slug) -> 'files' -> 0 ->> 'rendered_html') is null,
        'stale render survived a content change';

    -- ---- expiry -----------------------------------------------------------
    payload := create_gist(
        p_title      => 'Ephemeral',
        p_visibility => 'public',
        p_expires_at => now() + interval '1 hour',
        p_files      => '[{"filename":"e.txt","content":"bye"}]'::jsonb
    );
    assert get_gist(payload ->> 'slug') is not null, 'unexpired gist was hidden';

    -- expires_at > created_at is enforced, so age the whole row rather than trying
    -- to set an expiry that predates creation.
    update gists
       set created_at = now() - interval '2 hours',
           expires_at = now() - interval '1 hour'
     where slug = payload ->> 'slug';
    assert get_gist(payload ->> 'slug') is null, 'expired gist still readable';

    n := delete_expired_gists();
    assert n = 1, format('expiry sweep removed %s rows, expected 1', n);

    -- ---- orphaned blobs ---------------------------------------------------
    payload := create_gist(
        p_title      => 'With blob',
        p_visibility => 'public',
        p_files      => '[{"filename":"a.pdf","storage_path":"g/a.pdf","byte_size":99}]'::jsonb
    );
    blob_slug := payload ->> 'slug';

    -- Deleting the gist cascades into gist_files, and the trigger has to catch it.
    perform delete_gist(blob_slug);
    assert exists (select 1 from orphaned_blobs where storage_path = 'g/a.pdf'),
        'cascade delete did not enqueue the blob for cleanup';

    -- ---- caller-chosen retention, capped at 30 days ----------------------
    payload := create_gist(
        p_title      => 'Short lived',
        p_visibility => 'public',
        p_files      => '[{"filename":"s.bin","storage_path":"g/s.bin","byte_size":5,"retention_days":3}]'::jsonb
    );
    assert (select blob_expires_at from gist_files f
            join gists g on g.id = f.gist_id where g.slug = payload ->> 'slug')
           between now() + interval '2 days' and now() + interval '4 days',
        'a 3-day retention request was not honoured';

    -- A request over the ceiling is clamped to 30 days, never granted.
    payload := create_gist(
        p_title      => 'Too greedy',
        p_visibility => 'public',
        p_files      => '[{"filename":"g.bin","storage_path":"g/g.bin","byte_size":5,"retention_days":3650}]'::jsonb
    );
    assert (select blob_expires_at from gist_files f
            join gists g on g.id = f.gist_id where g.slug = payload ->> 'slug')
           <= now() + interval '30 days' + interval '1 minute',
        'a 3650-day retention request escaped the 30-day ceiling';

    -- Nor can the ceiling be escaped by writing the column directly.
    begin
        update gist_files set blob_expires_at = now() + interval '400 days'
        where storage_path = 'g/g.bin';
        assert (select blob_expires_at from gist_files where storage_path = 'g/g.bin')
               <= now() + interval '30 days' + interval '1 minute',
            'a direct update escaped the 30-day ceiling';
    exception when check_violation then null;
    end;

    -- ---- default 30-day blob retention -----------------------------------
    payload := create_gist(
        p_title      => 'Retained',
        p_visibility => 'public',
        p_files      => '[{"filename":"b.pdf","storage_path":"g/b.pdf","byte_size":10}]'::jsonb
    );
    blob_slug := payload ->> 'slug';

    -- The trigger must stamp an expiry no insert path can omit.
    assert (select blob_expires_at from gist_files f
            join gists g on g.id = f.gist_id where g.slug = blob_slug)
           between now() + interval '29 days' and now() + interval '31 days',
        'upload was not stamped with a 30-day expiry';

    -- An upload with no expiry must be unrepresentable.
    begin
        update gist_files set blob_expires_at = null
        where storage_path = 'g/b.pdf';
        assert false, 'an upload was allowed to have no expiry';
    exception when check_violation then null;
    end;

    -- blob_expires_at > created_at is enforced, so age the row rather than setting
    -- an expiry that predates its own creation.
    -- An upload made 31 days ago under 30-day retention: expired yesterday. The
    -- ceiling is relative to created_at, so both columns move together.
    update gist_files
       set created_at = now() - interval '31 days',
           blob_expires_at = now() - interval '31 days' + interval '30 days'
     where storage_path = 'g/b.pdf';

    n := delete_expired_blobs();
    assert n = 1, format('blob sweep removed %s rows, expected 1', n);
    assert exists (select 1 from orphaned_blobs where storage_path = 'g/b.pdf'),
        'expired upload was not queued for bucket cleanup';
    -- Its only file is gone, so the gist goes with it.
    assert not exists (select 1 from gists where slug = blob_slug),
        'gist survived with zero files after its only upload expired';

    -- A file cannot be both inline text and a stored blob.
    begin
        insert into gist_files (gist_id, position, filename, content, storage_path, byte_size)
        values ((select id from gists where slug = pub_slug), 9, 'both.txt', 'x', 'p/x', 1);
        assert false, 'a file was allowed to be both text and blob';
    exception when check_violation then null;
    end;

    raise notice 'ALL ASSERTIONS PASSED';
end;
$$;

rollback;
