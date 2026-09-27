"use client";

import { ArrowRightIcon, SealCheckIcon } from "@phosphor-icons/react";
import type { CSSProperties } from "react";
import { CATEGORY_LABEL, type Dish, type Restaurant } from "@/lib/passport";
import { DishArt } from "./DishArt";
import { StarRow } from "./StarRow";

type Props = {
  dish: Dish;
  restaurant: Restaurant;
  /** Estrellas si ya está sellado en el pasaporte de esta persona. */
  stars: number | undefined;
  votingOpen: boolean;
  priority?: boolean;
  onOpen: () => void;
};

export function DishCard({ dish, restaurant, stars, votingOpen, priority, onOpen }: Props) {
  const categoryLabel = CATEGORY_LABEL[dish.category];
  const showCategory = dish.name.trim().toLowerCase() !== categoryLabel.toLowerCase();
  const interactive = votingOpen || Boolean(stars);

  const label = stars
    ? `${dish.name} de ${restaurant.name}, calificado con ${stars} estrellas`
    : `Calificar ${dish.name} de ${restaurant.name}`;

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!interactive}
      aria-label={label}
      style={{ "--team": restaurant.accentColor } as CSSProperties}
      className="dish-card group relative block h-[188px] w-full overflow-hidden rounded-[24px] border border-white/10 bg-ink-850 text-left transition-transform duration-200 ease-out active:scale-[0.985] disabled:cursor-default"
    >
      <DishArt dish={dish} priority={priority} />
      <div aria-hidden className="absolute inset-0 bg-linear-to-t from-ink-950 via-ink-950/55 to-transparent" />

      <div className="relative flex h-full items-end justify-between gap-3 p-5">
        <div className="min-w-0">
          {showCategory ? <p className="mb-1 text-xs text-mist">{categoryLabel}</p> : null}
          <h3 className="font-display text-[34px] leading-[0.92] text-bone uppercase">{dish.name}</h3>
        </div>

        {stars ? (
          <span className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-gold-400/15 px-2.5 py-1 text-xs font-medium text-gold-300 ring-1 ring-gold-400/35">
              <SealCheckIcon size={14} weight="fill" aria-hidden />
              Sellado
            </span>
            <StarRow value={stars} />
          </span>
        ) : votingOpen ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gold-400 px-4 py-2.5 text-sm font-semibold text-ink-950 transition-colors group-hover:bg-gold-300">
            Calificar
            <ArrowRightIcon size={16} weight="bold" aria-hidden />
          </span>
        ) : (
          <span className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs text-mist">Cerrado</span>
        )}
      </div>
    </button>
  );
}
