// This file is intentionally locked to a single project-level Supabase config.
// No runtime/localStorage overrides are allowed for security reasons.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const FALLBACK_SUPABASE_URL = "https://ecellnikwwjosdvlqsvu.supabase.co";
// NOTE: This is the anon/publishable key. It is safe to ship to the browser.
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZWxsbmlrd3dqb3Nkdmxxc3Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1OTE2NTEsImV4cCI6MjA4NDE2NzY1MX0.9wjdYceiVVUoxH0U6bz1hc5WTpOl0Sjjm0EiGwWZD2U";

function normalizeUrl(url: string) {
  return url.trim().replace(/\/+$/, "");
}

const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const envAnon = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY ??
  (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY) as string | undefined;

export const supabaseConfigSource: "env" | "fallback" = envUrl && envAnon ? "env" : "fallback";
export const resolvedSupabaseUrl = envUrl ? normalizeUrl(envUrl) : FALLBACK_SUPABASE_URL;
export const resolvedSupabaseAnonKey = envAnon?.trim() || FALLBACK_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(resolvedSupabaseUrl && resolvedSupabaseAnonKey);

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = createClient<Database>(resolvedSupabaseUrl!, resolvedSupabaseAnonKey!, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// NOTE: The generated `Database` types file can lag behind schema changes in Lovable.
// For tables not yet present in `src/integrations/supabase/types.ts`, use this untyped
// client to avoid TS `never` issues while keeping runtime behavior identical.
export const supabaseUntyped = createClient(resolvedSupabaseUrl!, resolvedSupabaseAnonKey!, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
