import "server-only";
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { serverEnv } from "@/lib/env";

const PARTICIPANT_COOKIE = "dc_participant";
const DEVICE_COOKIE = "dc_device";
const ADMIN_COOKIE = "dc_admin";

const PARTICIPANT_MAX_AGE = 60 * 60 * 24 * 120; // la campaña completa
const DEVICE_MAX_AGE = 60 * 60 * 24 * 365;
const ADMIN_MAX_AGE = 60 * 60 * 8;

const baseCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

// ---------------------------------------------------------------------------
// Firma HMAC: el contenido es legible pero no se puede falsificar. Cada tipo de
// cookie firma con su propósito, así una nunca sirve en lugar de la otra.
// ---------------------------------------------------------------------------

type Purpose = "participant" | "admin";

function mac(purpose: Purpose, data: string): string {
  return createHmac("sha256", serverEnv().COOKIE_SECRET).update(`${purpose}:${data}`).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function seal(purpose: Purpose, payload: unknown): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${mac(purpose, data)}`;
}

function unseal(purpose: Purpose, token: string | undefined): unknown {
  if (!token || token.length > 2048) return null;
  const [data, signature] = token.split(".");
  if (!data || !signature || !safeEqual(signature, mac(purpose, data))) return null;
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Participante recordado en este dispositivo
// ---------------------------------------------------------------------------

const participantSchema = z.object({
  name: z.string().min(3).max(80),
  phone: z.string().regex(/^\+573\d{9}$/),
});

export type RememberedParticipant = z.infer<typeof participantSchema>;

export async function readParticipant(): Promise<RememberedParticipant | null> {
  const parsed = participantSchema.safeParse(unseal("participant", (await cookies()).get(PARTICIPANT_COOKIE)?.value));
  return parsed.success ? parsed.data : null;
}

export async function writeParticipant(participant: RememberedParticipant): Promise<void> {
  (await cookies()).set(PARTICIPANT_COOKIE, seal("participant", participant), { ...baseCookie, maxAge: PARTICIPANT_MAX_AGE });
}

export async function clearParticipant(): Promise<void> {
  (await cookies()).delete(PARTICIPANT_COOKIE);
}

/** Id aleatorio del dispositivo, solo para auditoría. Crea la cookie si no existe. */
export async function ensureDeviceId(): Promise<string> {
  const store = await cookies();
  const current = store.get(DEVICE_COOKIE)?.value;
  if (current && z.uuid().safeParse(current).success) return current;
  const id = randomUUID();
  store.set(DEVICE_COOKIE, id, { ...baseCookie, maxAge: DEVICE_MAX_AGE });
  return id;
}

// ---------------------------------------------------------------------------
// Datos de la petición para auditoría
// ---------------------------------------------------------------------------

export async function requestFingerprint(): Promise<{ ipHash: string | null; userAgent: string | null }> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  const ipHash = ip
    ? createHash("sha256").update(`${serverEnv().IP_HASH_SALT}:${ip}`).digest("hex").slice(0, 32)
    : null;
  return { ipHash, userAgent: h.get("user-agent")?.slice(0, 300) ?? null };
}

// ---------------------------------------------------------------------------
// Sesión del panel admin
// ---------------------------------------------------------------------------

const adminSchema = z.object({ role: z.literal("admin"), exp: z.number() });

export function checkAdminPassword(candidate: string): boolean {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(candidate), digest(serverEnv().ADMIN_PASSWORD));
}

export async function startAdminSession(): Promise<void> {
  const exp = Date.now() + ADMIN_MAX_AGE * 1000;
  (await cookies()).set(ADMIN_COOKIE, seal("admin", { role: "admin", exp }), { ...baseCookie, sameSite: "strict", maxAge: ADMIN_MAX_AGE });
}

export async function endAdminSession(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const parsed = adminSchema.safeParse(unseal("admin", (await cookies()).get(ADMIN_COOKIE)?.value));
  return parsed.success && parsed.data.exp > Date.now();
}
