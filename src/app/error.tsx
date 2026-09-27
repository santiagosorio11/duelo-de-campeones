"use client";

import { useEffect } from "react";
import { Wordmark } from "@/components/brand/Wordmark";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-start justify-center gap-6 px-6">
      <Wordmark className="text-[32px]" />
      <div>
        <h1 className="font-display text-4xl leading-none uppercase">Se nos quemó la parrilla</h1>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          No pudimos cargar el duelo. Revisa tu conexión e inténtalo de nuevo en unos segundos.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-gold-400 px-6 py-3 text-sm font-semibold text-ink-950 transition active:scale-[0.98]"
      >
        Reintentar
      </button>
    </main>
  );
}
