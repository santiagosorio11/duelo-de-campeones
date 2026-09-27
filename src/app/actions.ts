"use server";

import { getCatalog, getRatingsForPhone } from "@/lib/catalog";
import { buildPassport, type Passport } from "@/lib/passport";
import { checkColombianMobile } from "@/lib/phone";
import { maskPhone } from "@/lib/phone-format";
import {
  clearParticipant,
  ensureDeviceId,
  readParticipant,
  requestFingerprint,
  writeParticipant,
  type RememberedParticipant,
} from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { CONSENT_VERSION, nameSchema, ratingInputSchema } from "@/lib/validation";

export type RatingErrorCode =
  | "invalid_input"
  | "invalid_name"
  | "invalid_phone"
  | "junk_phone"
  | "consent_required"
  | "not_remembered"
  | "name_mismatch"
  | "rate_limited"
  | "closed"
  | "invalid_dish"
  | "server_error";

export type PublicParticipant = { name: string; phoneMasked: string };

export type SubmitRatingResult =
  | { ok: true; status: "created" | "already_rated"; passport: Passport; participant: PublicParticipant }
  | { ok: false; code: RatingErrorCode; message: string };

const MESSAGES: Record<RatingErrorCode, string> = {
  invalid_input: "Revisa los datos e inténtalo de nuevo.",
  invalid_name: "Escribe tu nombre completo, solo con letras.",
  invalid_phone: "Escribe un celular colombiano válido de 10 dígitos.",
  junk_phone: "Ese número no parece real. Usa un celular válido: si ganas, te contactamos a ese número.",
  consent_required: "Debes autorizar el tratamiento de tus datos para participar.",
  not_remembered: "Vuelve a escribir tu nombre y celular.",
  name_mismatch: "Este celular ya está registrado con otro nombre. Escribe el nombre con el que te registraste.",
  rate_limited: "Demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo.",
  closed: "La votación está cerrada.",
  invalid_dish: "Ese plato no está en competencia.",
  server_error: "No pudimos guardar tu calificación. Inténtalo de nuevo.",
};

function fail(code: RatingErrorCode): SubmitRatingResult {
  return { ok: false, code, message: MESSAGES[code] };
}

export async function submitRating(input: unknown): Promise<SubmitRatingResult> {
  const parsed = ratingInputSchema.safeParse(input);
  if (!parsed.success) return fail("invalid_input");
  const { dishSlug, stars, entrySlug, identity } = parsed.data;

  let participant: RememberedParticipant;
  if (identity.mode === "remembered") {
    const remembered = await readParticipant();
    if (!remembered) return fail("not_remembered");
    participant = remembered;
  } else {
    if (!identity.consent) return fail("consent_required");
    const name = nameSchema.safeParse(identity.fullName);
    if (!name.success) return fail("invalid_name");
    const phone = checkColombianMobile(identity.phone);
    if (!phone.ok) return fail(phone.reason === "junk" ? "junk_phone" : "invalid_phone");
    participant = { name: name.data, phone: phone.e164 };
  }

  try {
    const [deviceId, fingerprint] = await Promise.all([ensureDeviceId(), requestFingerprint()]);

    const { data: status, error } = await supabaseAdmin().rpc("submit_rating", {
      p_full_name: participant.name,
      p_phone_e164: participant.phone,
      p_dish_slug: dishSlug,
      p_stars: stars,
      p_consent_version: CONSENT_VERSION,
      p_entry_restaurant_slug: entrySlug ?? undefined,
      p_device_id: deviceId,
      p_ip_hash: fingerprint.ipHash ?? undefined,
      p_user_agent: fingerprint.userAgent ?? undefined,
    });

    if (error) {
      // Solo código y mensaje: el detalle de Postgres puede incluir datos personales.
      console.error("submit_rating falló", { code: error.code, message: error.message });
      return fail("server_error");
    }
    if (status === "closed" || status === "invalid_dish" || status === "name_mismatch" || status === "rate_limited") {
      return fail(status);
    }
    if (status !== "created" && status !== "already_rated") return fail("server_error");

    await writeParticipant(participant);
    const [catalog, ratings] = await Promise.all([getCatalog(), getRatingsForPhone(participant.phone)]);

    return {
      ok: true,
      status,
      passport: buildPassport(catalog, ratings),
      participant: { name: participant.name, phoneMasked: maskPhone(participant.phone) },
    };
  } catch (error) {
    console.error("submitRating", error instanceof Error ? error.message : "error desconocido");
    return fail("server_error");
  }
}

/** "¿No eres tú?": olvida a la persona recordada en este dispositivo. */
export async function forgetParticipant(): Promise<void> {
  await clearParticipant();
}
