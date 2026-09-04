-- Tears down everything the migrations create, so 0001-0004 can be re-applied.
-- Greenfield only: this destroys all gist data.
do $$
declare j text;
begin
    for j in select jobname from cron.job loop
        perform cron.unschedule(j);
    end loop;
exception when undefined_table then null;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
drop schema public cascade;
create schema public;
grant usage on schema public to public, anon, authenticated, service_role;
grant all on schema public to postgres;
