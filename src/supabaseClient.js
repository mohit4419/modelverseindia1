import { createClient } from "@supabase/supabase-js";

const getEnv = () => {
  if (typeof import.meta !== "undefined" && import.meta && import.meta.env) {
    return import.meta.env;
  }
  if (typeof process !== "undefined" && process && process.env) {
    return process.env;
  }
  return {};
};

const env = getEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "";

const SUPABASE_PUBLIC_KEY =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  env.SUPABASE_ANON_KEY ||
  "";

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_PUBLIC_KEY);

if (!isSupabaseConfigured) {
  console.warn("⚠️ Supabase credentials are not configured. Falling back to local storage database mode.");
}

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY)
  : null;
