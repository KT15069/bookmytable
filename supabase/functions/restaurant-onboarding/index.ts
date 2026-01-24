// Supabase Edge Function: restaurant-onboarding
// Creates a new restaurant + initial tables and links the signed-in user as a member.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TableInput = { name: string; min_occupancy: number; max_occupancy: number };
type Payload = {
  restaurant_name?: string;
  address?: string;
  contact_number?: string;
  timezone?: string;
  brand_logo_url?: string;
  table_admin_passcode?: string;
  tables?: TableInput[];
};

function json(status: number, body: unknown) {
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
    if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) return json(500, { error: "Server not configured" });

    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader) return json(401, { error: "Missing authorization" });

    // Validate the JWT and get the user id
    const authClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData?.user) return json(401, { error: "Invalid session" });
    const userId = userData.user.id;

    const body = (await req.json()) as Payload;
    const name = (body.restaurant_name ?? "").trim();
    if (!name || name.length > 120) return json(400, { error: "restaurant_name is required (max 120)" });

    const passcode = (body.table_admin_passcode ?? "").trim();
    if (!passcode || passcode.length < 6 || passcode.length > 200) return json(400, { error: "table_admin_passcode must be 6-200 chars" });

    const tz = (body.timezone ?? "UTC").trim().slice(0, 80);
    const address = (body.address ?? "").trim().slice(0, 300) || null;
    const contact = (body.contact_number ?? "").trim().slice(0, 40) || null;
    const logo = (body.brand_logo_url ?? "").trim().slice(0, 500) || null;

    const tables = Array.isArray(body.tables) ? body.tables : [];
    if (!tables.length) return json(400, { error: "At least 1 table is required" });
    if (tables.length > 200) return json(400, { error: "Too many tables (max 200)" });

    for (const t of tables) {
      const tn = (t?.name ?? "").trim();
      const min = Number(t?.min_occupancy);
      const max = Number(t?.max_occupancy);
      if (!tn || tn.length > 200) return json(400, { error: "Each table name is required (max 200)" });
      if (!Number.isInteger(min) || min < 1 || min > 50) return json(400, { error: "min_occupancy must be 1-50" });
      if (!Number.isInteger(max) || max < 1 || max > 50) return json(400, { error: "max_occupancy must be 1-50" });
      if (min > max) return json(400, { error: "min_occupancy cannot exceed max_occupancy" });
    }

    // Create records with service role
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // Salt + hash passcode (stored server-side only)
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const salt = toB64(saltBytes);
    const hash = await sha256Base64(`${passcode}:${salt}`);

    const { data: restaurant, error: rErr } = await admin
      .from("restaurants")
      .insert([
        {
          name,
          address,
          contact_number: contact,
          timezone: tz,
          brand_logo_url: logo,
          table_admin_salt: salt,
          table_admin_hash: hash,
        },
      ])
      .select("id")
      .single();
    if (rErr || !restaurant) {
      console.error("restaurant-onboarding: restaurants insert failed", { rErr });
      return json(400, { error: rErr?.message ?? "Could not create restaurant" });
    }

    const restaurantId = restaurant.id as string;

    const { error: mErr } = await admin.from("restaurant_members").insert([
      {
        restaurant_id: restaurantId,
        user_id: userId,
      },
    ]);
    if (mErr) {
      console.error("restaurant-onboarding: restaurant_members insert failed", { mErr, userId, restaurantId });
      return json(400, { error: mErr.message });
    }

    await admin.from("restaurant_locations").insert([
      {
        restaurant_id: restaurantId,
        label: "Main",
        address,
        contact_number: contact,
      },
    ]);

    const rows = tables.map((t, i) => ({
      restaurant_id: restaurantId,
      table_number: i + 1,
      capacity: Number(t.max_occupancy),
      name: t.name.trim(),
      min_occupancy: Number(t.min_occupancy),
      max_occupancy: Number(t.max_occupancy),
    }));

    const { error: tErr } = await admin.from("restaurant_tables").insert(rows);
    if (tErr) {
      console.error("restaurant-onboarding: restaurant_tables insert failed", {
        tErr,
        restaurantId,
        rowCount: rows.length,
      });
      return json(400, { error: tErr.message });
    }

    return json(200, { restaurant_id: restaurantId });
  } catch (e) {
    console.error("restaurant-onboarding uncaught", e);
    return json(500, { error: "Unexpected error" });
  }
});
