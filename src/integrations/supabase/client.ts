import { createClient } from "@supabase/supabase-js";

const RUNTIME_URL_KEY = "runtime.supabase.url";
const RUNTIME_ANON_KEY = "runtime.supabase.anon_key";

export type SupabaseConfigSource = "env" | "runtime" | "none";

function readRuntimeConfig() {
  try {
    const url = localStorage.getItem(RUNTIME_URL_KEY) ?? undefined;
    const anonKey = localStorage.getItem(RUNTIME_ANON_KEY) ?? undefined;
    return { url, anonKey };
  } catch {
    return { url: undefined, anonKey: undefined };
  }
}

export function getSupabaseConfig(): { url?: string; anonKey?: string; source: SupabaseConfigSource } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (envUrl && envAnonKey) return { url: envUrl, anonKey: envAnonKey, source: "env" };

  const runtime = readRuntimeConfig();
  if (runtime.url && runtime.anonKey) return { url: runtime.url, anonKey: runtime.anonKey, source: "runtime" };

  return { url: undefined, anonKey: undefined, source: "none" };
}

export function saveRuntimeSupabaseConfig(args: { url: string; anonKey: string }) {
  localStorage.setItem(RUNTIME_URL_KEY, args.url);
  localStorage.setItem(RUNTIME_ANON_KEY, args.anonKey);
}

export function clearRuntimeSupabaseConfig() {
  localStorage.removeItem(RUNTIME_URL_KEY);
  localStorage.removeItem(RUNTIME_ANON_KEY);
}

const resolved = getSupabaseConfig();

export const supabaseConfigSource: SupabaseConfigSource = resolved.source;
export const resolvedSupabaseUrl = resolved.url;
export const resolvedSupabaseAnonKey = resolved.anonKey;

export const isSupabaseConfigured = Boolean(resolvedSupabaseUrl && resolvedSupabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(resolvedSupabaseUrl!, resolvedSupabaseAnonKey!)
  : (null as unknown as ReturnType<typeof createClient>);

