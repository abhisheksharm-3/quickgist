-- Behavioural check for the schema, policies and RPCs.
-- Runs in a transaction and rolls back, so it is safe against a live database:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/smoke.sql
-- Any failed assertion aborts with a message naming what broke.

begin;

set local client_min_messages = notice;

/*
  The assertions below count rows, so they need a known starting point. Clearing the
  tables inside the transaction gives one without touching real data, because the
  rollback at the end puts everything back.
*/
delete from gists;
delete from orphaned_blobs;

do $$
declare
    author_id  uuid := gen_random_uuid();
    pub_slug   text;
    priv_slug  text;
    blob_slug  text;
    rev_slug    text;
    page        jsonb;
    cursor_ts   timestamptz;
    cursor_slug text;
    total          int;
    unlisted_slug  text;
    exp_slug       text;
    second_author  uuid;
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

    -- ---- revisions --------------------------------------------------------
    -- Saving files keeps what they were, and the history is readable by anyone who
    -- can read the gist.
    perform set_config('request.jwt.claims',
        json_build_object('sub', author_id::text)::text, true);

    payload := create_gist(
        p_title      => 'Versioned',
        p_visibility => 'public',
        p_files      => '[{"filename":"a.md","content":"one"}]'::jsonb
    );
    rev_slug := payload ->> 'slug';

    assert jsonb_array_length(list_revisions(rev_slug)) = 0,
        'a gist had a revision before it was ever saved';

    perform replace_gist_files(rev_slug, '[{"filename":"a.md","content":"two"}]'::jsonb);
    perform replace_gist_files(rev_slug, '[{"filename":"a.md","content":"three"}]'::jsonb);

    n := jsonb_array_length(list_revisions(rev_slug));
    assert n = 2, format('two saves left %s revisions, expected 2', n);

    assert get_revision(rev_slug, 1) -> 'files' -> 0 ->> 'content' = 'one',
        'revision 1 did not hold the text it replaced';
    assert get_revision(rev_slug, 2) -> 'files' -> 0 ->> 'content' = 'two',
        'revision 2 did not hold the text it replaced';
    assert get_revision(rev_slug, 9) is null, 'a revision that does not exist was returned';

    -- Restoring is itself a save, so it snapshots what it overwrites.
    perform restore_revision(rev_slug, 1);
    assert (select content from gist_files where gist_id = (select id from gists where slug = rev_slug))
        = 'one', 'restore did not put the old text back';
    n := jsonb_array_length(list_revisions(rev_slug));
    assert n = 3, format('restore left %s revisions, expected 3', n);

    -- A reader sees the history; a stranger cannot restore it.
    perform set_config('request.jwt.claims', null, true);
    assert jsonb_array_length(list_revisions(rev_slug)) = 3,
        'an anonymous reader could not see a public gist''s history';

    begin
        perform restore_revision(rev_slug, 1);
        assert false, 'an anonymous caller was allowed to restore a revision';
    exception when insufficient_privilege then null;
    end;

    -- A private gist keeps its history private.
    perform set_config('request.jwt.claims',
        json_build_object('sub', author_id::text)::text, true);
    perform update_gist(p_slug => rev_slug, p_visibility => 'private');
    perform set_config('request.jwt.claims', null, true);
    assert list_revisions(rev_slug) is null,
        'a private gist exposed its history to an anonymous caller';

    -- ---- keyset paging and search ------------------------------------------
    -- Two gists created in the same instant must not fall on the same side of a
    -- cursor: created_at alone put them there and the second page lost them.
    perform set_config('request.jwt.claims', null, true);

    for n in 1..5 loop
        payload := create_gist(
            p_title      => 'Paged ' || n,
            p_visibility => 'public',
            p_files      => '[{"filename":"p.md","content":"x"}]'::jsonb
        );
    end loop;

    total := jsonb_array_length(list_gists(null, 100, null));

    page := list_gists(null, 3, null);
    assert jsonb_array_length(page) = 3,
        format('first page held %s rows, expected 3', jsonb_array_length(page));

    cursor_ts := ((page -> -1) ->> 'created_at')::timestamptz;
    cursor_slug := (page -> -1) ->> 'slug';

    n := jsonb_array_length(list_gists(null, 100, cursor_ts, cursor_slug));
    assert n = total - 3,
        format('the page after the cursor held %s rows, expected the remaining %s', n, total - 3);

    -- The same cursor without its slug is the bug this replaced: every row sharing
    -- the boundary timestamp fell on the wrong side of a strict comparison.
    assert jsonb_array_length(list_gists(null, 100, cursor_ts, null)) < n,
        'a timestamp-only cursor no longer loses rows, so the slug half is untested';

    -- Search matches a prefix, because somebody is still typing.
    assert jsonb_array_length(search_gists('page')) = 5,
        'search did not match the whole word';
    assert jsonb_array_length(search_gists('pag')) = 5,
        'search did not match a prefix of the word';
    assert jsonb_array_length(search_gists('&!')) = 0,
        'punctuation alone matched something';
    assert jsonb_array_length(search_gists('')) = 0,
        'an empty search matched something';

    -- A search result is a summary: sending every matched document would make a
    -- search of a large corpus a download.
    assert not ((search_gists('page') -> 0 -> 'files' -> 0) ? 'content'),
        'search returned file contents';

    -- ---- unlisted, which the whole visibility design rests on ----------------
    -- It was the one mode nothing asserted: reachable by slug, absent from every
    -- listing, invisible to search.
    perform set_config('request.jwt.claims',
        json_build_object('sub', author_id::text)::text, true);

    payload := create_gist(
        p_title      => 'Unlisted note',
        p_visibility => 'unlisted',
        p_files      => '[{"filename":"u.md","content":"secret-ish"}]'::jsonb
    );
    unlisted_slug := payload ->> 'slug';

    perform set_config('request.jwt.claims', null, true);

    assert get_gist(unlisted_slug) is not null,
        'an unlisted gist was not readable by slug';
    assert not exists (
        select 1 from jsonb_array_elements(list_gists(null, 100, null, null)) g
        where g ->> 'slug' = unlisted_slug
    ), 'an unlisted gist appeared in the public feed';
    assert jsonb_array_length(search_gists('unlisted note')) = 0,
        'an unlisted gist was searchable';
    assert not exists (
        select 1 from jsonb_array_elements(list_gists('smoketester', 100, null, null)) g
        where g ->> 'slug' = unlisted_slug
    ), 'an unlisted gist appeared on its author''s public page to a stranger';

    -- ---- reading for a machine does not count as a view ----------------------
    n := (get_gist_meta(unlisted_slug) ->> 'view_count')::int;
    perform get_gist_meta(unlisted_slug);
    perform get_gist_meta(unlisted_slug);
    assert (get_gist_meta(unlisted_slug) ->> 'view_count')::int = n,
        'get_gist_meta counted a view';

    -- ---- an expired gist leaves every listing, not just get_gist -------------
    perform set_config('request.jwt.claims',
        json_build_object('sub', author_id::text)::text, true);
    payload := create_gist(
        p_title      => 'Expiring soon',
        p_visibility => 'public',
        p_files      => '[{"filename":"e.md","content":"gone"}]'::jsonb
    );
    exp_slug := payload ->> 'slug';
    update gists set created_at = now() - interval '2 days',
                     expires_at = now() - interval '1 day'
     where slug = exp_slug;

    assert get_gist(exp_slug) is null, 'an expired gist was readable';
    assert get_gist_meta(exp_slug) is null, 'an expired gist was readable without a view';
    assert not exists (
        select 1 from jsonb_array_elements(list_gists(null, 100, null, null)) g
        where g ->> 'slug' = exp_slug
    ), 'an expired gist stayed in the feed';
    assert jsonb_array_length(search_gists('expiring')) = 0,
        'an expired gist stayed searchable';

    -- ---- an expiry can be removed once set ----------------------------------
    perform update_gist(p_slug => rev_slug, p_expires_at => now() + interval '5 days');
    assert (select expires_at is not null from gists where slug = rev_slug),
        'an expiry was not set';
    perform update_gist(p_slug => rev_slug, p_clear_expiry => true);
    assert (select expires_at is null from gists where slug = rev_slug),
        'an expiry could not be cleared';

    -- ---- restoring puts back the title, not only the files -------------------
    perform update_gist(p_slug => rev_slug, p_title => 'Renamed since');
    perform restore_revision(rev_slug, 1);
    assert (select title from gists where slug = rev_slug) = 'Versioned',
        'restore left the gist under a title from a different version';

    -- ---- the bounds, at their edges -----------------------------------------
    begin
        perform create_gist(
            p_title      => 'Too many',
            p_visibility => 'public',
            p_files      => (
                select jsonb_agg(jsonb_build_object('filename', 'f' || i || '.md', 'content', 'x'))
                from generate_series(1, 21) i
            )
        );
        assert false, 'a gist was allowed twenty-one files';
    exception when check_violation then null;
    end;

    assert jsonb_array_length(list_gists(null, 0, null, null)) <= 1,
        'a zero limit was not clamped to one row';
    assert jsonb_array_length(list_gists(null, 1000, null, null)) <= 100,
        'a thousand-row request was not clamped to a hundred';

    -- ---- the handle trigger's harder branches -------------------------------
    second_author := gen_random_uuid();
    insert into auth.users (id, email, raw_user_meta_data)
    values (second_author, 'smoke2@example.com', '{"user_name":"Smoke.Tester"}'::jsonb);
    select p.handle into handle from profiles p where p.id = second_author;
    assert handle = 'smoketester-1',
        format('a duplicate handle was not de-duplicated, got %L', handle);

    -- ---- authorization, in the direction the suite did not cover -------------
    perform set_config('request.jwt.claims', null, true);
    begin
        perform replace_gist_files(rev_slug, '[{"filename":"a.md","content":"nope"}]'::jsonb);
        assert false, 'an anonymous caller replaced a gist''s files';
    exception when insufficient_privilege then null;
    end;

    perform set_config('request.jwt.claims',
        json_build_object('sub', second_author::text)::text, true);
    assert replace_gist_files(rev_slug, '[{"filename":"a.md","content":"nope"}]'::jsonb) is null,
        'another user replaced the files of a gist they do not own';
    assert restore_revision(rev_slug, 1) is null,
        'another user restored a revision of a gist they do not own';

    raise notice 'ALL ASSERTIONS PASSED';
end;
$$;

rollback;
