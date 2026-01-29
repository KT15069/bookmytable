
## Immediate security fix (because the key was pasted)
- The `re_...` value in your cURL is a real Resend API key and should be treated as compromised now that it was shared in chat.
- Since you said “I will rotate it now”, do this in Resend:
  1) Resend dashboard → **API Keys**
  2) **Revoke/Delete** the exposed key
  3) Create a **new** API key (we will use the new one as `RESEND_API_KEY`)
- Do not paste the new key in chat.

---

## How to give secrets to Lovable (the safe way)
We’ll store them as **Supabase Edge Function Secrets** so:
- they are not committed to git
- they are available in Edge Functions via `Deno.env.get("...")`
- they are not exposed to the browser

### Option A (recommended): via Supabase Dashboard
1) Open Supabase → **Settings → Edge Functions → Secrets**  
   https://supabase.com/dashboard/project/ecellnikwwjosdvlqsvu/settings/functions
2) Add these secrets (exact names):
   - `RESEND_API_KEY` = the *new* Resend key you just generated after rotation
   - `EMAIL_FROM` = `onboarding@resend.dev` (your choice for now)
   - `CRON_SECRET` = (generated below)

### Option B: via Lovable “Secrets” UI
If Lovable shows you a “Add secret” modal/button when I request secrets, you can paste values there. It writes to the same place (Supabase secrets).  
(Still: do not paste secrets into chat messages.)

---

## Your CRON_SECRET (generated for you)
Use this as `CRON_SECRET` (you can regenerate if you prefer):
```text
cron_7ef0c4c3b0c24d91b08e44dca1d72f84_20260129
```
Guidelines:
- Keep it private
- Long, random, unguessable
- If you ever suspect it leaked, rotate it and update the secret

---

## What we’ll do right after secrets are saved (implementation work)
Once you confirm the secrets are added (no need to share values), we will proceed to:
1) Create Edge Function `reservation-email`
   - Uses `RESEND_API_KEY` + `EMAIL_FROM`
   - Sends confirmation/cancellation immediately
   - Creates/cancels reminder job rows in `reservation_email_jobs`
2) Create Edge Function `reservation-reminder-cron`
   - Protected by header `x-cron-secret: <CRON_SECRET>`
   - Looks up due reminder jobs and sends reminder emails via Resend
3) Update frontend booking & cancellation flow
   - After booking: invoke `reservation-email` with `{ action: "confirmation", reservation_id }`
   - After cancellation: invoke `reservation-email` with `{ action: "cancelled", reservation_id }`
4) Provide a one-time SQL snippet to schedule the cron job (`pg_cron` + `pg_net`) to call the reminder function every minute

---

## How you can test with your Resend cURL (optional sanity check)
Your cURL is correct structurally; after you rotate the key, you can validate Resend works by running the same command with:
- `Authorization: Bearer <NEW_KEY>`
- keep `from: "onboarding@resend.dev"` (works for initial tests)
If that succeeds, we know Resend is set up correctly before we wire it into Supabase.

---

## What I need from you to continue
1) Rotate the leaked Resend key (you’re already doing this)
2) Add secrets in Supabase:
   - `RESEND_API_KEY`
   - `EMAIL_FROM` = `onboarding@resend.dev`
   - `CRON_SECRET` = the generated value above
3) Reply: “Secrets added” (do not paste the values)

After that, we’ll implement the two edge functions and wire the UI flow end-to-end.
