-- A) Email jobs table to reliably send reminders
create table if not exists public.reservation_email_jobs (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  restaurant_id uuid not null,
  job_type text not null check (job_type in ('confirmation','reminder','cancelled')),
  to_email text not null,
  scheduled_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','sent','failed','cancelled')),
  sent_at timestamptz,
  attempt_count int not null default 0,
  last_error text,
  created_at timestamptz not null default now()
);

-- Fast scans for due jobs
create index if not exists reservation_email_jobs_due_idx
  on public.reservation_email_jobs (status, scheduled_at);

-- Prevent duplicate jobs per reservation/type
create unique index if not exists reservation_email_jobs_unique_idx
  on public.reservation_email_jobs (reservation_id, job_type);

alter table public.reservation_email_jobs enable row level security;

-- No public policies: only service-role edge functions will access this table.
