import { parsePhoneNumberFromString } from "libphonenumber-js/mobile";
import { looksLikeColombianMobile, toNationalDigits } from "@/lib/phone-format";

export type PhoneCheck =
  | { ok: true; e164: string; national: string }
  | { ok: false; reason: "format" | "not_mobile" | "junk" };

/** Números que la gente suele inventar para llenar formularios. */
const BLOCKLIST = new Set(["3001234567", "3101234567", "3111234567", "3121234567", "3201234567"]);

const ASCENDING = "01234567890123456789";
const DESCENDING = "98765432109876543210";

/** Detecta números basura: 7 dígitos repetidos, secuencias o números de ejemplo. */
export function isJunkNumber(national: string): boolean {
  const subscriber = national.slice(3);
  if (/^(\d)\1{6}$/.test(subscriber)) return true;
  if (ASCENDING.includes(subscriber) || DESCENDING.includes(subscriber)) return true;
  return BLOCKLIST.has(national);
}

/** Valida un celular colombiano y lo normaliza a E.164 (+573XXXXXXXXX). */
export function checkColombianMobile(input: string): PhoneCheck {
  const national = toNationalDigits(input);
  if (!looksLikeColombianMobile(national)) return { ok: false, reason: "format" };

  const parsed = parsePhoneNumberFromString(national, "CO");
  if (!parsed || !parsed.isValid()) return { ok: false, reason: "not_mobile" };
  if (isJunkNumber(national)) return { ok: false, reason: "junk" };

  return { ok: true, e164: parsed.number, national };
}
