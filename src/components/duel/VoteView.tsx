"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import type { RefObject } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import type { Passport, Restaurant } from "@/lib/passport";
import type { DishResult } from "@/lib/results";
import { DishCard } from "./DishCard";
import { PassportChip } from "./PassportChip";
import { RestaurantMark } from "./RestaurantMark";

type Props = {
  restaurant: Restaurant;
  other: Restaurant | undefined;
  passport: Passport | null;
  totalDishes: number;
  votingOpen: boolean;
  instruction: string;
  results: DishResult[] | null;
  rootRef: RefObject<HTMLElement | null>;
  onBack: () => void;
  onSwitch: (slug: string) => void;
  onOpenDish: (slug: string) => void;
  onOpenPassport: () => void;
};

/** Pantalla 2: los platos del restaurante elegido. */
export function VoteView({
  restaurant,
  other,
  passport,
  totalDishes,
  votingOpen,
  instruction,
  results,
  rootRef,
  onBack,
  onSwitch,
  onOpenDish,
  onOpenPassport,
}: Props) {
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap
        .timeline({ defaults: { ease: "expo.out" } })
        .from(".vote-header", { autoAlpha: 0, y: -10, duration: 0.5 })
        .from(".vote-title > *", { autoAlpha: 0, y: 28, duration: 0.8, stagger: 0.08 }, 0.05)
        .from(".vote-card", { autoAlpha: 0, y: 44, duration: 0.85, stagger: 0.1 }, 0.2)
        .from(".vote-other", { autoAlpha: 0, duration: 0.5 }, 0.5);
    },
    { scope: rootRef },
  );

  const otherPending = other ? other.dishes.some((dish) => !passport?.stamps[dish.slug]) : false;

  return (
    <section
      ref={rootRef}
      aria-labelledby="vote-title"
      className="mx-auto min-h-dvh w-full max-w-[480px] px-5 pb-[max(32px,env(safe-area-inset-bottom))]"
    >
      <header className="vote-header sticky top-0 z-20 -mx-5 flex items-center justify-between gap-3 bg-ink-950/85 px-5 pt-[max(14px,env(safe-area-inset-top))] pb-3 backdrop-blur-md">
        <button
          type="button"
          onClick={onBack}
          className="-ml-1 inline-flex items-center gap-2 rounded-full py-2 pr-3 pl-1 text-sm text-bone/85 transition hover:text-bone active:scale-[0.97]"
        >
          <ArrowLeftIcon size={18} aria-hidden />
          Contrincantes
        </button>
        <PassportChip rated={passport?.ratedCount ?? 0} total={totalDishes} onOpen={onOpenPassport} />
      </header>

      <div className="vote-title mt-8">
        <h1 id="vote-title" className="text-[clamp(44px,13vw,64px)] text-bone">
          <RestaurantMark restaurant={restaurant} />
        </h1>
        <p className="mt-3 text-sm text-mist">{instruction}</p>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-4">
        {restaurant.dishes.map((dish, index) => (
          <div key={dish.slug} className="vote-card">
            <DishCard
              round={index + 1}
              dish={dish}
              restaurant={restaurant}
              stars={passport?.stamps[dish.slug]}
              votingOpen={votingOpen}
              result={results?.find((row) => row.dishSlug === dish.slug)}
              priority={index === 0}
              onOpen={() => onOpenDish(dish.slug)}
            />
          </div>
        ))}
      </div>

      {other && votingOpen && otherPending ? (
        <button
          type="button"
          onClick={() => onSwitch(other.slug)}
          className="vote-other mt-9 inline-flex items-center gap-2 text-sm text-gold-300 underline-offset-4 hover:underline"
        >
          ¿También probaste {other.name}?
          <ArrowRightIcon size={16} weight="bold" aria-hidden />
        </button>
      ) : null}
    </section>
  );
}
