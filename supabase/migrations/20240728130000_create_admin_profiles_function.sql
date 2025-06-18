create or replace function get_all_profiles_for_admin()
returns setof profiles
language sql
security definer
as $$
  select * from public.profiles;
$$; 