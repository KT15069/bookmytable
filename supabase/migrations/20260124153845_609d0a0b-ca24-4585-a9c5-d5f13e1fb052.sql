-- Fix linter: ensure immutable search_path on functions
create or replace function public.check_and_book_table(
  p_start_at timestamp with time zone,
  p_end_at timestamp with time zone,
  p_guest_count integer,
  p_name text,
  p_phone text
)
returns json
language plpgsql
set search_path = public
as $$
declare
  selected_table record;
begin
  select *
  into selected_table
  from restaurant_tables t
  where t.capacity >= p_guest_count
    and not exists (
      select 1
      from reservations r
      where r.table_id = t.id
        and r.status = 'confirmed'
        and r.start_at < p_end_at
        and r.end_at > p_start_at
    )
  order by t.capacity
  limit 1;

  if selected_table is null then
    return json_build_object('success', false, 'reason', 'no_availability');
  end if;

  insert into reservations (table_id, guest_count, start_at, end_at, name, phone, status)
  values (selected_table.id, p_guest_count, p_start_at, p_end_at, p_name, p_phone, 'confirmed');

  return json_build_object('success', true, 'table_number', selected_table.table_number);
end;
$$;