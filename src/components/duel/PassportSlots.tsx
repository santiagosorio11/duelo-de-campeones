"use client";

import { SealCheckIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import type { Passport, Restaurant } from "@/lib/passport";
import { StarRow } from "./StarRow";

const SHORT_LABEL = { hamburguesa: "Hamburguesa", chuzo_desgranado: "Chuzo" } as const;

/** Un sello por restaurante (con al menos un plato calificado) y el detalle de sus platos. */
export function PassportSlots({
  catalog,
  passport,
  highlight,
}: {
  catalog: Restaurant[];
  passport: Passport | null;
  /** Restaurante recién sellado: se marca para la animación de estampado. */
  highlight?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {catalog.map((restaurant) => {
        const stamped = restaurant.dishes.some((dish) => passport?.stamps[dish.slug]);
        return (
          <div key={restaurant.slug} className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3 text-center">
            <span
              data-stamp={restaurant.slug === highlight ? "new" : undefined}
              className={clsx(
                "mx-auto grid size-14 place-items-center rounded-full",
                stamped
                  ? "-rotate-6 bg-ink-850 text-gold-300 ring-2 ring-gold-400/70"
                  : "border-2 border-dashed border-white/15 text-[10px] text-dim",
              )}
            >
              {stamped ? <SealCheckIcon size={28} weight="fill" aria-hidden /> : "Sin sello"}
            </span>
            <p className="mt-2 truncate text-xs font-medium text-bone/85">{restaurant.name}</p>
            <ul className="mt-2 space-y-1 text-left text-[11px] text-mist">
              {restaurant.dishes.map((dish) => {
                const stars = passport?.stamps[dish.slug];
                return (
                  <li key={dish.slug} className="flex items-center justify-between gap-2">
                    <span className="truncate">{SHORT_LABEL[dish.category]}</span>
                    {stars ? <StarRow value={stars} size={9} /> : <span className="text-dim">Sin calificar</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
