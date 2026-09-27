"use client";

import { ArrowRightIcon, TrophyIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import type { RefObject } from "react";
import { VsBadge } from "@/components/brand/VsBadge";
import { Wordmark } from "@/components/brand/Wordmark";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import type { Passport, Restaurant } from "@/lib/passport";
import type { Standing } from "@/lib/results";
import { PassportChip } from "./PassportChip";
import { RestaurantMark } from "./RestaurantMark";

type Props = {
  catalog: Restaurant[];
  passport: Passport | null;
  entrySlug: string | null;
  hint: string;
  /** Tabla general publicada (solo al cierre): muestra promedio y campeón. */
  standings: Standing[] | null;
  championSlug: string | null;
  /** Anima la entrada al volver desde la vista de votación. */
  animateIn: boolean;
  rootRef: RefObject<HTMLElement | null>;
  onSelect: (slug: string) => void;
  onOpenPassport: () => void;
};

/** Pantalla 1: el cara a cara. Cada esquina es un botón recortado en diagonal. */
export function ContendersView({
  catalog,
  passport,
  entrySlug,
  hint,
  standings,
  championSlug,
  animateIn,
  rootRef,
  onSelect,
  onOpenPassport,
}: Props) {
  const pair = catalog.slice(0, 2);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // Las luces de la arena respiran despacio.
      gsap.to(".arena-light", {
        rotation: (i: number) => (i === 0 ? 5 : -5),
        duration: 6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      if (!animateIn) return;
      gsap
        .timeline({ defaults: { ease: "power4.out" } })
        .from(".contender", { xPercent: (i: number) => (i === 0 ? -100 : 100), duration: 0.6, stagger: 0.08 })
        .from(".contender-name", { x: (i: number) => (i === 0 ? -80 : 80), skewX: (i: number) => (i === 0 ? -14 : 14), duration: 0.7 }, 0.1)
        .from(".arena-vs", { scale: 2.6, rotation: -25, autoAlpha: 0, duration: 0.5, ease: "slam" }, 0.35)
        .from(".arena-seam", { scale: 0, duration: 0.5, ease: "power3.out" }, 0.4)
        .from(".contender-meta, .contender-tag, .arena-hint, .arena-chip, .arena-wordmark", { autoAlpha: 0, duration: 0.4 }, 0.5);
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} aria-label="Contrincantes" className="relative h-dvh min-h-[600px] overflow-hidden bg-ink-950">
      <div aria-hidden className="arena-atmos pointer-events-none absolute inset-0">
        <div className="cage absolute inset-0" />
        <div className="arena-light absolute -top-[8%] -left-[30%] h-[85%] w-[95%] rotate-[22deg]" />
        <div className="arena-light absolute -top-[8%] -right-[30%] h-[85%] w-[95%] -rotate-[22deg]" />
      </div>

      <h1 className="sr-only">Duelo de Campeones: {pair.map((r) => r.name).join(" contra ")}</h1>

      {pair.map((restaurant, index) => {
        const first = index === 0;
        const stamped = restaurant.dishes.filter((dish) => passport?.stamps[dish.slug]).length;
        const standing = standings?.find((s) => s.restaurantSlug === restaurant.slug);
        const meta = standing
          ? standing.avgStars === null
            ? "Sin votos"
            : `${standing.avgStars.toFixed(1).replace(".", ",")} de 5 en promedio`
          : passport
            ? `${stamped} de ${restaurant.dishes.length} platos calificados`
            : "Hamburguesa y chuzo desgranado";

        return (
          <button
            key={restaurant.slug}
            type="button"
            onClick={() => onSelect(restaurant.slug)}
            aria-label={`${restaurant.name}: ver y calificar sus platos`}
            className={clsx(
              "contender group absolute inset-0 text-left outline-none focus-visible:[&_.contender-name]:drop-shadow-[0_0_14px_rgb(239_194_90/0.6)]",
              first ? "corner-a" : "corner-b",
            )}
          >
            <span aria-hidden className={clsx("contender-bg absolute inset-0", first ? "corner-a-bg" : "corner-b-bg")} />
            <span
              aria-hidden
              className="absolute inset-0 bg-gold-400/[0.06] opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-active:opacity-100"
            />

            <span
              className={clsx(
                "absolute flex flex-col",
                first
                  ? "top-[15%] right-6 left-6 items-start landscape:top-1/2 landscape:right-[54%] landscape:-translate-y-1/2"
                  : "right-6 bottom-[12%] left-6 items-end landscape:top-1/2 landscape:bottom-auto landscape:left-[54%] landscape:-translate-y-1/2",
              )}
            >
              {championSlug === restaurant.slug ? (
                <span className="contender-tag mb-4 inline-flex items-center gap-1.5 rounded-full bg-gold-400 px-3 py-1 text-xs font-semibold text-ink-950">
                  <TrophyIcon size={14} weight="fill" aria-hidden />
                  Campeón
                </span>
              ) : entrySlug === restaurant.slug ? (
                <span className="contender-tag mb-4 rounded-full border border-gold-400/45 bg-ink-950/40 px-3 py-1 text-xs text-gold-300">
                  Estás aquí
                </span>
              ) : null}

              <span className="contender-name block text-[clamp(60px,18vw,120px)] text-bone">
                <RestaurantMark restaurant={restaurant} align={first ? "left" : "right"} />
              </span>

              <span className="contender-meta mt-5 inline-flex items-center gap-3 text-sm text-mist">
                {meta}
                <span className="grid size-9 place-items-center rounded-full border border-gold-400/40 text-gold-300 transition group-hover:border-gold-300 group-hover:bg-gold-400 group-hover:text-ink-950">
                  <ArrowRightIcon size={16} weight="bold" aria-hidden />
                </span>
              </span>
            </span>
          </button>
        );
      })}

      <svg
        aria-hidden
        className="arena-seam pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="seam-h" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#efc25a" stopOpacity="0" />
            <stop offset="0.5" stopColor="#f6d68a" stopOpacity="0.95" />
            <stop offset="1" stopColor="#efc25a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="seam-v" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#efc25a" stopOpacity="0" />
            <stop offset="0.5" stopColor="#f6d68a" stopOpacity="0.95" />
            <stop offset="1" stopColor="#efc25a" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line className="landscape:hidden" x1="0" y1="57" x2="100" y2="43" stroke="url(#seam-h)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        <line className="hidden landscape:block" x1="56" y1="0" x2="44" y2="100" stroke="url(#seam-v)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>

      <div aria-hidden className="arena-vs pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30px]">
        <VsBadge />
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 pt-[max(18px,env(safe-area-inset-top))]">
        <Wordmark className="arena-wordmark text-[22px]" />
        <PassportChip
          className="arena-chip pointer-events-auto"
          covered={passport?.restaurantsCovered ?? 0}
          total={catalog.length}
          onOpen={onOpenPassport}
        />
      </header>

      <p className="arena-hint pointer-events-none absolute inset-x-0 bottom-[max(18px,env(safe-area-inset-bottom))] z-20 px-6 text-center text-xs text-mist">
        {hint}
      </p>
    </section>
  );
}
