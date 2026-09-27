"use client";

import { ArrowRightIcon, SealCheckIcon, StarIcon } from "@phosphor-icons/react";
import { CATEGORY_LABEL, type Dish, type Restaurant } from "@/lib/passport";
import type { DishResult } from "@/lib/results";
import { DishArt } from "./DishArt";
import { StarRow } from "./StarRow";

type Props = {
  /** Número de round (orden del plato en el duelo). */
  round: number;
  dish: Dish;
  restaurant: Restaurant;
  /** Estrellas si ya está sellado en el pasaporte de esta persona. */
  stars: number | undefined;
  votingOpen: boolean;
  /** Resultado publicado del plato (solo al cierre). */
  result?: DishResult;
  priority?: boolean;
  onOpen: () => void;
};

export function DishCard({ round, dish, restaurant, stars, votingOpen, result, priority, onOpen }: Props) {
  const categoryLabel = CATEGORY_LABEL[dish.category];
  const showCategory = dish.name.trim().toLowerCase() !== categoryLabel.toLowerCase();
  const interactive = votingOpen || Boolean(stars);
  const overline = showCategory ? `Round ${round} · ${categoryLabel}` : `Round ${round}`;

  const label = stars
    ? `${dish.name} de ${restaurant.name}, calificado con ${stars} estrellas`
    : `Calificar ${dish.name} de ${restaurant.name}`;

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!interactive}
      aria-label={label}
      className="dish-card group relative block h-[212px] w-full overflow-hidden rounded-[24px] border border-white/10 bg-ink-850 text-left transition-transform duration-200 ease-out active:scale-[0.985] disabled:cursor-default"
    >
      <DishArt dish={dish} priority={priority} />
      <div aria-hidden className="absolute inset-0 bg-linear-to-t from-ink-950 via-ink-950/50 to-transparent" />

      <div className="relative flex h-full flex-col justify-between p-5">
        <div className="flex justify-end">
          {stars ? (
            <span className="flex flex-col items-end gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-gold-400/15 px-2.5 py-1 text-xs font-medium text-gold-300 ring-1 ring-gold-400/35">
                <SealCheckIcon size={14} weight="fill" aria-hidden />
                Sellado
              </span>
              <StarRow value={stars} />
            </span>
          ) : votingOpen ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-400 px-4 py-2.5 text-sm font-semibold text-ink-950 transition-colors group-hover:bg-gold-300">
              Calificar
              <ArrowRightIcon size={16} weight="bold" aria-hidden />
            </span>
          ) : null}
        </div>

        <div className="min-w-0">
          <p className="font-display mb-1.5 text-sm tracking-[0.12em] text-gold-300 uppercase">{overline}</p>
          <h3 className="font-display text-[clamp(30px,10vw,42px)] leading-[0.9] text-bone uppercase">{dish.name}</h3>
          {result && result.avgStars !== null ? (
            <p className="mt-2 inline-flex items-center gap-1 text-sm text-gold-300">
              <StarIcon size={14} weight="fill" aria-hidden />
              {result.avgStars.toFixed(1).replace(".", ",")}
              <span className="text-mist"> con {result.votes} votos</span>
            </p>
          ) : null}
        </div>
      </div>
    </button>
  );
}
