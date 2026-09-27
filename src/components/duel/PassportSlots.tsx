"use client";

import clsx from "clsx";
import type { CSSProperties } from "react";
import type { Passport, Restaurant } from "@/lib/passport";
import { CategoryIcon } from "./DishArt";
import { StarRow } from "./StarRow";

const SHORT_LABEL = { hamburguesa: "Hamburguesa", chuzo_desgranado: "Chuzo" } as const;

/** Los sellos del pasaporte agrupados por restaurante. */
export function PassportSlots({
  catalog,
  passport,
  highlight,
}: {
  catalog: Restaurant[];
  passport: Passport | null;
  /** Plato recién sellado: se marca para la animación de estampado. */
  highlight?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {catalog.map((restaurant) => (
        <div
          key={restaurant.slug}
          style={{ "--team": restaurant.accentColor } as CSSProperties}
          className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3"
        >
          <p className="truncate text-xs font-medium text-bone/80">{restaurant.name}</p>
          <ul className="mt-3 flex justify-around gap-2">
            {restaurant.dishes.map((dish) => {
              const stars = passport?.stamps[dish.slug];
              return (
                <li key={dish.slug} className="flex flex-col items-center gap-1.5">
                  <span
                    data-stamp={dish.slug === highlight ? "new" : undefined}
                    className={clsx(
                      "grid size-12 place-items-center rounded-full",
                      stars
                        ? "-rotate-6 bg-[color-mix(in_oklab,var(--team)_32%,var(--color-ink-900))] text-gold-300 ring-2 ring-gold-400/70"
                        : "border-2 border-dashed border-white/15 text-white/25",
                    )}
                  >
                    <CategoryIcon category={dish.category} size={22} weight={stars ? "fill" : "regular"} aria-hidden />
                  </span>
                  <span className="text-[11px] text-mist">{SHORT_LABEL[dish.category]}</span>
                  {stars ? <StarRow value={stars} size={9} /> : <span className="h-[9px]" aria-hidden />}
                  <span className="sr-only">{stars ? `${dish.name}: sellado` : `${dish.name}: sin sello`}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
