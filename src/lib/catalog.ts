import "server-only";
import { cache } from "react";
import type { DishCategory, RatingRecord, Restaurant } from "@/lib/passport";
import type { DishResult } from "@/lib/results";
import { supabaseAdmin, withRetry } from "@/lib/supabase/server";

export const getCatalog = cache(async (): Promise<Restaurant[]> => {
  const { data, error } = await withRetry(() =>
    supabaseAdmin()
      .from("restaurants")
      .select(
        "id, slug, name, tagline, accent_color, logo_path, sort_order, dishes(id, slug, name, category, description, image_path, sort_order, is_active)",
      )
      .order("sort_order"),
  );

  if (error) throw new Error(`No se pudo cargar el catálogo: ${error.message}`);

  return data.map((restaurant) => ({
    id: restaurant.id,
    slug: restaurant.slug,
    name: restaurant.name,
    tagline: restaurant.tagline,
    accentColor: restaurant.accent_color,
    logoPath: restaurant.logo_path,
    dishes: restaurant.dishes
      .filter((dish) => dish.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((dish) => ({
        id: dish.id,
        slug: dish.slug,
        name: dish.name,
        category: dish.category as DishCategory,
        description: dish.description,
        imagePath: dish.image_path,
      })),
  }));
});

export type CampaignState = {
  /** Abierta según el interruptor y las fechas. */
  isOpen: boolean;
  isOpenFlag: boolean;
  resultsPublished: boolean;
  startsAt: string | null;
  endsAt: string | null;
};

export const getCampaign = cache(async (): Promise<CampaignState> => {
  const { data, error } = await withRetry(() => supabaseAdmin().from("campaign").select("*").eq("id", true).maybeSingle());
  if (error) throw new Error(`No se pudo cargar la campaña: ${error.message}`);

  const now = Date.now();
  const started = !data?.starts_at || now >= Date.parse(data.starts_at);
  const notEnded = !data?.ends_at || now < Date.parse(data.ends_at);

  return {
    isOpen: Boolean(data?.is_open) && started && notEnded,
    isOpenFlag: data?.is_open ?? false,
    resultsPublished: data?.results_published ?? false,
    startsAt: data?.starts_at ?? null,
    endsAt: data?.ends_at ?? null,
  };
});

export async function getRatingsForPhone(phoneE164: string): Promise<RatingRecord[]> {
  const { data, error } = await withRetry(() =>
    supabaseAdmin()
      .from("participants")
      .select("id, ratings(stars, dishes(slug))")
      .eq("phone_e164", phoneE164)
      .maybeSingle(),
  );

  if (error) throw new Error(`No se pudo cargar el pasaporte: ${error.message}`);

  return (data?.ratings ?? []).map((rating) => ({ dishSlug: rating.dishes.slug, stars: rating.stars }));
}

export async function getDishResults(): Promise<DishResult[]> {
  const { data, error } = await withRetry(() => supabaseAdmin().from("dish_results").select("*"));
  if (error) throw new Error(`No se pudieron cargar los resultados: ${error.message}`);

  return data.map((row) => ({
    dishSlug: row.dish_slug ?? "",
    dishName: row.dish_name ?? "",
    category: row.category as DishCategory,
    restaurantSlug: row.restaurant_slug ?? "",
    restaurantName: row.restaurant_name ?? "",
    votes: row.votes ?? 0,
    avgStars: row.avg_stars === null ? null : Number(row.avg_stars),
    distribution: [row.stars_1 ?? 0, row.stars_2 ?? 0, row.stars_3 ?? 0, row.stars_4 ?? 0, row.stars_5 ?? 0],
  }));
}
