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
  /** Restaurantes sin ningún plato calificado todavía. */
  missingRestaurants: string[];
  /** Participa en el sorteo: al menos un plato de cada restaurante. */
  eligible: boolean;
  /** Oportunidades en el sorteo: una por plato calificado, solo si es elegible. */
  tickets: number;
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

  const ratedCount = Object.keys(stamps).length;
  const eligible = catalog.length > 0 && missingRestaurants.length === 0;

  return {
    stamps,
    ratedCount,
    totalDishes: known.size,
    missingRestaurants,
    eligible,
    tickets: eligible ? ratedCount : 0,
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
    return "Califica al menos un plato de cada restaurante para entrar al sorteo. Cada plato calificado suma una oportunidad.";
  }
  if (!passport.eligible) {
    const missing = catalog.filter((r) => passport.missingRestaurants.includes(r.slug)).map((r) => r.name);
    return `Te falta calificar un plato de ${joinNames(missing)} para entrar al sorteo.`;
  }
  const remaining = passport.totalDishes - passport.ratedCount;
  if (remaining <= 0) {
    return `Pasaporte completo: participas con ${passport.tickets} oportunidades.`;
  }
  const more = remaining === 1 ? "1 plato más" : `${remaining} platos más`;
  return `Ya participas con ${passport.tickets} oportunidades. Califica ${more} para sumar.`;
}
