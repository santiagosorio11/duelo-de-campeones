"use client";

import { StarIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import { useRef, type KeyboardEvent } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";

const LABELS = ["", "Le faltó", "Regular", "Bueno", "Muy bueno", "¡De campeonato!"];

type Props = {
  value: number;
  onChange: (value: number) => void;
  labelledBy: string;
  error?: string;
};

/** Selector de 1 a 5 estrellas (radiogroup accesible con flechas). */
export function StarRating({ value, onChange, labelledBy, error }: Props) {
  const group = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const { contextSafe } = useGSAP({ scope: group });

  const pop = (count: number) => {
    if (prefersReducedMotion()) return;
    contextSafe(() => {
      const targets = buttons.current.slice(0, count).filter(Boolean);
      gsap.fromTo(targets, { scale: 0.6 }, { scale: 1, duration: 0.45, ease: "back.out(3)", stagger: 0.04, overwrite: true });
    })();
  };

  const select = (n: number) => {
    onChange(n);
    pop(n);
    navigator.vibrate?.(8);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, n: number) => {
    const moves: Record<string, number> = {
      ArrowRight: Math.min(5, n + 1),
      ArrowUp: Math.min(5, n + 1),
      ArrowLeft: Math.max(1, n - 1),
      ArrowDown: Math.max(1, n - 1),
      Home: 1,
      End: 5,
    };
    const next = moves[event.key];
    if (!next) return;
    event.preventDefault();
    select(next);
    buttons.current[next - 1]?.focus();
  };

  return (
    <div>
      <div
        ref={group}
        role="radiogroup"
        aria-labelledby={labelledBy}
        aria-describedby={error ? "stars-error" : undefined}
        className="flex justify-center gap-1.5"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            ref={(el) => {
              buttons.current[n - 1] = el;
            }}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={n === 1 ? "1 estrella" : `${n} estrellas`}
            tabIndex={value === n || (value === 0 && n === 1) ? 0 : -1}
            onClick={() => select(n)}
            onKeyDown={(event) => onKeyDown(event, n)}
            className="grid size-14 place-items-center rounded-full"
          >
            <StarIcon
              weight={n <= value ? "fill" : "regular"}
              className={clsx("size-11 transition-colors", n <= value ? "text-gold-400" : "text-white/30")}
              aria-hidden
            />
          </button>
        ))}
      </div>
      <p aria-live="polite" className="mt-1 h-5 text-center text-sm font-medium text-gold-300">
        {LABELS[value]}
      </p>
      {error ? (
        <p id="stars-error" className="mt-1 text-center text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
