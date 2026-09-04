-- A read that does not count as a view.
--
-- get_gist increments view_count, which is right for a reader opening a page and
-- wrong for everything else that has to load a gist: a link preview fetched by
-- Slack, and the card image that preview points at, would each add a view before
-- anybody had seen anything.

create or replace function get_gist_meta(p_slug text)
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

    return gist_payload(g);
end;
$$;

grant execute on function get_gist_meta(text) to anon, authenticated, service_role;
