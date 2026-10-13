export type RaffleRating = {
  restaurantId: number;
  stars: number;
};

/** Excluye perfiles completos 5-5 / 1-1 o 5-5 / 2-2, sin importar qué restaurante recibió cada nota. */
export function hasExcludedRafflePattern(ratings: RaffleRating[]): boolean {
  const byRestaurant = new Map<number, number[]>();
  for (const rating of ratings) {
    const stars = byRestaurant.get(rating.restaurantId) ?? [];
    stars.push(rating.stars);
    byRestaurant.set(rating.restaurantId, stars);
  }

  const profiles = [...byRestaurant.values()].map((stars) => stars.toSorted((left, right) => left - right).join(""));
  return profiles.includes("55") && (profiles.includes("11") || profiles.includes("22"));
}
