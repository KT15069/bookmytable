import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type RequestBody = {
  action: "confirmation" | "cancelled";
  reservation_id: string;
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
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = mustGetEnv("SUPABASE_URL");
    const SUPABASE_ANON_KEY = mustGetEnv("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = mustGetEnv("SUPABASE_SERVICE_ROLE_KEY");
    const RESEND_API_KEY = mustGetEnv("RESEND_API_KEY");
    const EMAIL_FROM = mustGetEnv("EMAIL_FROM");

    const authorization = req.headers.get("Authorization") ?? "";
    const authed = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await authed.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Partial<RequestBody>;
    if (!body?.action || !body?.reservation_id) {
      return new Response(JSON.stringify({ error: "Missing action or reservation_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const action = body.action;
    const reservationId = body.reservation_id;

    const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: reservation, error: reservationError } = await svc
      .from("reservations")
      .select("id, restaurant_id, start_at, end_at, guest_count, name, email, status")
      .eq("id", reservationId)
      .single();

    if (reservationError || !reservation) {
      console.error("Reservation lookup failed:", reservationError);
      return new Response(JSON.stringify({ error: "Reservation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isMember, error: memberError } = await authed.rpc("is_restaurant_member", {
      _restaurant_id: reservation.restaurant_id,
    });
    if (memberError) {
      console.error("Membership check failed:", memberError);
      return new Response(JSON.stringify({ error: "Membership check failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isMember) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!reservation.email) {
      return new Response(JSON.stringify({ error: "Reservation has no email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resend = new Resend(RESEND_API_KEY);

    const startAt = new Date(reservation.start_at);
    const endAt = new Date(reservation.end_at);
    const startLocal = startAt.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit" });
    const endLocal = endAt.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit" });

    if (action === "confirmation") {
      const subject = "Your reservation is confirmed";
      const html = emailShell({
        title: subject,
        body: `
          <p>Hi${reservation.name ? ` ${escapeHtml(reservation.name)}` : ""},</p>
          <p>Your reservation is confirmed for <strong>${escapeHtml(startLocal)}–${escapeHtml(endLocal)}</strong>.</p>
          <p><strong>Guests:</strong> ${reservation.guest_count}</p>
          <p>If you need to make changes, please contact the restaurant.</p>
        `,
      });

      const sendResp = await resend.emails.send({
        from: EMAIL_FROM,
        to: [reservation.email],
        subject,
        html,
      });
      console.log("Resend confirmation response:", sendResp);

      // Create (or update) reminder job at 1 hour before start
      const scheduledAt = new Date(startAt.getTime() - 60 * 60 * 1000);
      const { error: jobError } = await svc
        .from("reservation_email_jobs")
        .insert([
          {
            reservation_id: reservation.id,
            restaurant_id: reservation.restaurant_id,
            to_email: reservation.email,
            job_type: "reminder_1h",
            status: "pending",
            scheduled_at: scheduledAt.toISOString(),
          },
        ]);

      if (jobError) {
        // Don’t fail the whole request if the reminder couldn’t be scheduled
        console.error("Failed to create reminder job:", jobError);
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "cancelled") {
      const subject = "Your reservation was cancelled";
      const html = emailShell({
        title: subject,
        body: `
          <p>Hi${reservation.name ? ` ${escapeHtml(reservation.name)}` : ""},</p>
          <p>Your reservation for <strong>${escapeHtml(startLocal)}–${escapeHtml(endLocal)}</strong> has been cancelled.</p>
          <p>If this was a mistake, please contact the restaurant to re-book.</p>
        `,
      });

      const sendResp = await resend.emails.send({
        from: EMAIL_FROM,
        to: [reservation.email],
        subject,
        html,
      });
      console.log("Resend cancellation response:", sendResp);

      const { error: cancelJobsError } = await svc
        .from("reservation_email_jobs")
        .update({ status: "cancelled" })
        .eq("reservation_id", reservation.id)
        .eq("job_type", "reminder_1h")
        .is("sent_at", null);

      if (cancelJobsError) {
        console.error("Failed to cancel reminder jobs:", cancelJobsError);
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in reservation-email:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
