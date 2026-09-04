-- Two fixes to listing, both about work the caller never asked for.
--
-- 1. LIMIT applied to an aggregate limits nothing. `select jsonb_agg(...) ... limit 30`
--    produces exactly one row, so the limit was a no-op and every gist in the table
--    was built into the payload. It has to bound the rows before they are aggregated.
--
-- 2. A feed row shows a title, a file count and a byline. It was carrying every
--    file's full text and cached HTML to do that, so listing 83 gists moved the
--    entire corpus to render a list.

create or replace function gist_summary(p_gist gists)
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
                    'id',        f.id,
                    'filename',  f.filename,
                    'language',  f.language,
                    'byte_size', f.byte_size
                ) order by f.position
            )
            from gist_files f
            where f.gist_id = p_gist.id
        ), '[]'::jsonb)
    )
    from (select p_gist.author_id as aid) x
    left join profiles p on p.id = x.aid;
$$;

comment on function gist_summary(gists) is 'A feed row: no file content, no cached HTML.';

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
    with visible as (
        select g.*
        from gists g
        left join profiles p on p.id = g.author_id
        where (g.expires_at is null or g.expires_at > now())
          and (p_before is null or g.created_at < p_before)
          and case
                when p_handle is null then g.visibility = 'public'
                when p.handle = p_handle and g.author_id = auth.uid() then true
                else p.handle = p_handle and g.visibility = 'public'
              end
        order by g.created_at desc
        limit least(greatest(p_limit, 1), 100)
    )
    select coalesce(jsonb_agg(gist_summary(v.*::gists) order by v.created_at desc), '[]'::jsonb)
    from visible v;
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
    matches as (
        select
            g.id,
            ts_rank(g.search_vector, q.tsq)
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
    select coalesce(jsonb_agg(gist_summary(g) order by m.rank desc), '[]'::jsonb)
    from matches m
    join gists g on g.id = m.id;
$$;

revoke all on function gist_summary(gists) from public, anon, authenticated;
grant execute on function list_gists(text, int, timestamptz) to anon, authenticated;
grant execute on function search_gists(text, int) to anon, authenticated;
