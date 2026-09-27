"use client";

import { StarIcon } from "@phosphor-icons/react";
import clsx from "clsx";

/** Estrellas de solo lectura. */
export function StarRow({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span role="img" aria-label={`${value} de 5 estrellas`} className={clsx("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon
          key={n}
          size={size}
          weight={n <= value ? "fill" : "regular"}
          className={n <= value ? "text-gold-400" : "text-white/25"}
          aria-hidden
        />
      ))}
    </span>
  );
}
