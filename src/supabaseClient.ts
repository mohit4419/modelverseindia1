import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types/database.types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";

const SUPABASE_PUBLIC_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "";

export const isSupabaseConfigured = !!(
  SUPABASE_URL && SUPABASE_PUBLIC_KEY
);

if (!isSupabaseConfigured) {
  console.warn(
    "⚠️ Supabase credentials are not configured. Falling back to local storage database mode."
  );
}

export const supabase = isSupabaseConfigured
  ? createClient<Database>(SUPABASE_URL, SUPABASE_PUBLIC_KEY)
  : null;