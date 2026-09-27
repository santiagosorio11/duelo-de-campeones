// Colombia no tiene horario de verano: la hora local siempre es UTC-5.
const BOGOTA_OFFSET = "-05:00";
export const BOGOTA_TZ = "America/Bogota";

/** "2026-10-01T18:00" (hora de Bogotá, de un <input type="datetime-local">) → ISO UTC. */
export function bogotaLocalToIso(local: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
  const date = new Date(`${local}:00${BOGOTA_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** ISO → "2026-10-01T18:00" en hora de Bogotá, para el valor de un datetime-local. */
export function isoToBogotaLocal(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: BOGOTA_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

const readable = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: BOGOTA_TZ });

export function formatBogota(iso: string | null): string {
  return iso ? readable.format(new Date(iso)) : "";
}
