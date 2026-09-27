import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().min(20, "Falta la secret key de Supabase"),
  COOKIE_SECRET: z.string().min(32),
  ADMIN_PASSWORD: z.string().min(12),
  IP_HASH_SALT: z.string().min(16),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

/** Variables de entorno del servidor, validadas la primera vez que se usan. */
export function serverEnv(): ServerEnv {
  if (!cached) {
    const parsed = serverEnvSchema.safeParse(process.env);
    if (!parsed.success) {
      const missing = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
      throw new Error(`Variables de entorno inválidas o faltantes: ${missing}`);
    }
    cached = parsed.data;
  }
  return cached;
}
