-- Authorization lives here, not in Go handlers.
--
-- The old backend had none: `userId` arrived as a form field on create and a query
-- parameter on list, so any caller could forge a gist as anyone or read anyone's
-- gists. These policies make that impossible even if a handler forgets to check.
--
-- Note that `unlisted` is deliberately absent from the SELECT policy. An unlisted
-- gist is reachable only through get_gist_by_slug(), which requires knowing the
-- 60-bit slug. If `unlisted` were selectable, a direct `select * from gists` with
-- the anon key would dump every unlisted gist and the mode would mean nothing.

alter table profiles          enable row level security;
alter table gists             enable row level security;
alter table gist_files        enable row level security;
alter table gist_file_renders enable row level security;

-- Profiles are public: a gist page shows its author.
create policy profiles_are_readable
    on profiles for select
    using (true);

create policy profiles_updatable_by_owner
    on profiles for update
    to authenticated
    using (id = (select auth.uid()))
    with check (id = (select auth.uid()));

-- Only public gists are enumerable. Everything else goes through an RPC.
create policy gists_public_or_own_are_readable
    on gists for select
    using (
        visibility = 'public'
        or author_id = (select auth.uid())
    );

-- An authenticated caller may only create gists attributed to themselves.
-- Anonymous gists are created by create_gist(), which is security definer.
create policy gists_insertable_by_author
    on gists for insert
    to authenticated
    with check (author_id = (select auth.uid()));

-- with check as well as using, so an author cannot reassign a gist to someone else.
create policy gists_updatable_by_author
    on gists for update
    to authenticated
    using (author_id = (select auth.uid()))
    with check (author_id = (select auth.uid()));

create policy gists_deletable_by_author
    on gists for delete
    to authenticated
    using (author_id = (select auth.uid()));

-- Files inherit their gist's authorization rather than restating it, so the two can
-- never drift apart.
create policy gist_files_follow_gist_read
    on gist_files for select
    using (
        exists (
            select 1 from gists g
            where g.id = gist_files.gist_id
              and (g.visibility = 'public' or g.author_id = (select auth.uid()))
        )
    );

create policy gist_files_follow_gist_write
    on gist_files for all
    to authenticated
    using (
        exists (
            select 1 from gists g
            where g.id = gist_files.gist_id
              and g.author_id = (select auth.uid())
        )
    )
    with check (
        exists (
            select 1 from gists g
            where g.id = gist_files.gist_id
              and g.author_id = (select auth.uid())
        )
    );

-- Rendered HTML is a cache with no policies at all: RLS is enabled and nothing is
-- granted, so only security-definer functions can touch it.
