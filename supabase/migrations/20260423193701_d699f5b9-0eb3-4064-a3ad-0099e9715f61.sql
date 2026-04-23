create extension if not exists pgcrypto;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'reservation_status' and typnamespace = 'public'::regnamespace) then
    create type public.reservation_status as enum ('booked', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'email_job_type' and typnamespace = 'public'::regnamespace) then
    create type public.email_job_type as enum ('reminder_1h');
  end if;

  if not exists (select 1 from pg_type where typname = 'email_job_status' and typnamespace = 'public'::regnamespace) then
    create type public.email_job_status as enum ('pending', 'sent', 'failed', 'cancelled');
  end if;
end
$$;

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  contact_number text,
  timezone text not null default 'UTC',
  brand_logo_url text,
  table_admin_salt text,
  table_admin_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurant_members (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);

create table if not exists public.restaurant_locations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  label text not null,
  address text,
  contact_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_number integer not null,
  capacity integer not null,
  name text not null,
  min_occupancy integer not null,
  max_occupancy integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, table_number),
  check (capacity between 1 and 50),
  check (min_occupancy between 1 and 50),
  check (max_occupancy between 1 and 50),
  check (min_occupancy <= max_occupancy)
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id text not null,
  guest_count integer not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  name text not null,
  email text,
  phone text,
  status public.reservation_status not null default 'booked',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (guest_count between 1 and 50),
  check (end_at > start_at)
);

create table if not exists public.reservation_email_jobs (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  to_email text not null,
  job_type public.email_job_type not null,
  status public.email_job_status not null default 'pending',
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  attempt_count integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (attempt_count >= 0)
);

create index if not exists idx_restaurant_members_user on public.restaurant_members(user_id);
create index if not exists idx_restaurant_members_restaurant on public.restaurant_members(restaurant_id);
create index if not exists idx_restaurant_tables_restaurant on public.restaurant_tables(restaurant_id, table_number);
create index if not exists idx_reservations_restaurant_time on public.reservations(restaurant_id, start_at, end_at);
create index if not exists idx_reservation_email_jobs_due on public.reservation_email_jobs(status, job_type, scheduled_at);

create or replace function public.is_restaurant_member(_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.restaurant_members rm
    where rm.restaurant_id = _restaurant_id
      and rm.user_id = auth.uid()
  );
$$;

alter table public.restaurants enable row level security;
alter table public.restaurant_members enable row level security;
alter table public.restaurant_locations enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.reservations enable row level security;
alter table public.reservation_email_jobs enable row level security;

drop policy if exists "members can view own restaurants" on public.restaurants;
create policy "members can view own restaurants"
on public.restaurants
for select
to authenticated
using (public.is_restaurant_member(id));

drop policy if exists "members can update own restaurants" on public.restaurants;
create policy "members can update own restaurants"
on public.restaurants
for update
to authenticated
using (public.is_restaurant_member(id))
with check (public.is_restaurant_member(id));

drop policy if exists "members can view memberships in own restaurants" on public.restaurant_members;
create policy "members can view memberships in own restaurants"
on public.restaurant_members
for select
to authenticated
using (public.is_restaurant_member(restaurant_id));

drop policy if exists "users can create own membership row" on public.restaurant_members;
create policy "users can create own membership row"
on public.restaurant_members
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "members can view locations in own restaurants" on public.restaurant_locations;
create policy "members can view locations in own restaurants"
on public.restaurant_locations
for select
to authenticated
using (public.is_restaurant_member(restaurant_id));

drop policy if exists "members can create locations in own restaurants" on public.restaurant_locations;
create policy "members can create locations in own restaurants"
on public.restaurant_locations
for insert
to authenticated
with check (public.is_restaurant_member(restaurant_id));

drop policy if exists "members can update locations in own restaurants" on public.restaurant_locations;
create policy "members can update locations in own restaurants"
on public.restaurant_locations
for update
to authenticated
using (public.is_restaurant_member(restaurant_id))
with check (public.is_restaurant_member(restaurant_id));

drop policy if exists "members can delete locations in own restaurants" on public.restaurant_locations;
create policy "members can delete locations in own restaurants"
on public.restaurant_locations
for delete
to authenticated
using (public.is_restaurant_member(restaurant_id));

drop policy if exists "members can view tables in own restaurants" on public.restaurant_tables;
create policy "members can view tables in own restaurants"
on public.restaurant_tables
for select
to authenticated
using (public.is_restaurant_member(restaurant_id));

drop policy if exists "members can create tables in own restaurants" on public.restaurant_tables;
create policy "members can create tables in own restaurants"
on public.restaurant_tables
for insert
to authenticated
with check (public.is_restaurant_member(restaurant_id));

drop policy if exists "members can update tables in own restaurants" on public.restaurant_tables;
create policy "members can update tables in own restaurants"
on public.restaurant_tables
for update
to authenticated
using (public.is_restaurant_member(restaurant_id))
with check (public.is_restaurant_member(restaurant_id));

drop policy if exists "members can delete tables in own restaurants" on public.restaurant_tables;
create policy "members can delete tables in own restaurants"
on public.restaurant_tables
for delete
to authenticated
using (public.is_restaurant_member(restaurant_id));

drop policy if exists "members can view reservations in own restaurants" on public.reservations;
create policy "members can view reservations in own restaurants"
on public.reservations
for select
to authenticated
using (public.is_restaurant_member(restaurant_id));

drop policy if exists "members can create reservations in own restaurants" on public.reservations;
create policy "members can create reservations in own restaurants"
on public.reservations
for insert
to authenticated
with check (public.is_restaurant_member(restaurant_id));

drop policy if exists "members can update reservations in own restaurants" on public.reservations;
create policy "members can update reservations in own restaurants"
on public.reservations
for update
to authenticated
using (public.is_restaurant_member(restaurant_id))
with check (public.is_restaurant_member(restaurant_id));

drop policy if exists "members can delete reservations in own restaurants" on public.reservations;
create policy "members can delete reservations in own restaurants"
on public.reservations
for delete
to authenticated
using (public.is_restaurant_member(restaurant_id));

drop trigger if exists trg_restaurants_updated_at on public.restaurants;
create trigger trg_restaurants_updated_at
before update on public.restaurants
for each row execute function public.update_updated_at_column();

drop trigger if exists trg_restaurant_members_updated_at on public.restaurant_members;
create trigger trg_restaurant_members_updated_at
before update on public.restaurant_members
for each row execute function public.update_updated_at_column();

drop trigger if exists trg_restaurant_locations_updated_at on public.restaurant_locations;
create trigger trg_restaurant_locations_updated_at
before update on public.restaurant_locations
for each row execute function public.update_updated_at_column();

drop trigger if exists trg_restaurant_tables_updated_at on public.restaurant_tables;
create trigger trg_restaurant_tables_updated_at
before update on public.restaurant_tables
for each row execute function public.update_updated_at_column();

drop trigger if exists trg_reservations_updated_at on public.reservations;
create trigger trg_reservations_updated_at
before update on public.reservations
for each row execute function public.update_updated_at_column();

drop trigger if exists trg_reservation_email_jobs_updated_at on public.reservation_email_jobs;
create trigger trg_reservation_email_jobs_updated_at
before update on public.reservation_email_jobs
for each row execute function public.update_updated_at_column();