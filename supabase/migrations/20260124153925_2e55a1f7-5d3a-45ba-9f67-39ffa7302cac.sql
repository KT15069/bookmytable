-- Add table naming + min/max occupancy for onboarding
alter table public.restaurant_tables
  add column if not exists name text,
  add column if not exists min_occupancy integer,
  add column if not exists max_occupancy integer;

update public.restaurant_tables
set
  name = coalesce(name, 'Table ' || table_number::text),
  min_occupancy = coalesce(min_occupancy, 1),
  max_occupancy = coalesce(max_occupancy, capacity)
where name is null or min_occupancy is null or max_occupancy is null;

alter table public.restaurant_tables
  alter column name set not null,
  alter column min_occupancy set not null,
  alter column max_occupancy set not null;

create index if not exists idx_restaurant_tables_restaurant
  on public.restaurant_tables(restaurant_id);