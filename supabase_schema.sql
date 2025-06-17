-- Profiles table: links to Supabase Auth (auth.users)
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    first_name text,
    last_name text,
    profile_image_url text,
    is_admin boolean default false,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Ratings table: tracks user-submitted ratings
create table if not exists public.ratings (
    id serial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    naturalness integer not null,
    confidence integer not null,
    eye_contact integer not null,
    comment text,
    created_at timestamp with time zone default now()
);

-- Trigger to create a new profile when a new user is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
