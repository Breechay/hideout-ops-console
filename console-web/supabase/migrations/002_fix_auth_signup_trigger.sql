-- Patch: make auth.users signup trigger safe/idempotent.
-- Goal: never block Supabase Auth user creation because optional bootstrap tables/columns drifted.

-- 1) Safe trigger function.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  profiles_exists boolean;
  operators_exists boolean;
  profiles_has_id boolean;
  profiles_has_email boolean;
  operators_has_user_id boolean;
  operators_has_id boolean;
  operators_has_email boolean;
begin
  profiles_exists := to_regclass('public.profiles') is not null;
  operators_exists := to_regclass('public.operators') is not null;

  -- Optional bootstrap: public.profiles
  if profiles_exists then
    begin
      select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public' and table_name = 'profiles' and column_name = 'id'
      ) into profiles_has_id;

      select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public' and table_name = 'profiles' and column_name = 'email'
      ) into profiles_has_email;

      if profiles_has_id and profiles_has_email then
        execute 'insert into public.profiles (id, email) values ($1, $2) on conflict (id) do nothing'
        using new.id, new.email;
      elsif profiles_has_id then
        execute 'insert into public.profiles (id) values ($1) on conflict (id) do nothing'
        using new.id;
      end if;
    exception
      when others then
        -- Do not block auth signup if optional bootstrap fails.
        raise warning 'handle_new_user: profiles bootstrap skipped: %', sqlerrm;
    end;
  end if;

  -- Optional bootstrap: public.operators
  if operators_exists then
    begin
      select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public' and table_name = 'operators' and column_name = 'user_id'
      ) into operators_has_user_id;

      select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public' and table_name = 'operators' and column_name = 'id'
      ) into operators_has_id;

      select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public' and table_name = 'operators' and column_name = 'email'
      ) into operators_has_email;

      if operators_has_user_id and operators_has_email then
        execute 'insert into public.operators (user_id, email) values ($1, $2) on conflict do nothing'
        using new.id, new.email;
      elsif operators_has_user_id then
        execute 'insert into public.operators (user_id) values ($1) on conflict do nothing'
        using new.id;
      elsif operators_has_id and operators_has_email then
        execute 'insert into public.operators (id, email) values ($1, $2) on conflict do nothing'
        using new.id, new.email;
      elsif operators_has_id then
        execute 'insert into public.operators (id) values ($1) on conflict do nothing'
        using new.id;
      end if;
    exception
      when others then
        -- Do not block auth signup if optional bootstrap fails.
        raise warning 'handle_new_user: operators bootstrap skipped: %', sqlerrm;
    end;
  end if;

  return new;
end;
$$;

-- 2) Remove existing custom public-schema triggers on auth.users.
do $$
declare
  trg record;
begin
  for trg in
    select t.tgname
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_proc p on p.oid = t.tgfoid
    join pg_namespace pn on pn.oid = p.pronamespace
    where not t.tgisinternal
      and n.nspname = 'auth'
      and c.relname = 'users'
      and pn.nspname = 'public'
  loop
    execute format('drop trigger if exists %I on auth.users', trg.tgname);
  end loop;
end $$;

-- 3) Recreate a single safe signup trigger.
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

