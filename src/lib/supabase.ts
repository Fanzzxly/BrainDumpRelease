import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let client: SupabaseClient | null = null;

/**
 * Klien Supabase dengan service_role key. HANYA untuk dipakai di server
 * (Server Component, Server Action, Route Handler) - key ini melewati RLS.
 */
export function db(): SupabaseClient {
  if (!client) {
    client = createClient(env.supabaseUrl(), env.supabaseKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
