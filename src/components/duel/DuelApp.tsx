"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { forgetParticipant, type PublicParticipant } from "@/app/actions";
import { IntroSequence } from "@/components/intro/IntroSequence";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import type { Passport, Restaurant } from "@/lib/passport";
import { leader, overallStandings, type DishResult } from "@/lib/results";
import { ContendersView } from "./ContendersView";
import { PassportSheet } from "./PassportSheet";
import { RatingSheet, type RatedResult } from "./RatingSheet";
import { VoteView } from "./VoteView";

export type CampaignView = {
  state: "open" | "upcoming" | "closed";
  /** Fecha de apertura ya formateada en el servidor (solo si state = upcoming). */
  opensAtLabel: string | null;
  winnersPerRestaurant: number;
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
type View = { name: "contenders" } | { name: "vote"; slug: string };

function voteSlugFromHistory(): string | null {
  const state = window.history.state as { dcVote?: unknown } | null;
  return typeof state?.dcVote === "string" ? state.dcVote : null;
}

export function DuelApp({ catalog, campaign, entrySlug, remembered, initialPassport, results, skipIntro }: Props) {
  const [phase, setPhase] = useState<Phase>(skipIntro ? "ready" : "intro");
  const [view, setView] = useState<View>({ name: "contenders" });
  const [returning, setReturning] = useState(false);
  const [openDish, setOpenDish] = useState<string | null>(null);
  const [passportOpen, setPassportOpen] = useState(false);
  // undefined = usar lo que manda el servidor; null = la persona pidió "No soy yo".
  const [identityState, setIdentity] = useState<PublicParticipant | null | undefined>(undefined);
  const [passportState, setPassport] = useState<Passport | null | undefined>(undefined);

  const identity = identityState === undefined ? remembered : identityState;
  const passport = passportState === undefined ? initialPassport : passportState;
  const votingOpen = campaign.state === "open";
  const standings = results ? overallStandings(results) : null;
  const champion = standings ? leader(standings) : null;

  const appRef = useRef<HTMLDivElement>(null);
  const contendersRef = useRef<HTMLElement>(null);
  const voteRef = useRef<HTMLElement>(null);
  const busy = useRef(false);
  const { contextSafe } = useGSAP();

  const hint =
    campaign.state === "open"
      ? "Elige una esquina y califica sus platos"
      : campaign.state === "upcoming"
        ? `La votación abre el ${campaign.opensAtLabel ?? "pronto"}`
        : results
          ? "Así terminó el duelo"
          : "La votación cerró. Pronto anunciamos al campeón.";

  const instruction =
    campaign.state === "open"
      ? "Tú eres el juez: califica los platos que probaste."
      : campaign.state === "upcoming"
        ? `La votación abre el ${campaign.opensAtLabel ?? "pronto"}.`
        : "La votación está cerrada.";

  // ---------------------------------------------------------------------------
  // Transiciones entre pantallas
  // ---------------------------------------------------------------------------

  const showVote = (slug: string, history: "push" | "replace" | "none") => {
    busy.current = false;
    setReturning(false);
    setView({ name: "vote", slug });
    if (history === "push") window.history.pushState({ dcVote: slug }, "");
    if (history === "replace") window.history.replaceState({ dcVote: slug }, "");
    window.scrollTo(0, 0);
  };

  const showContenders = () => {
    busy.current = false;
    setReturning(true);
    setView({ name: "contenders" });
    window.scrollTo(0, 0);
  };

  /** Contrincantes → votación: el rival sale por su lado, el VS gira fuera y el elegido se queda con la arena. */
  const selectRestaurant = (slug: string, history: "push" | "none" = "push") => {
    if (busy.current) return;
    busy.current = true;
    const root = contendersRef.current;
    const index = catalog.findIndex((r) => r.slug === slug);
    if (!root || index < 0 || prefersReducedMotion()) {
      showVote(slug, history);
      return;
    }
    contextSafe(() => {
      const corners = root.querySelectorAll<HTMLElement>(".contender");
      const chosen = corners[index];
      const rival = corners[1 - index];
      const tl = gsap.timeline({ onComplete: () => showVote(slug, history), defaults: { ease: "power3.in" } });
      tl.to(root.querySelectorAll(".arena-vs"), { scale: 0, rotation: 90, duration: 0.35, ease: "back.in(2)" }, 0)
        .to(root.querySelectorAll(".arena-seam, .arena-hint, .arena-chip, .arena-wordmark"), { autoAlpha: 0, duration: 0.25 }, 0);
      if (rival) tl.to(rival, { xPercent: index === 0 ? 100 : -100, duration: 0.45 }, 0);
      if (chosen) {
        tl.to(chosen.querySelectorAll(".contender-meta, .contender-tag"), { autoAlpha: 0, duration: 0.2 }, 0)
          .to(chosen.querySelectorAll(".contender-name"), { scale: 1.12, duration: 0.4, ease: "power2.out" }, 0)
          .to(chosen, { autoAlpha: 0, duration: 0.25 }, 0.35);
      }
    })();
  };

  /** Votación → contrincantes. */
  const backToContenders = () => {
    if (busy.current) return;
    busy.current = true;
    const root = voteRef.current;
    if (!root || prefersReducedMotion()) {
      showContenders();
      return;
    }
    contextSafe(() => {
      gsap.to(root, { autoAlpha: 0, y: 24, duration: 0.3, ease: "power2.in", onComplete: showContenders });
    })();
  };

  /** Votación de un restaurante → votación del otro. */
  const switchRestaurant = (slug: string) => {
    if (busy.current) return;
    busy.current = true;
    const root = voteRef.current;
    if (!root || prefersReducedMotion()) {
      showVote(slug, "replace");
      return;
    }
    contextSafe(() => {
      gsap.to(root, { autoAlpha: 0, x: -24, duration: 0.3, ease: "power2.in", onComplete: () => showVote(slug, "replace") });
    })();
  };

  // El botón "atrás" del celular también vuelve a los contrincantes (y "adelante" regresa a la votación).
  useEffect(() => {
    const onPopState = () => {
      const slug = voteSlugFromHistory();
      if (slug && catalog.some((r) => r.slug === slug)) {
        if (view.name === "contenders") selectRestaurant(slug, "none");
      } else if (view.name === "vote") {
        backToContenders();
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  });

  const goBack = () => {
    if (voteSlugFromHistory()) window.history.back();
    else backToContenders();
  };

  // Sin scroll mientras corre la intro: el encaje del título depende de ello.
  useEffect(() => {
    if (phase !== "intro") return;
    const html = document.documentElement;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = "";
    };
  }, [phase]);

  // ---------------------------------------------------------------------------
  // Pasaporte e identidad
  // ---------------------------------------------------------------------------

  const handleRated = (result: RatedResult) => {
    setIdentity(result.participant);
    setPassport(result.passport);
  };

  const handleForget = () => {
    setIdentity(null);
    setPassport(null);
    void forgetParticipant();
  };

  const selected = view.name === "vote" ? catalog.find((r) => r.slug === view.slug) : undefined;
  const other = selected ? catalog.find((r) => r.slug !== selected.slug) : undefined;
  const openTarget = openDish
    ? catalog.flatMap((r) => r.dishes.map((dish) => ({ dish, restaurant: r }))).find((t) => t.dish.slug === openDish)
    : undefined;

  return (
    <>
      <div
        ref={appRef}
        inert={phase === "intro"}
        className={clsx("relative min-h-dvh", phase === "intro" && "invisible")}
      >
        {selected ? (
          <>
            <div
              aria-hidden
              className="pointer-events-none fixed inset-0 bg-[radial-gradient(90%_45%_at_50%_0%,rgb(239_194_90/0.08),transparent_70%)]"
            />
            <VoteView
              key={selected.slug}
              restaurant={selected}
              other={other}
              passport={passport}
              totalRestaurants={catalog.length}
              votingOpen={votingOpen}
              instruction={instruction}
              results={results}
              rootRef={voteRef}
              onBack={goBack}
              onSwitch={switchRestaurant}
              onOpenDish={setOpenDish}
              onOpenPassport={() => setPassportOpen(true)}
            />
          </>
        ) : (
          <ContendersView
            catalog={catalog}
            passport={passport}
            entrySlug={entrySlug}
            hint={hint}
            standings={standings}
            championSlug={champion?.restaurantSlug ?? null}
            animateIn={returning}
            rootRef={contendersRef}
            onSelect={(slug) => selectRestaurant(slug)}
            onOpenPassport={() => setPassportOpen(true)}
          />
        )}
      </div>

      {/* La intro va después de la interfaz: así sus refs ya existen cuando la intro las mide. */}
      {phase !== "ready" ? (
        <IntroSequence
          targets={{ app: appRef, arena: contendersRef }}
          onReveal={() => setPhase("revealing")}
          onDone={() => setPhase("ready")}
        />
      ) : null}

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

      {passportOpen ? (
        <PassportSheet
          catalog={catalog}
          passport={passport}
          identity={identity}
          winnersPerRestaurant={campaign.winnersPerRestaurant}
          onForget={handleForget}
          onClose={() => setPassportOpen(false)}
        />
      ) : null}
    </>
  );
}
