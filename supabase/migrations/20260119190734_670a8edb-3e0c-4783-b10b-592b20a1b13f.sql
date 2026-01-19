-- Tighten RLS policies to avoid overly-permissive (always true) writes

-- 1) restaurant_tables: keep public read, deny public writes (managed via Edge Function)
drop policy if exists "Public can insert restaurant tables" on public.restaurant_tables;
drop policy if exists "Public can update restaurant tables" on public.restaurant_tables;
drop policy if exists "Public can delete restaurant tables" on public.restaurant_tables;

-- Ensure read policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='restaurant_tables' AND policyname='Public can read restaurant tables'
  ) THEN
    CREATE POLICY "Public can read restaurant tables"
      ON public.restaurant_tables
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- 2) reservations: keep public behavior but constrain INSERT/UPDATE so policies aren't always true

-- INSERT: must be a 'booked' row with reasonable lengths
ALTER POLICY "Public can create reservations" ON public.reservations
  WITH CHECK (
    status = 'booked'
    AND guest_count BETWEEN 1 AND 50
    AND length(name) BETWEEN 1 AND 100
    AND length(email) BETWEEN 3 AND 255
    AND length(phone) BETWEEN 7 AND 30
  );

-- UPDATE (used for cancel): only allow updates to rows currently booked, and only to set cancelled
ALTER POLICY "Public can cancel reservations" ON public.reservations
  USING (status = 'booked')
  WITH CHECK (status = 'cancelled');
