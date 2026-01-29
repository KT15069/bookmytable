-- Add explicit "deny all" RLS policies to satisfy linter while keeping the table Edge-Function-only
-- (Service role bypasses RLS; app clients remain blocked.)

do $$ begin
  -- SELECT
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='reservation_email_jobs' and policyname='reservation_email_jobs_deny_select'
  ) then
    execute 'create policy reservation_email_jobs_deny_select on public.reservation_email_jobs for select using (false)';
  end if;

  -- INSERT
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='reservation_email_jobs' and policyname='reservation_email_jobs_deny_insert'
  ) then
    execute 'create policy reservation_email_jobs_deny_insert on public.reservation_email_jobs for insert with check (false)';
  end if;

  -- UPDATE
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='reservation_email_jobs' and policyname='reservation_email_jobs_deny_update'
  ) then
    execute 'create policy reservation_email_jobs_deny_update on public.reservation_email_jobs for update using (false)';
  end if;

  -- DELETE
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='reservation_email_jobs' and policyname='reservation_email_jobs_deny_delete'
  ) then
    execute 'create policy reservation_email_jobs_deny_delete on public.reservation_email_jobs for delete using (false)';
  end if;
end $$;