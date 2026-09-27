// Utilidades livianas de teléfono, seguras para el navegador (sin metadata de libphonenumber).

/** Quita todo lo que no sea dígito y el indicativo 57 si viene incluido. */
export function toNationalDigits(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("57")) return digits.slice(2);
  return digits;
}

/** 10 dígitos que empiezan por 3: forma de un celular colombiano. */
export function looksLikeColombianMobile(national: string): boolean {
  return /^3\d{9}$/.test(national);
}

/** "3154827391" → "315 482 7391" mientras la persona escribe o pega el número. */
export function formatNationalMobile(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("57")) digits = digits.slice(2);
  digits = digits.slice(0, 10);
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)].filter(Boolean).join(" ");
}

/** "+573154827391" → "••• 7391" para mostrar sin exponer el número completo. */
export function maskPhone(e164: string): string {
  return `••• ${e164.slice(-4)}`;
}
