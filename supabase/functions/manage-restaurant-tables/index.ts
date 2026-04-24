// Supabase Edge Function: manage-restaurant-tables
// Allows authenticated restaurant members to manage tables using their restaurant-specific passcode.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action = "create" | "update_table" | "delete";

type Payload = {
  action: Action;
  passcode?: string;
  id?: string;
  table_number?: number;
  name?: string;
  min_occupancy?: number;
  max_occupancy?: number;
};

function respond(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function toB64(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

async function sha256Base64(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return toB64(new Uint8Array(digest));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
      return respond(500, { error: "Server not configured" });
    }

    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader) return respond(401, { error: "Missing authorization" });

    const authClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData?.user) return respond(401, { error: "Invalid session" });
    const userId = userData.user.id;

    const body = (await req.json()) as Payload;
    const passcode = (body.passcode ?? "").trim();
    if (!passcode) return respond(400, { error: "passcode is required" });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: membership, error: membershipError } = await admin
      .from("restaurant_members")
      .select("restaurant_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      console.error("manage-restaurant-tables: membership lookup failed", membershipError);
      return respond(400, { error: membershipError.message });
    }
    if (!membership?.restaurant_id) return respond(403, { error: "No restaurant membership found" });

    const restaurantId = membership.restaurant_id as string;

    const { data: restaurant, error: restaurantError } = await admin
      .from("restaurants")
      .select("table_admin_salt, table_admin_hash")
      .eq("id", restaurantId)
      .limit(1)
      .maybeSingle();

    if (restaurantError) {
      console.error("manage-restaurant-tables: restaurant lookup failed", restaurantError);
      return respond(400, { error: restaurantError.message });
    }

    const salt = (restaurant?.table_admin_salt ?? "").trim();
    const expectedHash = (restaurant?.table_admin_hash ?? "").trim();
    if (!salt || !expectedHash) return respond(400, { error: "Table admin passcode is not configured" });

    const incomingHash = await sha256Base64(`${passcode}:${salt}`);
    if (incomingHash !== expectedHash) return respond(401, { error: "Invalid passcode" });

    if (body.action === "create") {
      const table_number = Number(body.table_number);
      const name = (body.name ?? "").trim();
      const min_occupancy = Number(body.min_occupancy);
      const max_occupancy = Number(body.max_occupancy);

      if (!Number.isInteger(table_number) || table_number <= 0 || table_number > 9999) {
        return respond(400, { error: "table_number must be an integer between 1 and 9999" });
      }
      if (!name || name.length > 200) {
        return respond(400, { error: "name is required (max 200 chars)" });
      }
      if (!Number.isInteger(min_occupancy) || min_occupancy < 1 || min_occupancy > 50) {
        return respond(400, { error: "min_occupancy must be an integer between 1 and 50" });
      }
      if (!Number.isInteger(max_occupancy) || max_occupancy < 1 || max_occupancy > 50) {
        return respond(400, { error: "max_occupancy must be an integer between 1 and 50" });
      }
      if (min_occupancy > max_occupancy) {
        return respond(400, { error: "min_occupancy cannot exceed max_occupancy" });
      }

      const { data, error } = await admin
        .from("restaurant_tables")
        .insert({
          restaurant_id: restaurantId,
          table_number,
          name,
          min_occupancy,
          max_occupancy,
          capacity: max_occupancy,
        })
        .select("id, restaurant_id, table_number, capacity, name, min_occupancy, max_occupancy")
        .single();

      if (error) {
        console.error("manage-restaurant-tables: create failed", error);
        return respond(400, { error: error.message });
      }

      return respond(200, { data });
    }

    if (body.action === "update_table") {
      const id = (body.id ?? "").trim();
      const name = (body.name ?? "").trim();
      const min_occupancy = Number(body.min_occupancy);
      const max_occupancy = Number(body.max_occupancy);

      if (!id) return respond(400, { error: "id is required" });
      if (!name || name.length > 200) {
        return respond(400, { error: "name is required (max 200 chars)" });
      }
      if (!Number.isInteger(min_occupancy) || min_occupancy < 1 || min_occupancy > 50) {
        return respond(400, { error: "min_occupancy must be an integer between 1 and 50" });
      }
      if (!Number.isInteger(max_occupancy) || max_occupancy < 1 || max_occupancy > 50) {
        return respond(400, { error: "max_occupancy must be an integer between 1 and 50" });
      }
      if (min_occupancy > max_occupancy) {
        return respond(400, { error: "min_occupancy cannot exceed max_occupancy" });
      }

      const { data, error } = await admin
        .from("restaurant_tables")
        .update({
          name,
          min_occupancy,
          max_occupancy,
          capacity: max_occupancy,
        })
        .eq("id", id)
        .eq("restaurant_id", restaurantId)
        .select("id, restaurant_id, table_number, capacity, name, min_occupancy, max_occupancy")
        .single();

      if (error) {
        console.error("manage-restaurant-tables: update_table failed", error);
        return respond(400, { error: error.message });
      }

      return respond(200, { data });
    }

    if (body.action === "delete") {
      const id = (body.id ?? "").trim();
      if (!id) return respond(400, { error: "id is required" });

      const { error } = await admin
        .from("restaurant_tables")
        .delete()
        .eq("id", id)
        .eq("restaurant_id", restaurantId);

      if (error) {
        console.error("manage-restaurant-tables: delete failed", error);
        return respond(400, { error: error.message });
      }

      return respond(200, { ok: true });
    }

    return respond(400, { error: "Unknown action" });
  } catch (e) {
    console.error("manage-restaurant-tables uncaught", e);
    return respond(500, { error: "Unexpected error" });
  }
});
