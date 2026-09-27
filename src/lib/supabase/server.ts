import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";
import type { Database } from "./database.types";

let client: SupabaseClient<Database> | undefined;

/**
 * Cliente con la secret key (rol service_role). Solo existe en el servidor:
 * el navegador nunca habla directo con Supabase.
 */
export function supabaseAdmin(): SupabaseClient<Database> {
  if (!client) {
    const env = serverEnv();
    client = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return client;
}
