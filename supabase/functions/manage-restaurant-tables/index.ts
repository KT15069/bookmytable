// Supabase Edge Function: manage-restaurant-tables
// Public endpoint protected by a shared passcode stored as a Supabase secret.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action = "create" | "update_capacity" | "delete";

type Payload = {
  action: Action;
  passcode?: string;
  id?: string;
  table_number?: number;
  capacity?: number;
};

function badRequest(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ADMIN_PASSCODE = Deno.env.get("RESTAURANT_ADMIN_PASSCODE");

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
      return badRequest("Server not configured", 500);
    }
    if (!ADMIN_PASSCODE) {
      console.error("Missing RESTAURANT_ADMIN_PASSCODE secret");
      return badRequest("Server not configured", 500);
    }

    const body = (await req.json()) as Payload;
    const passcode = (body.passcode ?? "").trim();

    if (!passcode || passcode !== ADMIN_PASSCODE) {
      return badRequest("Invalid passcode", 401);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    if (body.action === "create") {
      const table_number = Number(body.table_number);
      const capacity = Number(body.capacity);

      if (!Number.isInteger(table_number) || table_number <= 0 || table_number > 9999) {
        return badRequest("table_number must be an integer between 1 and 9999");
      }
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 50) {
        return badRequest("capacity must be an integer between 1 and 50");
      }

      const { data, error } = await supabase
        .from("restaurant_tables")
        .insert({ table_number, capacity })
        .select("id, table_number, capacity")
        .single();

      if (error) {
        console.error("create error", error);
        return badRequest(error.message, 400);
      }

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "update_capacity") {
      const id = (body.id ?? "").trim();
      const capacity = Number(body.capacity);

      if (!id) return badRequest("id is required");
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 50) {
        return badRequest("capacity must be an integer between 1 and 50");
      }

      const { data, error } = await supabase
        .from("restaurant_tables")
        .update({ capacity })
        .eq("id", id)
        .select("id, table_number, capacity")
        .single();

      if (error) {
        console.error("update_capacity error", error);
        return badRequest(error.message, 400);
      }

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.action === "delete") {
      const id = (body.id ?? "").trim();
      if (!id) return badRequest("id is required");

      const { error } = await supabase.from("restaurant_tables").delete().eq("id", id);
      if (error) {
        console.error("delete error", error);
        return badRequest(error.message, 400);
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return badRequest("Unknown action");
  } catch (e) {
    console.error("manage-restaurant-tables uncaught", e);
    return badRequest("Unexpected error", 500);
  }
});
