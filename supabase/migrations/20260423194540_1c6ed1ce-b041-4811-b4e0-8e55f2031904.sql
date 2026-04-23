drop policy if exists "deny all selects on reservation email jobs" on public.reservation_email_jobs;
create policy "deny all selects on reservation email jobs"
on public.reservation_email_jobs
for select
to authenticated
using (false);

drop policy if exists "deny all inserts on reservation email jobs" on public.reservation_email_jobs;
create policy "deny all inserts on reservation email jobs"
on public.reservation_email_jobs
for insert
to authenticated
with check (false);

drop policy if exists "deny all updates on reservation email jobs" on public.reservation_email_jobs;
create policy "deny all updates on reservation email jobs"
on public.reservation_email_jobs
for update
to authenticated
using (false)
with check (false);

drop policy if exists "deny all deletes on reservation email jobs" on public.reservation_email_jobs;
create policy "deny all deletes on reservation email jobs"
on public.reservation_email_jobs
for delete
to authenticated
using (false);