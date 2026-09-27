"use client";

import { useRef, type RefObject } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { gsap, prefersReducedMotion, SplitText, useGSAP } from "@/lib/gsap";

const SEEN_KEY = "dc:intro-seen";
const SPARKS = 12;

/** Líneas de velocidad: posición vertical (%), ancho (vw) y grosor (px). */
const STREAKS = [
  [11, 42, 1],
  [18, 60, 2],
  [26, 35, 1],
  [33, 55, 1],
  [41, 70, 2],
  [52, 45, 1],
  [60, 65, 2],
  [67, 38, 1],
  [76, 58, 1],
  [85, 48, 2],
] as const;

const BEATS = [
  { number: "2", word: "Restaurantes" },
  { number: "4", word: "Platos" },
  { number: "1", word: "Campeón" },
];

export type IntroTargets = {
  /** Contenedor de la interfaz (oculto mientras arranca la intro). */
  app: RefObject<HTMLElement | null>;
  /** Arena de contrincantes: la intro termina animando sus piezas reales. */
  arena: RefObject<HTMLElement | null>;
};

type Props = {
  targets: IntroTargets;
  /** La arena ya se puede tocar (la intro sigue terminando encima). */
  onReveal: () => void;
  /** La intro terminó y se puede desmontar. */
  onDone: () => void;
};

type Fit = { x: number; y: number; scale: number };

/** Transformación que lleva `el` al lugar y tamaño de `target` (escala uniforme). */
function fitTo(el: Element | undefined, target: Element | undefined): Fit | null {
  if (!el || !target) return null;
  const a = el.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  if (!a.width || !a.height) return null;
  return {
    x: b.left + b.width / 2 - (a.left + a.width / 2),
    y: b.top + b.height / 2 - (a.top + a.height / 2),
    scale: b.height / a.height,
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
 * Motion graphic de entrada al estilo de una noche de pelea:
 * promo "2 restaurantes, 4 platos, 1 campeón" → cae el título → se encienden
 * las luces → cada esquina entra a toda velocidad → cae el octágono del VS.
 * El último cuadro ES la arena real, lista para elegir.
 */
export function IntroSequence({ targets, onReveal, onDone }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const revealed = useRef(false);
  const finished = useRef(false);

  const reveal = () => {
    if (revealed.current) return;
    revealed.current = true;
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
      if (!el || !contextSafe) return;
      const q = gsap.utils.selector(el);

      window.scrollTo(0, 0);

      // Red de seguridad: pase lo que pase, la intro nunca deja la pantalla en negro.
      const watchdog = window.setTimeout(() => {
        if (!timeline.current) finish();
      }, 4000);

      const build = contextSafe(() => {
        if (finished.current) return;
        const app = targets.app.current;
        const arena = targets.arena.current;
        if (!app || !arena) {
          finish();
          return;
        }

        if (prefersReducedMotion()) {
          timeline.current = gsap
            .timeline({ onComplete: finish })
            .to(el, { autoAlpha: 0, duration: 0.4 })
            .fromTo(app, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0);
          return;
        }

        const full = !wasSeen();
        const a = gsap.utils.selector(arena);
        const title = q(".intro-title")[0];
        const shake = q(".intro-shake");
        const streaks = q(".intro-streak");
        const flash = q(".intro-flash");
        const wordmark = a(".arena-wordmark");
        const atmos = a(".arena-atmos");
        const corners = a(".contender");
        const names = a(".contender-name");
        const details = a(".contender-tag, .contender-meta");
        const vs = a(".arena-vs");
        const seam = a(".arena-seam");
        const chrome = a(".arena-chip, .arena-hint");

        // 1. Medir antes de aplicar estados iniciales.
        const titleFit = fitTo(title, wordmark[0]);

        // 2. Estados iniciales: la arena existe pero todas sus piezas empiezan fuera de escena.
        const top = SplitText.create(q(".intro-title [data-wm=top]"), { type: "chars", mask: "chars" });
        const mainLine = q(".intro-title [data-wm=main]")[0];
        const main = SplitText.create(mainLine, { type: "chars", charsClass: "wm-char" });
        mainLine?.classList.add("is-split");

        gsap.set(q(".intro-stage"), { autoAlpha: 1 });
        gsap.set(q(".promo-beat"), { autoAlpha: 0 });
        gsap.set(streaks, { x: "-80vw" });
        gsap.set(flash, { autoAlpha: 0 });
        gsap.set(q(".intro-ring"), { xPercent: -50, yPercent: -50, autoAlpha: 0 });
        gsap.set(q(".intro-spark"), { xPercent: -50, yPercent: -50, autoAlpha: 0, rotation: (i: number) => i * (360 / SPARKS) + 90 });

        gsap.set(app, { autoAlpha: 1 });
        gsap.set([wordmark, atmos, chrome], { autoAlpha: 0 });
        gsap.set(corners, { xPercent: (i: number) => (i === 0 ? -100 : 100) });
        gsap.set(names, { autoAlpha: 0, x: (i: number) => (i === 0 ? -0.5 : 0.5) * window.innerWidth, skewX: (i: number) => (i === 0 ? -18 : 18) });
        gsap.set(details, { autoAlpha: 0, y: 14 });
        gsap.set(vs, { autoAlpha: 0, scale: 3.2, rotation: -25 });
        gsap.set(seam, { scale: 0, transformOrigin: "50% 50%" });

        const tl = gsap.timeline({ onComplete: finish, defaults: { ease: "power3.out" } });
        timeline.current = tl;
        if (process.env.NODE_ENV !== "production") {
          // Solo en desarrollo: permite pausar la intro desde la consola para revisarla.
          (window as unknown as { __introTimeline?: gsap.core.Timeline }).__introTimeline = tl;
        }

        const rush = (at: string | number, duration = 0.5) =>
          tl.fromTo(
            streaks,
            { x: "-80vw", autoAlpha: 1 },
            { x: "180vw", autoAlpha: 0.8, duration, stagger: 0.015, ease: "power2.in", immediateRender: false },
            at,
          );
        const hit = (at: string | number, strength = 1) =>
          tl.to(shake, {
            keyframes: { x: [0, -9 * strength, 7 * strength, -4 * strength, 0], y: [0, 5 * strength, -4 * strength, 2 * strength, 0] },
            duration: 0.32,
            ease: "none",
          }, at);
        const blink = (at: string | number, peak: number) =>
          tl.to(flash, { keyframes: [{ autoAlpha: peak, duration: 0.05 }, { autoAlpha: 0, duration: 0.5, ease: "power2.out" }] }, at);

        if (full) {
          tl.to(q(".intro-skip"), { autoAlpha: 1, duration: 0.5 }, 0.6);

          // Promo: 2 restaurantes, 4 platos, 1 campeón.
          const beats = q(".promo-beat");
          const beatAt = [0.5, 1.35, 2.2];
          beats.forEach((beat, i) => {
            const label = `beat${i}`;
            const side = i % 2 === 0 ? 1 : -1;
            tl.addLabel(label, beatAt[i]);
            tl.fromTo(
              beat,
              { autoAlpha: 0, scale: 1.9, x: 80 * side, skewX: -14 * side },
              { autoAlpha: 1, scale: 1, x: 0, skewX: 0, duration: 0.42, ease: "power4.out", immediateRender: false },
              label,
            );
            rush(label);
            hit(`${label}+=0.1`, 0.8);
            if (i < beats.length - 1) {
              tl.to(beat, { autoAlpha: 0, x: -110 * side, skewX: 14 * side, duration: 0.28, ease: "power3.in" }, `${label}+=0.62`);
            } else {
              tl.to(beat, { autoAlpha: 0, scale: 0.8, duration: 0.3, ease: "power2.in" }, `${label}+=0.95`);
            }
          });

          // Cae el título.
          tl.addLabel("title", "beat2+=1.2");
          blink("title", 0.5);
          hit("title", 1.2);
          tl.from(top.chars, { yPercent: 115, duration: 0.8, stagger: 0.05, ease: "power4.out" }, "title+=0.05")
            .from(main.chars, {
              autoAlpha: 0,
              scale: 2.4,
              yPercent: -20,
              duration: 0.7,
              stagger: { each: 0.06, from: "center" },
              ease: "slam",
            }, "title+=0.1")
            .addLabel("fly", "title+=1.9");
        } else {
          // Versión corta para quien ya la vio en esta sesión.
          tl.from(main.chars, { autoAlpha: 0, scale: 2, duration: 0.45, stagger: { each: 0.03, from: "center" }, ease: "slam" }, 0.1)
            .from(top.chars, { yPercent: 115, duration: 0.45, stagger: 0.03, ease: "power4.out" }, 0.15)
            .addLabel("fly", 0.75);
        }

        const pace = full ? 1 : 0.7;
        const at = (offset: number) => `fly+=${(offset * pace).toFixed(3)}`;

        // El título sube al header, se encienden las luces y entran las esquinas.
        if (titleFit) {
          tl.to(title, { x: titleFit.x, y: titleFit.y, scale: titleFit.scale, duration: 1 * pace, ease: "power3.inOut" }, "fly");
        }
        tl.to(q(".intro-bg"), { autoAlpha: 0, duration: 0.5 }, at(0.05))
          .to(atmos, { keyframes: [{ autoAlpha: 0.9, duration: 0.08 }, { autoAlpha: 0.25, duration: 0.1 }, { autoAlpha: 1, duration: 0.4 }] }, at(0.1))
          .to(corners, { xPercent: 0, duration: 0.75 * pace, ease: "power4.out", stagger: 0.12 }, at(0.3));
        rush(at(0.3), 0.45);
        tl.to(names, { autoAlpha: 1, x: 0, skewX: 0, duration: 0.9 * pace, ease: "expo.out", stagger: 0.12 }, at(0.45))
          .set(wordmark, { autoAlpha: 1 }, at(1))
          .set(title, { autoAlpha: 0 }, at(1))
          // Cae el octágono del VS.
          .addLabel("versus", at(1.1))
          .to(vs, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.55, ease: "slam" }, "versus")
          .to(seam, { scale: 1, duration: 0.6, ease: "power3.out" }, "versus+=0.05")
          .to(q(".intro-skip"), { autoAlpha: 0, duration: 0.3 }, "versus");
        blink("versus+=0.1", full ? 0.35 : 0.2);
        hit("versus+=0.08", full ? 1.3 : 0.7);

        tl.fromTo(
          q(".intro-ring"),
          { autoAlpha: 0.9, scale: 0.4 },
          { autoAlpha: 0, scale: 3.2, duration: 0.85, ease: "power2.out", immediateRender: false },
          "versus+=0.1",
        ).fromTo(
          q(".intro-spark"),
          { autoAlpha: 1, x: 0, y: 0, scale: 1 },
          {
            autoAlpha: 0,
            scale: 0.3,
            x: (i: number) => Math.cos((i * 2 * Math.PI) / SPARKS) * (i % 2 ? 170 : 125),
            y: (i: number) => Math.sin((i * 2 * Math.PI) / SPARKS) * (i % 2 ? 170 : 125),
            duration: 0.8,
            ease: "power3.out",
            immediateRender: false,
          },
          "versus+=0.1",
        );

        tl.to(details, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "expo.out" }, "versus+=0.4")
          .to(chrome, { autoAlpha: 1, duration: 0.6, stagger: 0.1 }, "versus+=0.55")
          .call(reveal, undefined, "versus+=0.35");
      });

      // Medimos con la tipografía final ya cargada para que el encaje sea exacto.
      document.fonts.ready
        .then(build)
        .catch((error: unknown) => {
          console.error("Intro:", error);
          finish();
        });

      return () => window.clearTimeout(watchdog);
    },
    { scope: root },
  );

  const skip = () => {
    if (timeline.current) timeline.current.progress(1);
    else finish();
  };

  return (
    <div ref={root} className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      <div className="intro-bg absolute inset-0 bg-ink-950">
        <div
          aria-hidden
          className="intro-spot absolute inset-0 bg-[radial-gradient(60%_42%_at_50%_50%,rgb(239_194_90/0.16),transparent_70%)]"
        />
      </div>

      <div aria-hidden className="intro-stage invisible absolute inset-0">
        <div className="intro-shake absolute inset-0">
          {STREAKS.map(([top, width, height], i) => (
            <span
              key={i}
              className="intro-streak absolute left-0 rounded-full bg-[linear-gradient(90deg,transparent,rgb(246_214_138/0.75),transparent)]"
              style={{ top: `${top}%`, width: `${width}vw`, height }}
            />
          ))}

          <div className="absolute inset-0 text-[clamp(40px,12vw,110px)]">
            {BEATS.map((beat) => (
              <p key={beat.word} className="promo-beat font-display absolute inset-0 grid place-items-center text-center uppercase">
                <span>
                  <span className="text-gold block text-[2.4em] leading-[0.8]">{beat.number}</span>
                  <span className="block leading-none tracking-[0.04em] text-bone">{beat.word}</span>
                </span>
              </p>
            ))}
          </div>

          <div className="absolute inset-0 grid place-items-center">
            <div className="intro-title text-[clamp(60px,17vw,150px)]">
              <Wordmark />
            </div>
          </div>

          <div className="absolute inset-0 grid place-items-center">
            <div className="relative">
              <svg
                className="intro-ring absolute top-1/2 left-1/2 size-[110px] text-gold-300/80"
                viewBox="0 0 100 100"
              >
                <polygon
                  points="29.3,0 70.7,0 100,29.3 100,70.7 70.7,100 29.3,100 0,70.7 0,29.3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              {Array.from({ length: SPARKS }, (_, i) => (
                <span key={i} className="intro-spark absolute top-1/2 left-1/2 h-4 w-[3px] rounded-full bg-gold-300" />
              ))}
            </div>
          </div>
        </div>

        <div className="intro-flash absolute inset-0 bg-[#fff6e0]" />
      </div>

      <button
        type="button"
        onClick={skip}
        className="intro-skip pointer-events-auto invisible absolute top-[max(16px,env(safe-area-inset-top))] right-4 rounded-full border border-white/15 bg-ink-900/70 px-4 py-2 text-sm text-bone/85 backdrop-blur transition active:scale-[0.97]"
      >
        Saltar intro
      </button>
    </div>
  );
}
