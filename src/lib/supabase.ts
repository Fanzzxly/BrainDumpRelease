import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let client: SupabaseClient | null = null;

/**
 * Supabase menempelkan "/rest/v1" ke URL ini. Kalau nilainya disalin dengan
 * garis miring di akhir - gampang terjadi saat copy-paste dari dashboard -
 * hasilnya jadi dobel slash dan PostgREST menolak semua query dengan
 * PGRST125 "Invalid path specified in request URL". Dirapikan di sini
 * supaya tidak perlu diingat saat mengisi environment variable.
 */
function rapikanUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/**
 * Klien Supabase dengan service_role key. HANYA untuk dipakai di server
 * (Server Component, Server Action, Route Handler) - key ini melewati RLS.
 */
export function db(): SupabaseClient {
  if (!client) {
    client = createClient(rapikanUrl(env.supabaseUrl()), env.supabaseKey().trim(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
