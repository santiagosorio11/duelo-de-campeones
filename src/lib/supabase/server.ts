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

// Fallos pasajeros de la plataforma (desfase de reloj del JWT interno, red, 5xx).
const TRANSIENT = /JWT|fetch failed|network|timeout|ECONNRESET|503|502|504/i;

/**
 * Reintenta una consulta ante un error pasajero. Todas las consultas públicas son
 * lecturas o la función submit_rating, que es idempotente (on conflict do nothing).
 */
export async function withRetry<T extends { error: { message: string } | null }>(
  run: () => PromiseLike<T>,
  attempts = 3,
): Promise<T> {
  let result = await run();
  for (let attempt = 1; attempt < attempts && result.error && TRANSIENT.test(result.error.message); attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    result = await run();
  }
  return result;
}
