create or replace function get_all_ratings_for_admin()
returns setof ratings
language sql
security definer
as $$
  select * from public.ratings;
$$; 