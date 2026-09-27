"use client";

import clsx from "clsx";
import type { CSSProperties, KeyboardEvent, Ref } from "react";
import { VsBadge } from "@/components/brand/VsBadge";
import type { Passport, Restaurant } from "@/lib/passport";

type Props = {
  restaurants: Restaurant[];
  active: string;
  passport: Passport | null;
  onSelect: (slug: string) => void;
  tabsRef: Ref<HTMLDivElement>;
  vsRef: Ref<HTMLDivElement>;
};

/** Selector de restaurante: los dos "rincones" del duelo con el VS al centro. */
export function TeamTabs({ restaurants, active, passport, onSelect, tabsRef, vsRef }: Props) {
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = (index + (event.key === "ArrowRight" ? 1 : -1) + restaurants.length) % restaurants.length;
    onSelect(restaurants[next].slug);
    const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[data-tab]");
    tabs?.[next]?.focus();
  };

  return (
    <div ref={tabsRef} role="tablist" aria-label="Restaurantes" className="relative grid grid-cols-2 gap-3">
      {restaurants.map((restaurant, index) => {
        const selected = restaurant.slug === active;
        const stamped = restaurant.dishes.filter((dish) => passport?.stamps[dish.slug]).length;
        const mirror = index % 2 === 1;

        return (
          <button
            key={restaurant.slug}
            type="button"
            role="tab"
            data-tab
            id={`tab-${restaurant.slug}`}
            aria-selected={selected}
            aria-controls="dish-panel"
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(restaurant.slug)}
            onKeyDown={(event) => onKeyDown(event, index)}
            style={{ "--team": restaurant.accentColor } as CSSProperties}
            className={clsx(
              mirror ? "team-surface-mirror text-right" : "team-surface text-left",
              "relative flex h-[116px] flex-col justify-between overflow-hidden rounded-[24px] border p-4 transition-[opacity,border-color,transform] duration-300 active:scale-[0.98]",
              selected
                ? "border-[color-mix(in_oklab,var(--team)_65%,white_10%)] opacity-100"
                : "border-white/10 opacity-55 hover:opacity-80",
              mirror ? "pl-9" : "pr-9",
            )}
          >
            <span className="font-display block text-[25px] leading-[0.9] text-bone uppercase">{restaurant.name}</span>
            <span className="text-xs text-bone/70">
              {passport ? `${stamped} de ${restaurant.dishes.length} sellos` : `${restaurant.dishes.length} platos`}
            </span>
          </button>
        );
      })}

      <div
        ref={vsRef}
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[17px]"
      >
        <VsBadge />
      </div>
    </div>
  );
}
