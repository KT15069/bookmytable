-- Multi-tenant restaurants + staff-only bookings

-- Extensions
create extension if not exists pgcrypto;

-- Restaurants
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  contact_number text,
  timezone text not null default 'UTC',
  brand_logo_url text,
  brand_primary_hsl text,
  table_admin_salt text,
  table_admin_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Members (staff accounts) - no FK to auth.users (security + platform constraint)
create table if not exists public.restaurant_members (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  unique(restaurant_id, user_id)
);

-- Locations (minimal; supports multi-location later)
create table if not exists public.restaurant_locations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  label text not null default 'Main',
  address text,
  contact_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add restaurant_id to existing tables for tenant scoping
alter table public.restaurant_tables
  add column if not exists restaurant_id uuid;

alter table public.reservations
  add column if not exists restaurant_id uuid;

-- Backfill existing rows into a default restaurant (so current app data still works)
do $$
declare
  default_restaurant_id uuid;
begin
  select id into default_restaurant_id from public.restaurants order by created_at asc limit 1;

  if default_restaurant_id is null then
    insert into public.restaurants(name)
    values ('Default Restaurant')
    returning id into default_restaurant_id;

    insert into public.restaurant_locations(restaurant_id, label)
    values (default_restaurant_id, 'Main');
  end if;

  update public.restaurant_tables
  set restaurant_id = default_restaurant_id
  where restaurant_id is null;

  update public.reservations
  set restaurant_id = default_restaurant_id
  where restaurant_id is null;
end $$;

-- restaurant_tables constraints
alter table public.restaurant_tables
  alter column restaurant_id set not null;

create unique index if not exists uniq_restaurant_table_number
  on public.restaurant_tables(restaurant_id, table_number);

-- reservations constraint
alter table public.reservations
  alter column restaurant_id set not null;

create index if not exists idx_reservations_restaurant_time
  on public.reservations(restaurant_id, start_at, end_at);

-- Update timestamp trigger function (already exists: public.set_updated_at)
-- Add triggers for updated_at
create or replace trigger set_restaurants_updated_at
before update on public.restaurants
for each row execute function public.set_updated_at();

create or replace trigger set_restaurant_locations_updated_at
before update on public.restaurant_locations
for each row execute function public.set_updated_at();

-- RLS
alter table public.restaurants enable row level security;
alter table public.restaurant_members enable row level security;
alter table public.restaurant_locations enable row level security;
-- restaurant_tables and reservations already have RLS enabled

-- Helper: membership check
create or replace function public.is_restaurant_member(_restaurant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.restaurant_members m
    where m.restaurant_id = _restaurant_id
      and m.user_id = auth.uid()
  )
$$;

-- Restaurants policies
drop policy if exists "Members can read their restaurant" on public.restaurants;
create policy "Members can read their restaurant"
on public.restaurants
for select
to authenticated
using (public.is_restaurant_member(id));

drop policy if exists "Members can update their restaurant" on public.restaurants;
create policy "Members can update their restaurant"
on public.restaurants
for update
to authenticated
using (public.is_restaurant_member(id))
with check (public.is_restaurant_member(id));

-- Members policies
drop policy if exists "Users can read their memberships" on public.restaurant_members;
create policy "Users can read their memberships"
on public.restaurant_members
for select
to authenticated
using (user_id = auth.uid());

-- Locations policies
drop policy if exists "Members can read locations" on public.restaurant_locations;
create policy "Members can read locations"
on public.restaurant_locations
for select
to authenticated
using (public.is_restaurant_member(restaurant_id));

drop policy if exists "Members can update locations" on public.restaurant_locations;
create policy "Members can update locations"
on public.restaurant_locations
for update
to authenticated
using (public.is_restaurant_member(restaurant_id))
with check (public.is_restaurant_member(restaurant_id));

-- restaurant_tables policies: members can read, no public read
drop policy if exists "Public can read restaurant tables" on public.restaurant_tables;
create policy "Members can read restaurant tables"
on public.restaurant_tables
for select
to authenticated
using (public.is_restaurant_member(restaurant_id));

-- reservations policies: staff-only
drop policy if exists "Public can read reservations" on public.reservations;
drop policy if exists "Public can create reservations" on public.reservations;
drop policy if exists "Public can cancel reservations" on public.reservations;

create policy "Members can read reservations"
on public.reservations
for select
to authenticated
using (public.is_restaurant_member(restaurant_id));

create policy "Members can create reservations"
on public.reservations
for insert
to authenticated
with check (
  public.is_restaurant_member(restaurant_id)
  and status = 'booked'
  and guest_count between 1 and 50
  and length(name) between 1 and 100
  and length(email) between 3 and 255
  and length(phone) between 7 and 30
);

create policy "Members can cancel reservations"
on public.reservations
for update
to authenticated
using (public.is_restaurant_member(restaurant_id) and status = 'booked')
with check (public.is_restaurant_member(restaurant_id) and status = 'cancelled');
