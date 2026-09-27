"use client";

import { useRef, type CSSProperties, type RefObject } from "react";
import { VsBadge } from "@/components/brand/VsBadge";
import { Wordmark } from "@/components/brand/Wordmark";
import { gsap, prefersReducedMotion, SplitText, useGSAP } from "@/lib/gsap";

const SEEN_KEY = "dc:intro-seen";
const SPARKS = 10;
const TAB_RADIUS = 24;

export type IntroTargets = {
  /** Contenedor de la interfaz real que aparece al final. */
  app: RefObject<HTMLElement | null>;
  wordmark: RefObject<HTMLElement | null>;
  vs: RefObject<HTMLElement | null>;
  /** Contenedor de las pestañas: cada pestaña lleva el atributo data-tab. */
  tabs: RefObject<HTMLElement | null>;
};

type IntroRestaurant = { slug: string; name: string; accentColor: string };

type Props = {
  restaurants: IntroRestaurant[];
  activeIndex: number;
  targets: IntroTargets;
  /** La interfaz ya es visible y se puede tocar (la intro sigue terminando encima). */
  onReveal: () => void;
  /** La intro terminó y se puede desmontar. */
  onDone: () => void;
};

type Fit = { x: number; y: number; scaleX: number; scaleY: number };

/** Transformación que lleva `el` al lugar y tamaño de `target` (centro a centro). */
function fitTo(el: Element | undefined, target: Element | null | undefined): Fit | null {
  if (!el || !target) return null;
  const a = el.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  if (!a.width || !a.height) return null;
  return {
    x: b.left + b.width / 2 - (a.left + a.width / 2),
    y: b.top + b.height / 2 - (a.top + a.height / 2),
    scaleX: b.width / a.width,
    scaleY: b.height / a.height,
  };
}

function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Navegación privada o almacenamiento bloqueado: se repite la intro completa.
  }
}

function wasSeen(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Motion graphic de entrada: dos filos chocan, cae el título, se abren los
 * rincones de cada restaurante, entra el VS y todo encaja en la interfaz real
 * de votación (título → header, rincones → pestañas, VS → emblema central).
 */
export function IntroSequence({ restaurants, activeIndex, targets, onReveal, onDone }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const revealed = useRef(false);
  const finished = useRef(false);

  const reveal = () => {
    if (revealed.current) return;
    revealed.current = true;
    if (root.current) root.current.style.pointerEvents = "none";
    onReveal();
  };

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    reveal();
    markSeen();
    onDone();
  };

  useGSAP(
    (_context, contextSafe) => {
      const el = root.current;
      const app = targets.app.current;
      if (!el || !app || !contextSafe) return;
      const q = gsap.utils.selector(el);

      window.scrollTo(0, 0);

      if (prefersReducedMotion()) {
        timeline.current = gsap
          .timeline({ onComplete: finish })
          .to(el, { autoAlpha: 0, duration: 0.3 })
          .fromTo(app, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0);
        return;
      }

      const build = contextSafe(() => {
        if (finished.current) return;
        const full = !wasSeen();

        const title = q(".intro-title")[0];
        const vs = q(".intro-vs")[0];
        const panels = q(".intro-panel");
        const names = q(".intro-name");
        const sparks = q(".intro-spark");
        const tabs = Array.from(targets.tabs.current?.querySelectorAll("[data-tab]") ?? []);
        const revealItems = app.querySelectorAll(".reveal-up");
        const portrait = window.innerHeight >= window.innerWidth;

        // 1. Medir todo antes de aplicar estados iniciales.
        const titleFit = fitTo(title, targets.wordmark.current);
        const vsFit = fitTo(vs, targets.vs.current);
        const panelFits = panels.map((panel, i) => fitTo(panel, tabs[i]));

        // 2. Estados iniciales.
        const top = SplitText.create(q(".intro-title [data-wm=top]"), { type: "chars", mask: "chars" });
        const mainLine = q(".intro-title [data-wm=main]")[0];
        const main = SplitText.create(mainLine, { type: "chars", charsClass: "wm-char" });
        mainLine?.classList.add("is-split");

        const axis = portrait ? "scaleY" : "scaleX";
        gsap.set(q(".intro-stage"), { autoAlpha: 1 });
        gsap.set(q(".intro-blade-a"), { xPercent: -50, yPercent: -50, rotation: 34, scaleX: 0, transformOrigin: "0% 50%" });
        gsap.set(q(".intro-blade-b"), { xPercent: -50, yPercent: -50, rotation: -34, scaleX: 0, transformOrigin: "100% 50%" });
        gsap.set(q(".intro-flash"), { autoAlpha: 0 });
        gsap.set(panels, {
          [axis]: 0,
          transformOrigin: (i: number) =>
            portrait ? (i === 0 ? "50% 100%" : "50% 0%") : i === 0 ? "100% 50%" : "0% 50%",
          borderRadius: "0px / 0px",
        });
        gsap.set(names, { autoAlpha: 0, x: (i: number) => (i === 0 ? -48 : 48) });
        gsap.set(vs, { scale: 0, rotation: -35 });
        gsap.set(q(".intro-ring"), { xPercent: -50, yPercent: -50, autoAlpha: 0 });
        gsap.set(sparks, { xPercent: -50, yPercent: -50, autoAlpha: 0, rotation: (i: number) => i * (360 / SPARKS) + 90 });

        const tl = gsap.timeline({ onComplete: finish, defaults: { ease: "power3.out" } });
        timeline.current = tl;

        if (full) {
          tl.to(q(".intro-skip"), { autoAlpha: 1, duration: 0.4 }, 0.6)
            .addLabel("clash", 0.3)
            .to(q(".intro-blade-a"), { scaleX: 1, duration: 0.42, ease: "power4.in" }, "clash")
            .to(q(".intro-blade-b"), { scaleX: 1, duration: 0.42, ease: "power4.in" }, "clash+=0.08")
            .addLabel("impact", "clash+=0.46")
            .to(q(".intro-flash"), {
              keyframes: [
                { autoAlpha: 0.85, duration: 0.05 },
                { autoAlpha: 0, duration: 0.5, ease: "power2.out" },
              ],
            }, "impact")
            .to(q(".intro-shake"), {
              keyframes: { x: [0, -12, 9, -6, 3, 0], y: [0, 7, -6, 4, -2, 0] },
              duration: 0.45,
              ease: "none",
            }, "impact")
            .to(q(".intro-blade"), { autoAlpha: 0, duration: 0.6 }, "impact+=0.2")
            .from(top.chars, { yPercent: 115, duration: 0.7, stagger: 0.04, ease: "power4.out" }, "impact+=0.05")
            .from(main.chars, {
              autoAlpha: 0,
              scale: 2.6,
              yPercent: -25,
              duration: 0.6,
              stagger: { each: 0.045, from: "center" },
              ease: "slam",
            }, "impact+=0.18")
            .fromTo(q(".intro-shine"), { xPercent: -130, skewX: -12 }, { xPercent: 130, skewX: -12, duration: 1, ease: "power2.inOut" }, "impact+=0.75")
            .addLabel("doors", "impact+=1.3");

          if (titleFit) {
            tl.to(title, { x: titleFit.x, y: titleFit.y, scale: titleFit.scaleY, duration: 0.85, ease: "power4.inOut" }, "doors");
          }

          tl.to(panels, { scaleX: 1, scaleY: 1, duration: 0.8, ease: "expo.out", stagger: 0.06 }, "doors+=0.2")
            .to(names, { autoAlpha: 1, x: 0, duration: 0.7, stagger: 0.08 }, "doors+=0.4")
            .addLabel("versus", "doors+=0.7")
            .to(vs, { scale: 1, rotation: 0, duration: 0.7, ease: "back.out(2.4)" }, "versus")
            .fromTo(
              q(".intro-ring"),
              { autoAlpha: 0.9, scale: 0.35 },
              { autoAlpha: 0, scale: 2.8, duration: 0.85, ease: "power2.out", immediateRender: false },
              "versus+=0.06",
            )
            .fromTo(
              sparks,
              { autoAlpha: 1, x: 0, y: 0, scale: 1 },
              {
                autoAlpha: 0,
                scale: 0.3,
                x: (i: number) => Math.cos((i * 2 * Math.PI) / SPARKS) * (i % 2 ? 150 : 115),
                y: (i: number) => Math.sin((i * 2 * Math.PI) / SPARKS) * (i % 2 ? 150 : 115),
                duration: 0.75,
                ease: "power3.out",
                immediateRender: false,
              },
              "versus+=0.06",
            )
            .to(q(".intro-shake"), { keyframes: { x: [0, 6, -4, 2, 0] }, duration: 0.3, ease: "none" }, "versus+=0.04")
            .addLabel("land", "versus+=0.95");
        } else {
          // Versión corta para quien ya la vio en esta sesión.
          gsap.set([...panels, vs], { autoAlpha: 0 });
          tl.from(main.chars, { autoAlpha: 0, scale: 2, duration: 0.45, stagger: { each: 0.03, from: "center" }, ease: "slam" }, 0.05)
            .from(top.chars, { yPercent: 115, duration: 0.5, stagger: 0.03, ease: "power4.out" }, 0.1)
            .addLabel("land", 0.55);
          if (titleFit) {
            tl.to(title, { x: titleFit.x, y: titleFit.y, scale: titleFit.scaleY, duration: 0.7, ease: "power4.inOut" }, "land");
          }
        }

        // 3. Aterrizaje: cada pieza encaja en su lugar de la interfaz real.
        tl.to(names, { autoAlpha: 0, duration: 0.25 }, "land").set(panels, { transformOrigin: "50% 50%" }, "land");

        panels.forEach((panel, i) => {
          const fit = panelFits[i];
          if (!fit) return;
          tl.to(panel, {
            x: fit.x,
            y: fit.y,
            scaleX: fit.scaleX,
            scaleY: fit.scaleY,
            borderRadius: `${TAB_RADIUS / fit.scaleX}px / ${TAB_RADIUS / fit.scaleY}px`,
            opacity: i === activeIndex ? 1 : 0.55,
            duration: 0.8,
            ease: "power4.inOut",
          }, "land");
        });

        if (vsFit) {
          tl.to(vs, { x: vsFit.x, y: vsFit.y, scale: vsFit.scaleY, rotation: 0, duration: 0.8, ease: "power4.inOut" }, "land");
        }

        tl.to(q(".intro-skip"), { autoAlpha: 0, duration: 0.2 }, "land")
          .to(q(".intro-bg"), { autoAlpha: 0, duration: 0.6 }, "land+=0.2")
          .fromTo(app, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, "land+=0.55")
          .call(reveal, undefined, "land+=0.6")
          .to([title, vs, ...panels], { autoAlpha: 0, duration: 0.3 }, "land+=0.85");

        if (revealItems.length) {
          tl.from(revealItems, { y: 36, autoAlpha: 0, duration: 0.8, stagger: 0.07, ease: "expo.out" }, "land+=0.6");
        }
      });

      // Medimos con la tipografía final ya cargada para que el encaje sea exacto.
      document.fonts.ready.then(build);
    },
    { scope: root },
  );

  const skip = () => {
    if (timeline.current) timeline.current.progress(1);
    else finish();
  };

  const [first, second] = restaurants;

  return (
    <div ref={root} className="fixed inset-0 z-[70] overflow-hidden">
      <div className="intro-bg absolute inset-0 bg-ink-950">
        <div
          aria-hidden
          className="intro-spot absolute inset-0 bg-[radial-gradient(60%_42%_at_50%_50%,rgb(239_194_90/0.16),transparent_70%)]"
        />
      </div>

      <div aria-hidden className="intro-stage invisible absolute inset-0">
        <div className="intro-shake absolute inset-0">
          {[first, second].map((restaurant, i) =>
            restaurant ? (
              <div
                key={restaurant.slug}
                style={{ "--team": restaurant.accentColor } as CSSProperties}
                className={
                  i === 0
                    ? "intro-panel team-surface absolute inset-x-0 top-0 h-1/2 landscape:inset-y-0 landscape:right-auto landscape:h-auto landscape:w-1/2"
                    : "intro-panel team-surface-mirror absolute inset-x-0 bottom-0 h-1/2 landscape:inset-y-0 landscape:left-auto landscape:h-auto landscape:w-1/2"
                }
              />
            ) : null,
          )}

          {first ? (
            <p className="intro-name font-display absolute top-[14%] left-6 max-w-[80%] text-[clamp(52px,16vw,120px)] leading-[0.86] text-bone uppercase landscape:top-auto landscape:bottom-[18%] landscape:max-w-[42%] landscape:text-[clamp(48px,8vw,120px)]">
              {first.name}
            </p>
          ) : null}
          {second ? (
            <p className="intro-name font-display absolute right-6 bottom-[14%] max-w-[80%] text-right text-[clamp(52px,16vw,120px)] leading-[0.86] text-bone uppercase landscape:top-[18%] landscape:bottom-auto landscape:max-w-[42%] landscape:text-[clamp(48px,8vw,120px)]">
              {second.name}
            </p>
          ) : null}

          <div className="intro-blade intro-blade-a absolute top-1/2 left-1/2 h-[2px] w-[150vmax] bg-[linear-gradient(90deg,transparent,var(--color-gold-300)_42%,#fff8e6_50%,var(--color-gold-300)_58%,transparent)]" />
          <div className="intro-blade intro-blade-b absolute top-1/2 left-1/2 h-[2px] w-[150vmax] bg-[linear-gradient(90deg,transparent,var(--color-gold-300)_42%,#fff8e6_50%,var(--color-gold-300)_58%,transparent)]" />

          <div className="absolute inset-0 grid place-items-center">
            <div className="relative">
              <div className="intro-title relative text-[clamp(64px,19vw,150px)]">
                <Wordmark />
                <div className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-overlay">
                  <div className="intro-shine absolute inset-y-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.85),transparent)]" />
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 grid place-items-center">
            <div className="relative">
              <div className="intro-ring absolute top-1/2 left-1/2 size-[120px] rounded-full border-2 border-gold-300/70" />
              {Array.from({ length: SPARKS }, (_, i) => (
                <span key={i} className="intro-spark absolute top-1/2 left-1/2 h-4 w-[3px] rounded-full bg-gold-300" />
              ))}
              <div className="intro-vs text-[44px]">
                <VsBadge />
              </div>
            </div>
          </div>
        </div>

        <div className="intro-flash absolute inset-0 bg-[#fff6e0]" />
      </div>

      <button
        type="button"
        onClick={skip}
        className="intro-skip invisible absolute top-[max(16px,env(safe-area-inset-top))] right-4 rounded-full border border-white/15 bg-ink-900/70 px-4 py-2 text-sm text-bone/85 backdrop-blur transition active:scale-[0.97]"
      >
        Saltar intro
      </button>
    </div>
  );
}
