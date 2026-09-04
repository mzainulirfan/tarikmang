import { createClient } from "@supabase/supabase-js";

export const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const supabase =
  supabaseConfigured
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    : null;

// Service role (server-only) — jangan expose ke client
export const supabaseServiceConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
