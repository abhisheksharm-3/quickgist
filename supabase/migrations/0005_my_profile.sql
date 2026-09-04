-- The caller's own profile.
--
-- Without this the browser had to guess its own handle from OAuth metadata, which is
-- absent for an email and password account and wrong whenever handle_new_user()
-- de-duplicated a handle with a numeric suffix. A guess about who you are is not a
-- guess worth keeping.

create or replace function my_profile()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    select jsonb_build_object(
        'handle',       p.handle,
        'display_name', p.display_name,
        'avatar_url',   p.avatar_url
    )
    from profiles p
    where p.id = auth.uid();
$$;

revoke all on function my_profile() from public, anon;
grant execute on function my_profile() to authenticated;
