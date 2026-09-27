"use client";

import type { ReactNode } from "react";

export function PrintButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 text-sm font-semibold text-ink-950 transition active:scale-[0.98]"
    >
      {children}
    </button>
  );
}
