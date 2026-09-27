/**
 * Sorteo ponderado: cada participante tiene tantas oportunidades como platos
 * calificó. `random(max)` debe devolver un entero uniforme en [0, max).
 */
export function pickWeighted<T extends { tickets: number }>(pool: T[], random: (max: number) => number): T | null {
  const total = pool.reduce((sum, entry) => sum + Math.max(0, entry.tickets), 0);
  if (total <= 0) return null;

  let ticket = random(total);
  for (const entry of pool) {
    ticket -= Math.max(0, entry.tickets);
    if (ticket < 0) return entry;
  }
  return null;
}

export function totalTickets(pool: { tickets: number }[]): number {
  return pool.reduce((sum, entry) => sum + Math.max(0, entry.tickets), 0);
}
