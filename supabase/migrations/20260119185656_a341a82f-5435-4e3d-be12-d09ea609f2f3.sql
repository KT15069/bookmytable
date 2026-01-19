-- Restaurant tables master data
create table if not exists public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  table_number int not null,
  capacity int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restaurant_tables_table_number_unique unique (table_number)
);

-- Basic sanity check for capacity (immutable so OK as CHECK)
alter table public.restaurant_tables
  add constraint restaurant_tables_capacity_check
  check (capacity >= 1 and capacity <= 50);

-- Enable RLS (NOTE: policies below are PUBLIC as requested; not recommended for production)
alter table public.restaurant_tables enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='restaurant_tables' and policyname='Public can read restaurant tables'
  ) then
    create policy "Public can read restaurant tables"
      on public.restaurant_tables
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='restaurant_tables' and policyname='Public can insert restaurant tables'
  ) then
    create policy "Public can insert restaurant tables"
      on public.restaurant_tables
      for insert
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='restaurant_tables' and policyname='Public can update restaurant tables'
  ) then
    create policy "Public can update restaurant tables"
      on public.restaurant_tables
      for update
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='restaurant_tables' and policyname='Public can delete restaurant tables'
  ) then
    create policy "Public can delete restaurant tables"
      on public.restaurant_tables
      for delete
      using (true);
  end if;
end $$;

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_restaurant_tables_updated_at on public.restaurant_tables;
create trigger set_restaurant_tables_updated_at
before update on public.restaurant_tables
for each row execute function public.set_updated_at();

create index if not exists restaurant_tables_table_number_idx on public.restaurant_tables (table_number);