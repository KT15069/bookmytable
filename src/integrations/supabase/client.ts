import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = "https://rsiycjsumuiozlqhyofn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzaXljanN1bXVpb3pscWh5b2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NjAzNjcsImV4cCI6MjA5MjUzNjM2N30.fDqi7t_ag1iFwOLwmQk1Ns2Ma__hTPDCjwqDpy6bRFM";

export const resolvedSupabaseUrl = SUPABASE_URL;
export const resolvedSupabaseAnonKey = SUPABASE_PUBLISHABLE_KEY;
export const supabaseConfigSource: "env" = "env";
export const isSupabaseConfigured = Boolean(resolvedSupabaseUrl && resolvedSupabaseAnonKey);

export const supabase = createClient<Database>(resolvedSupabaseUrl, resolvedSupabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Untyped client for tables that may not be reflected in generated TS types yet.
export const supabaseUntyped = createClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});