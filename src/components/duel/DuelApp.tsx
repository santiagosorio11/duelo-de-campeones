"use client";

import { StampIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { forgetParticipant, type PublicParticipant } from "@/app/actions";
import { Wordmark } from "@/components/brand/Wordmark";
import { IntroSequence } from "@/components/intro/IntroSequence";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import type { Passport, Restaurant } from "@/lib/passport";
import type { DishResult } from "@/lib/results";
import { ChampionReveal } from "./ChampionReveal";
import { DishCard } from "./DishCard";
import { RaffleCard } from "./RaffleCard";
import { RatingSheet, type RatedResult } from "./RatingSheet";
import { TeamTabs } from "./TeamTabs";

export type CampaignView = {
  state: "open" | "upcoming" | "closed";
  /** Fecha de apertura ya formateada en el servidor (solo si state = upcoming). */
  opensAtLabel: string | null;
};

type Props = {
  catalog: Restaurant[];
  campaign: CampaignView;
  entrySlug: string | null;
  remembered: PublicParticipant | null;
  initialPassport: Passport | null;
  results: DishResult[] | null;
  skipIntro: boolean;
};

type Phase = "intro" | "revealing" | "ready";

export function DuelApp({ catalog, campaign, entrySlug, remembered, initialPassport, results, skipIntro }: Props) {
  const [phase, setPhase] = useState<Phase>(skipIntro ? "ready" : "intro");
  const [activeSlug, setActiveSlug] = useState(entrySlug ?? catalog[0]?.slug ?? "");
  const [openDish, setOpenDish] = useState<string | null>(null);
  // undefined = usar lo que manda el servidor; null = la persona pidió "No soy yo".
  const [identityState, setIdentity] = useState<PublicParticipant | null | undefined>(undefined);
  const [passportState, setPassport] = useState<Passport | null | undefined>(undefined);

  const identity = identityState === undefined ? remembered : identityState;
  const passport = passportState === undefined ? initialPassport : passportState;
  const votingOpen = campaign.state === "open";

  const appRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const vsRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const previousSlug = useRef(activeSlug);

  const activeIndex = Math.max(0, catalog.findIndex((r) => r.slug === activeSlug));
  const active = catalog[activeIndex];
  const openTarget = openDish ? catalog.flatMap((r) => r.dishes.map((dish) => ({ dish, restaurant: r }))).find((t) => t.dish.slug === openDish) : undefined;

  // Sin scroll mientras corre la intro: las medidas del encaje dependen de ello.
  useEffect(() => {
    if (phase !== "intro") return;
    const html = document.documentElement;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = "";
    };
  }, [phase]);

  // Al cambiar de restaurante, las tarjetas entran desde el lado del rincón elegido.
  useGSAP(
    () => {
      if (previousSlug.current === activeSlug) return;
      const direction = activeIndex > catalog.findIndex((r) => r.slug === previousSlug.current) ? 1 : -1;
      previousSlug.current = activeSlug;
      if (prefersReducedMotion() || !cardsRef.current) return;
      gsap.fromTo(
        cardsRef.current.querySelectorAll(".dish-card"),
        { x: 28 * direction, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.5, stagger: 0.06, ease: "expo.out", clearProps: "transform,opacity,visibility" },
      );
    },
    { dependencies: [activeSlug], scope: cardsRef },
  );

  const handleRated = (result: RatedResult) => {
    setIdentity(result.participant);
    setPassport(result.passport);
  };

  const handleForget = () => {
    setIdentity(null);
    setPassport(null);
    void forgetParticipant();
  };

  const instruction =
    campaign.state === "open"
      ? "Toca el plato que probaste y califícalo."
      : campaign.state === "upcoming"
        ? `La votación abre el ${campaign.opensAtLabel ?? "pronto"}.`
        : results
          ? "La votación cerró. Así quedó el duelo."
          : "La votación cerró. Pronto anunciamos al campeón.";

  const ratedCount = passport?.ratedCount ?? 0;
  const totalDishes = catalog.reduce((sum, r) => sum + r.dishes.length, 0);

  return (
    <>
      {phase === "intro" || phase === "revealing" ? (
        <IntroSequence
          restaurants={catalog.map((r) => ({ slug: r.slug, name: r.name, accentColor: r.accentColor }))}
          activeIndex={activeIndex}
          targets={{ app: appRef, wordmark: wordmarkRef, vs: vsRef, tabs: tabsRef }}
          onReveal={() => setPhase("revealing")}
          onDone={() => setPhase("ready")}
        />
      ) : null}

      <div ref={appRef} inert={phase === "intro"} className={clsx("relative min-h-dvh", phase === "intro" && "invisible")}>
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
          {catalog.map((restaurant) => (
            <div
              key={restaurant.slug}
              style={{ "--team": restaurant.accentColor } as CSSProperties}
              className={clsx(
                "absolute inset-0 bg-[radial-gradient(90%_55%_at_50%_-8%,color-mix(in_oklab,var(--team)_26%,transparent),transparent_70%)] transition-opacity duration-700",
                restaurant.slug === activeSlug ? "opacity-100" : "opacity-0",
              )}
            />
          ))}
        </div>

        <div className="relative mx-auto w-full max-w-[480px] px-4 pb-[max(32px,env(safe-area-inset-bottom))]">
          <header className="flex items-center justify-between pt-[max(20px,env(safe-area-inset-top))]">
            <Wordmark ref={wordmarkRef} className="text-[24px]" />
            <a
              href="#pasaporte"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-ink-900/70 px-3.5 py-2 text-sm text-bone/90 backdrop-blur transition active:scale-[0.97]"
            >
              <StampIcon size={18} weight="duotone" className="text-gold-400" aria-hidden />
              <span>
                {ratedCount}/{totalDishes}
                <span className="sr-only"> sellos en tu pasaporte</span>
              </span>
            </a>
          </header>

          <h1 className="sr-only">
            Duelo de Campeones: {catalog.map((r) => r.name).join(" contra ")}
          </h1>

          {results ? <ChampionReveal results={results} /> : null}

          <div className="mt-7">
            <TeamTabs
              restaurants={catalog}
              active={activeSlug}
              passport={passport}
              onSelect={setActiveSlug}
              tabsRef={tabsRef}
              vsRef={vsRef}
            />
          </div>

          <section
            id="dish-panel"
            role="tabpanel"
            aria-labelledby={active ? `tab-${active.slug}` : undefined}
            className="mt-7"
          >
            <p className="reveal-up text-sm text-mist">{instruction}</p>
            <div ref={cardsRef} className="mt-3 grid gap-3">
              {active?.dishes.map((dish, index) => (
                <div key={dish.slug} className="reveal-up">
                  <DishCard
                    dish={dish}
                    restaurant={active}
                    stars={passport?.stamps[dish.slug]}
                    votingOpen={votingOpen}
                    priority={index === 0}
                    onOpen={() => setOpenDish(dish.slug)}
                  />
                </div>
              ))}
            </div>
          </section>

          <RaffleCard catalog={catalog} passport={passport} identity={identity} onForget={handleForget} />

          <footer className="reveal-up mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-dim">
            <p>Resultados al cierre del duelo.</p>
            <nav aria-label="Legal" className="flex gap-4">
              <Link href="/terminos" className="underline-offset-4 hover:text-bone hover:underline">
                Bases del sorteo
              </Link>
              <Link href="/privacidad" className="underline-offset-4 hover:text-bone hover:underline">
                Tratamiento de datos
              </Link>
            </nav>
          </footer>
        </div>
      </div>

      {openTarget ? (
        <RatingSheet
          key={openTarget.dish.slug}
          dish={openTarget.dish}
          restaurant={openTarget.restaurant}
          catalog={catalog}
          identity={identity}
          passport={passport}
          entrySlug={entrySlug}
          votingOpen={votingOpen}
          onRated={handleRated}
          onForget={handleForget}
          onClose={() => setOpenDish(null)}
        />
      ) : null}
    </>
  );
}
