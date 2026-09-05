-- Search that matches what somebody has typed so far.
--
-- websearch_to_tsquery turns "welco" into the lexeme 'welco', which matches nothing:
-- "Welcome" is stored as the stem 'welcom'. So a search-as-you-type box found
-- nothing until the last character of a word was typed, and a search for a word in a
-- form the stemmer normalises differently found nothing at all.
--
-- Every term now becomes a prefix term, which is what a GIN index on a tsvector
-- supports natively. Terms are extracted rather than passed through, because
-- to_tsquery takes an operator syntax and a stray & or ! from a search box is a
-- syntax error, not a search.
--
-- The terms are handed to to_tsquery unquoted so the dictionary still stems them:
-- quoted, "sample:*" stays 'sample' and never matches the stored 'sampl', which is
-- how a search for a word that is plainly there returns nothing.

create or replace function search_terms(p_query text)
returns tsquery
language sql
immutable
set search_path = public
as $$
    select to_tsquery(
        'english',
        nullif(
            (
                select string_agg(term || ':*', ' & ')
                from unnest(
                    string_to_array(
                        regexp_replace(lower(btrim(p_query)), '[^a-z0-9 ]+', ' ', 'g'),
                        ' '
                    )
                ) as t(term)
                where term <> ''
            ),
            ''
        )
    );
$$;

-- Search public gists, returning summaries rather than whole documents.
-- Superseded by 0011, which made the tiebreak total. Change it there.
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
        order by rank desc, g.created_at desc
        limit least(greatest(p_limit, 1), 100)
    )
    select coalesce(jsonb_agg(gist_summary(g) order by m.rank desc), '[]'::jsonb)
    from matches m
    join gists g on g.id = m.id;
$$;

grant execute on function search_terms(text) to anon, authenticated, service_role;
grant execute on function search_gists(text, int) to anon, authenticated, service_role;
