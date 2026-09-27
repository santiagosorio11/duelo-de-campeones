export type DishCategory = "hamburguesa" | "chuzo_desgranado";

export type Dish = {
  id: number;
  slug: string;
  name: string;
  category: DishCategory;
  description: string | null;
  imagePath: string | null;
};

export type Restaurant = {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
  accentColor: string;
  logoPath: string | null;
  dishes: Dish[];
};

export type RatingRecord = { dishSlug: string; stars: number };

export type Passport = {
  /** Estrellas por slug de plato calificado. */
  stamps: Record<string, number>;
  ratedCount: number;
  totalDishes: number;
  /** Un sello por restaurante: al menos un plato calificado ahí. */
  restaurantsCovered: number;
  totalRestaurants: number;
  /** Restaurantes sin ningún plato calificado todavía. */
  missingRestaurants: string[];
  /** Participa en el sorteo: calificó al menos un plato en cada restaurante. */
  eligible: boolean;
};

export function buildPassport(catalog: Restaurant[], ratings: RatingRecord[]): Passport {
  const known = new Set(catalog.flatMap((restaurant) => restaurant.dishes.map((dish) => dish.slug)));
  const stamps: Record<string, number> = {};
  for (const rating of ratings) {
    if (known.has(rating.dishSlug)) stamps[rating.dishSlug] = rating.stars;
  }

  const missingRestaurants = catalog
    .filter((restaurant) => !restaurant.dishes.some((dish) => dish.slug in stamps))
    .map((restaurant) => restaurant.slug);

  return {
    stamps,
    ratedCount: Object.keys(stamps).length,
    totalDishes: known.size,
    restaurantsCovered: catalog.length - missingRestaurants.length,
    totalRestaurants: catalog.length,
    missingRestaurants,
    eligible: catalog.length > 0 && missingRestaurants.length === 0,
  };
}

export const CATEGORY_LABEL: Record<DishCategory, string> = {
  hamburguesa: "Hamburguesa",
  chuzo_desgranado: "Chuzo desgranado",
};

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

/** Texto del estado del sorteo según el pasaporte. */
export function raffleMessage(passport: Passport | null, catalog: Restaurant[]): string {
  if (!passport || passport.ratedCount === 0) {
    return "Califica al menos un plato en cada restaurante y entras al sorteo.";
  }
  if (!passport.eligible) {
    const missing = catalog.filter((r) => passport.missingRestaurants.includes(r.slug)).map((r) => r.name);
    return `Te falta calificar un plato de ${joinNames(missing)} para entrar al sorteo.`;
  }
  return "¡Ya estás en el sorteo! Si ganas, te contactamos al celular que registraste.";
}

/** Textos del premio a partir del catálogo y del cupo de ganadores por restaurante. */
export function prizeCopy(catalog: Restaurant[], winnersPerRestaurant: number) {
  const perRestaurant = catalog.map((r) => `${winnersPerRestaurant} en ${r.name}`);
  return {
    title: "1 mes de hamburguesas gratis",
    winners: `${winnersPerRestaurant * catalog.length} ganadores: ${joinNames(perRestaurant)}.`,
    detail: "Cada ganador recibe 1 hamburguesa o 1 chuzo al día. No es acumulable ni transferible.",
  };
}
