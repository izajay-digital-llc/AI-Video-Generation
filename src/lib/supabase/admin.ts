import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let client: SupabaseClient | null = null;

/**
 * Service-role client: bypasses RLS. Use it only in route handlers, only for
 * writes, and only after verifying the user and scoping every query to them.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env.supabaseUrl || !key) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY. Add your project's secret (service-role) key to .env.local.",
    );
  }
  client ??= createClient(env.supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
