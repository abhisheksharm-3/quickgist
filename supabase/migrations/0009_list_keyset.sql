-- A keyset that cannot skip a row.
--
-- The cursor was created_at alone, compared with a strict <. Two gists created in
-- the same instant therefore fell on the same side of it, and the page after the
-- first silently dropped every one of them: seeding 25 gists in one transaction,
-- where now() is fixed, returned 20 rows and then 1.
--
-- The fix is a cursor over a pair that is unique. slug is unique, stable and already
-- public, so it needs nothing exposed that was not exposed before, and (created_at,
-- slug) makes both the ordering and the comparison total.

create or replace function list_gists(
    p_handle      text default null,
    p_limit       int default 30,
    p_before      timestamptz default null,
    p_before_slug text default null
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    with visible as (
        select g.*
        from gists g
        left join profiles p on p.id = g.author_id
        where (g.expires_at is null or g.expires_at > now())
          and (
                p_before is null
                or (g.created_at, g.slug) < (p_before, coalesce(p_before_slug, ''))
              )
          and case
                when p_handle is null then g.visibility = 'public'
                when p.handle = p_handle and g.author_id = auth.uid() then true
                else p.handle = p_handle and g.visibility = 'public'
              end
        order by g.created_at desc, g.slug desc
        limit least(greatest(p_limit, 1), 100)
    )
    select coalesce(
        jsonb_agg(gist_summary(v.*::gists) order by v.created_at desc, v.slug desc),
        '[]'::jsonb
    )
    from visible v;
$$;

-- The three-argument form is gone, so nothing can call the version that skips rows.
drop function if exists list_gists(text, int, timestamptz);

grant execute on function list_gists(text, int, timestamptz, text) to anon, authenticated;
