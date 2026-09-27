import type { DishCategory } from "@/lib/passport";

export type DishResult = {
  dishSlug: string;
  dishName: string;
  category: DishCategory;
  restaurantSlug: string;
  restaurantName: string;
  votes: number;
  avgStars: number | null;
  /** Cantidad de votos de 1 a 5 estrellas. */
  distribution: [number, number, number, number, number];
};

export type Standing = {
  restaurantSlug: string;
  restaurantName: string;
  votes: number;
  avgStars: number | null;
};

/** Promedio ponderado por votos de un conjunto de platos del mismo restaurante. */
function combine(rows: DishResult[]): Standing[] {
  const byRestaurant = new Map<string, { name: string; votes: number; total: number }>();
  for (const row of rows) {
    const entry = byRestaurant.get(row.restaurantSlug) ?? { name: row.restaurantName, votes: 0, total: 0 };
    entry.votes += row.votes;
    entry.total += (row.avgStars ?? 0) * row.votes;
    byRestaurant.set(row.restaurantSlug, entry);
  }
  return [...byRestaurant.entries()]
    .map(([restaurantSlug, entry]) => ({
      restaurantSlug,
      restaurantName: entry.name,
      votes: entry.votes,
      avgStars: entry.votes > 0 ? Math.round((entry.total / entry.votes) * 100) / 100 : null,
    }))
    .sort((a, b) => (b.avgStars ?? -1) - (a.avgStars ?? -1) || b.votes - a.votes);
}

export function standingsForCategory(results: DishResult[], category: DishCategory): Standing[] {
  return combine(results.filter((row) => row.category === category));
}

export function overallStandings(results: DishResult[]): Standing[] {
  return combine(results);
}

/** Ganador de una tabla ordenada, o null si no hay votos o hay empate exacto. */
export function leader(standings: Standing[]): Standing | null {
  const [first, second] = standings;
  if (!first || first.avgStars === null) return null;
  if (second && second.avgStars === first.avgStars && second.votes === first.votes) return null;
  return first;
}
