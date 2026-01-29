import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function mustGetEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`${name} is not configured`);
  return v;
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function emailShell({ title, body }: { title: string; body: string }) {
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin:0;padding:0;background:#f7f7f8;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
      <div style="max-width:560px;margin:0 auto;padding:24px;">
        <div style="background:#ffffff;border:1px solid #e6e6e9;border-radius:14px;padding:24px;">
          <h1 style="margin:0 0 12px;font-size:20px;line-height:1.2;">${escapeHtml(title)}</h1>
          <div style="color:#333;line-height:1.55;font-size:14px;">${body}</div>
        </div>
        <div style="color:#777;font-size:12px;line-height:1.5;margin-top:12px;">
          Sent by BookMyTable.
        </div>
      </div>
    </body>
  </html>`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const CRON_SECRET = mustGetEnv("CRON_SECRET");
    const provided = req.headers.get("x-cron-secret") ?? "";
    if (!provided || provided !== CRON_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = mustGetEnv("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = mustGetEnv("SUPABASE_SERVICE_ROLE_KEY");
    const RESEND_API_KEY = mustGetEnv("RESEND_API_KEY");
    const EMAIL_FROM = mustGetEnv("EMAIL_FROM");

    const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const resend = new Resend(RESEND_API_KEY);

    const nowIso = new Date().toISOString();

    const { data: jobs, error: jobsError } = await svc
      .from("reservation_email_jobs")
      .select("id, reservation_id, restaurant_id, to_email, scheduled_at, attempt_count")
      .eq("job_type", "reminder_1h")
      .eq("status", "pending")
      .is("sent_at", null)
      .lte("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true })
      .limit(25);

    if (jobsError) {
      console.error("Failed to fetch due jobs:", jobsError);
      return new Response(JSON.stringify({ error: "Failed to fetch due jobs" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const due = jobs ?? [];
    let sent = 0;
    let failed = 0;

    for (const job of due) {
      try {
        const { data: reservation, error: reservationError } = await svc
          .from("reservations")
          .select("id, start_at, end_at, guest_count, name, email, status")
          .eq("id", job.reservation_id)
          .single();

        if (reservationError || !reservation) {
          throw new Error("Reservation not found");
        }
        if (reservation.status === "cancelled") {
          // Don’t send reminders for cancelled reservations.
          await svc
            .from("reservation_email_jobs")
            .update({ status: "cancelled" })
            .eq("id", job.id);
          continue;
        }

        const startAt = new Date(reservation.start_at);
        const endAt = new Date(reservation.end_at);
        const startLocal = startAt.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit" });
        const endLocal = endAt.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit" });

        const subject = "Reminder: your reservation is in 1 hour";
        const html = emailShell({
          title: subject,
          body: `
            <p>Hi${reservation.name ? ` ${escapeHtml(reservation.name)}` : ""},</p>
            <p>This is a quick reminder for your reservation at <strong>${escapeHtml(startLocal)}–${escapeHtml(endLocal)}</strong>.</p>
            <p><strong>Guests:</strong> ${reservation.guest_count}</p>
          `,
        });

        const sendResp = await resend.emails.send({
          from: EMAIL_FROM,
          to: [job.to_email],
          subject,
          html,
        });
        console.log("Resend reminder response:", sendResp);

        await svc
          .from("reservation_email_jobs")
          .update({ status: "sent", sent_at: new Date().toISOString(), last_error: null })
          .eq("id", job.id);

        sent++;
      } catch (e) {
        failed++;
        const msg = e instanceof Error ? e.message : "Unknown error";
        const nextAttempt = (job.attempt_count ?? 0) + 1;
        const nextStatus = nextAttempt >= 3 ? "failed" : "pending";

        console.error(`Reminder job failed (${job.id}) [attempt ${nextAttempt}]:`, msg);

        await svc
          .from("reservation_email_jobs")
          .update({ attempt_count: nextAttempt, last_error: msg, status: nextStatus })
          .eq("id", job.id);
      }
    }

    return new Response(JSON.stringify({ ok: true, due: due.length, sent, failed }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in reservation-reminder-cron:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
