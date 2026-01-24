-- Recreate restaurant_tables and reservations with multi-tenant isolation via restaurant_id

-- 1) Shared updated_at trigger helper (safe if already exists)
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

-- 2) restaurant_tables
create table if not exists public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_number integer not null,
  capacity integer not null,
  name text not null,
  min_occupancy integer not null default 1,
  max_occupancy integer not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint restaurant_tables_table_number_positive check (table_number >= 1 and table_number <= 9999),
  constraint restaurant_tables_capacity_range check (capacity >= 1 and capacity <= 50),
  constraint restaurant_tables_min_occ_range check (min_occupancy >= 1 and min_occupancy <= 50),
  constraint restaurant_tables_max_occ_range check (max_occupancy >= 1 and max_occupancy <= 50),
  constraint restaurant_tables_occ_order check (max_occupancy >= min_occupancy),
  constraint restaurant_tables_unique_per_restaurant unique (restaurant_id, table_number)
);

create index if not exists idx_restaurant_tables_restaurant_id on public.restaurant_tables(restaurant_id);
create index if not exists idx_restaurant_tables_restaurant_table_number on public.restaurant_tables(restaurant_id, table_number);

drop trigger if exists update_restaurant_tables_updated_at on public.restaurant_tables;
create trigger update_restaurant_tables_updated_at
before update on public.restaurant_tables
for each row execute function public.update_updated_at_column();

alter table public.restaurant_tables enable row level security;

-- Tight policies: only restaurant members

drop policy if exists "Members can read tables" on public.restaurant_tables;
create policy "Members can read tables"
on public.restaurant_tables
for select
to authenticated
using (public.is_restaurant_member(restaurant_id));

drop policy if exists "Members can create tables" on public.restaurant_tables;
create policy "Members can create tables"
on public.restaurant_tables
for insert
to authenticated
with check (public.is_restaurant_member(restaurant_id));

drop policy if exists "Members can update tables" on public.restaurant_tables;
create policy "Members can update tables"
on public.restaurant_tables
for update
to authenticated
using (public.is_restaurant_member(restaurant_id))
with check (public.is_restaurant_member(restaurant_id));

drop policy if exists "Members can delete tables" on public.restaurant_tables;
create policy "Members can delete tables"
on public.restaurant_tables
for delete
to authenticated
using (public.is_restaurant_member(restaurant_id));


-- 3) reservations
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id uuid not null references public.restaurant_tables(id) on delete restrict,

  guest_count integer not null,
  start_at timestamp with time zone not null,
  end_at timestamp with time zone not null,

  name text,
  email text,
  phone text,

  status text not null default 'booked',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint reservations_guest_count_positive check (guest_count >= 1 and guest_count <= 50),
  constraint reservations_time_order check (end_at > start_at),
  constraint reservations_status_allowed check (status in ('booked','cancelled','pending','completed'))
);

create index if not exists idx_reservations_restaurant_id on public.reservations(restaurant_id);
create index if not exists idx_reservations_table_id on public.reservations(table_id);
create index if not exists idx_reservations_time_range on public.reservations(start_at, end_at);

drop trigger if exists update_reservations_updated_at on public.reservations;
create trigger update_reservations_updated_at
before update on public.reservations
for each row execute function public.update_updated_at_column();

alter table public.reservations enable row level security;

-- Only restaurant members can access/modify reservations

drop policy if exists "Members can read reservations" on public.reservations;
create policy "Members can read reservations"
on public.reservations
for select
to authenticated
using (public.is_restaurant_member(restaurant_id));

drop policy if exists "Members can create reservations" on public.reservations;
create policy "Members can create reservations"
on public.reservations
for insert
to authenticated
with check (public.is_restaurant_member(restaurant_id));

drop policy if exists "Members can update reservations" on public.reservations;
create policy "Members can update reservations"
on public.reservations
for update
to authenticated
using (public.is_restaurant_member(restaurant_id))
with check (public.is_restaurant_member(restaurant_id));

drop policy if exists "Members can delete reservations" on public.reservations;
create policy "Members can delete reservations"
on public.reservations
for delete
to authenticated
using (public.is_restaurant_member(restaurant_id));

-- Optional safety: ensure reservation.table_id belongs to same restaurant (enforced in application/edge function too)
create or replace function public.validate_reservation_table_restaurant()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  t_restaurant_id uuid;
begin
  select restaurant_id into t_restaurant_id
  from public.restaurant_tables
  where id = new.table_id;

  if t_restaurant_id is null then
    raise exception 'Invalid table_id';
  end if;

  if t_restaurant_id <> new.restaurant_id then
    raise exception 'table_id does not belong to restaurant_id';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_reservations_table_restaurant on public.reservations;
create trigger validate_reservations_table_restaurant
before insert or update on public.reservations
for each row execute function public.validate_reservation_table_restaurant();
