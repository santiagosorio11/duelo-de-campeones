"use client";

import { TicketIcon } from "@phosphor-icons/react";
import clsx from "clsx";

export function PassportChip({
  rated,
  total,
  onOpen,
  className,
}: {
  rated: number;
  total: number;
  onOpen: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-ink-900/70 px-3.5 py-2 text-sm text-bone/90 backdrop-blur transition hover:border-gold-400/60 active:scale-[0.97]",
        className,
      )}
    >
      <TicketIcon size={18} weight="duotone" className="text-gold-400" aria-hidden />
      <span>
        Pasaporte{" "}
        <span className="tabular-nums text-gold-300">
          {rated}/{total}
        </span>
        <span className="sr-only"> platos calificados</span>
      </span>
    </button>
  );
}
