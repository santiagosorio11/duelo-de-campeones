import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/Wordmark";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-[680px] px-5 pt-[max(24px,env(safe-area-inset-top))] pb-16">
      <Link href="/?skipIntro=1" aria-label="Volver al duelo" className="inline-block">
        <Wordmark className="text-[24px]" />
      </Link>
      <h1 className="font-display mt-10 text-[40px] leading-[0.95] uppercase">{title}</h1>
      <p className="mt-2 text-xs text-dim">Última actualización: {updated}</p>
      <div className="legal-prose mt-8">{children}</div>
      <Link
        href="/?skipIntro=1"
        className="mt-12 inline-flex rounded-full bg-gold-400 px-6 py-3 text-sm font-semibold text-ink-950 transition active:scale-[0.98]"
      >
        Volver al duelo
      </Link>
    </main>
  );
}
