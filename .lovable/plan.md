
## What you want
Send automated emails to the customer when:
1) a reservation is created (confirmation with table number + date + time + weekday),
2) 1 hour before the reservation (reminder),
3) a reservation is cancelled (cancellation email).

You chose:
- Email provider: **Resend (recommended)**
- Reminder rule: **If booking is created within 1 hour, send reminder immediately**
- Email content: **Branded HTML**

---

## Key approach (high-level)
- Use **Supabase Edge Functions** to send emails (keeps API keys private).
- Store “email jobs” in the database so reminders are reliable and idempotent.
- Use **pg_cron + pg_net** to run a small scheduled job every minute that sends any reminders due.

This avoids unreliable approaches like browser timers (which fail when the app isn’t open).

---

## Exploration findings (what exists today)
- Reservations are stored in `public.reservations` and include: `name`, `email`, `phone`, `start_at`, `end_at`, `table_id`, `restaurant_id`, `status`.
- Tables are stored in `public.restaurant_tables` and include `table_number`, `name`, etc.
- There are already Edge Functions (`restaurant-onboarding`, `manage-restaurant-tables`) using `SUPABASE_SERVICE_ROLE_KEY`, with CORS and basic auth patterns.
- Business hours are stored **only in localStorage** in the current UI (SettingsTab). That’s fine for booking validation UX, but email scheduling should be based on reservation timestamps in the DB.

---

## What we will build

### A) New database table: `reservation_email_jobs`
Purpose: keep track of which emails must be sent and when.

Proposed columns:
- `id uuid primary key default gen_random_uuid()`
- `reservation_id uuid not null references public.reservations(id) on delete cascade`
- `restaurant_id uuid not null`
- `job_type text not null` (e.g. `confirmation`, `reminder`, `cancelled`)
- `to_email text not null`
- `scheduled_at timestamptz not null`
- `status text not null default 'pending'` (pending/sent/failed/cancelled)
- `sent_at timestamptz`
- `attempt_count int not null default 0`
- `last_error text`
- `created_at timestamptz not null default now()`

Indexes:
- `(status, scheduled_at)` for fast “due reminders” scans
- `(reservation_id, job_type)` with a uniqueness rule to prevent duplicates

Security:
- Enable RLS and **do not** add public policies (only Edge Functions using service role will read/write).

---

### B) New Edge Function #1: `reservation-email`
Purpose: send immediate emails and create/cancel reminder jobs.

Endpoint responsibilities:
- Requires logged-in staff (uses `authorization` header and `supabase.auth.getUser()` like `restaurant-onboarding`).
- Confirms the staff user is allowed to act on the reservation (checks `restaurant_members` for `restaurant_id`).
- Loads required data:
  - reservation (email, name, start_at, end_at, status)
  - table (table_number/name)
  - restaurant (name, timezone)
- Formats date/time **in the restaurant’s timezone**, including weekday name (Sunday/Monday/...).
- Sends a branded HTML email via **Resend**:
  - Confirmation: immediately after booking
  - Cancellation: immediately after cancellation
- Creates or updates the reminder job:
  - `scheduled_at = start_at - 1 hour`
  - If `scheduled_at < now()` (booking created within 1 hour), set `scheduled_at = now()` (your chosen rule).
  - If reservation is cancelled, mark any pending reminder job as `cancelled`.

Inputs (example):
- `{ action: "confirmation", reservation_id: "..." }`
- `{ action: "cancelled", reservation_id: "..." }`

Secrets needed:
- `RESEND_API_KEY`
- `EMAIL_FROM` (e.g. `Bookings <noreply@yourdomain.com>`) — Resend requires a verified domain/sender

---

### C) New Edge Function #2: `reservation-reminder-cron`
Purpose: run on a schedule and send due reminder emails.

Endpoint responsibilities:
- Protected by a shared secret header, e.g. `x-cron-secret`.
  - In `supabase/config.toml`: set `verify_jwt = false`
  - In code: verify `req.headers.get("x-cron-secret") === Deno.env.get("CRON_SECRET")`
- Finds due jobs:
  - `status = 'pending'`
  - `job_type = 'reminder'`
  - `scheduled_at <= now()`
  - limit to a safe batch size (e.g. 50 per run)
- For each job:
  - fetch reservation/table/restaurant
  - skip if reservation is cancelled
  - send email via Resend
  - mark job `sent` with `sent_at`
  - on error: increment `attempt_count`, set `last_error`, set status `failed` after N attempts

This function is the only part that needs to run without a user present.

Secrets needed:
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `CRON_SECRET`
- Uses `SUPABASE_SERVICE_ROLE_KEY` to query and update jobs.

---

### D) Cron schedule setup (Supabase pg_cron + pg_net)
We will:
1) Enable extensions: `pg_cron` and `pg_net`.
2) Create a cron job that runs every minute and calls the reminder function URL.

Important note (platform best practice):
- The cron SQL contains your project-specific URL and key, so we will **not** put that part into a shared migration. Instead you’ll run it once in Supabase SQL editor (Cloud View), as recommended by Supabase.

Cron will call:
`https://<project-ref>.supabase.co/functions/v1/reservation-reminder-cron`
with headers including:
- `Authorization: Bearer <anon_key>` (or service key if you prefer; anon is typical)
- `x-cron-secret: <CRON_SECRET>`

---

### E) Frontend changes (React)
1) After a successful booking (`createReservation` returns `id`):
   - Invoke `supabase.functions.invoke("reservation-email", { body: { action: "confirmation", reservation_id: id } })`
   - This will send the confirmation email and schedule the reminder job.

2) After cancellation (`cancelReservation`):
   - Invoke `supabase.functions.invoke("reservation-email", { body: { action: "cancelled", reservation_id: id } })`
   - This will send the cancellation email and cancel any pending reminder job.

UX behavior:
- Booking/cancelling should still succeed even if email fails; we’ll show a toast like:
  - “Reservation saved, but email could not be sent” (with a non-blocking warning)
This prevents email provider outages from blocking restaurant operations.

---

## Email content details (Branded HTML)
Confirmation email includes:
- Restaurant name
- “Your table is confirmed”
- Table: “Table 12”
- Date: “02 Feb 2026”
- Day name: “Monday”
- Time: “19:00–20:00”
- Optional: phone number/address from restaurant record (if present)

Reminder email includes:
- “Reminder: your reservation is in 1 hour”
- Same table/date/day/time details

Cancellation email includes:
- “Your reservation was cancelled”
- “Please visit again” message

(We can keep the template minimal and clean so it renders well in Gmail, Outlook, mobile.)

---

## Security & reliability notes
- All Resend calls happen server-side in Edge Functions.
- Reminder sending is controlled by DB jobs + cron, not by the browser.
- Cron endpoint is protected by `CRON_SECRET` to prevent public abuse.
- Jobs table provides traceability and allows retries.

---

## Testing plan (end-to-end)
1) Create a reservation for > 1 hour in the future:
   - Expect: confirmation email sent immediately
   - Expect: reminder job created with `scheduled_at = start_at - 1 hour`
2) Create a reservation for 30 minutes in the future:
   - Expect: confirmation email sent immediately
   - Expect: reminder job scheduled “now” and sent on next cron tick
3) Cancel a reservation:
   - Expect: cancellation email sent
   - Expect: any pending reminder job marked cancelled
4) Verify time formatting:
   - Day name and time reflect the restaurant’s timezone (from `restaurants.timezone`)

---

## Implementation checklist (what I will change)
- Add DB migration for `reservation_email_jobs` table + indexes + RLS.
- Add Edge Function `reservation-email`.
- Add Edge Function `reservation-reminder-cron`.
- Update `supabase/config.toml` to include both functions with `verify_jwt = false` (cron function must be false; for reservation-email we may keep true or false + manual validation—either way we will validate the JWT in code).
- Update frontend booking + cancellation flow to invoke the email edge function.
- Provide you a one-time SQL snippet to enable extensions and create the cron schedule in Supabase.

---

## What I need from you during implementation
- A **Resend API key** (we’ll add it as `RESEND_API_KEY` secret).
- A “From” sender (e.g. `Bookings <noreply@yourdomain.com>`). If you don’t have a domain yet, we can start with Resend’s sandbox/testing sender and switch later after domain verification.
