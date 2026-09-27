"use client";

import { ShuffleIcon } from "@phosphor-icons/react";
import { useActionState } from "react";
import { drawWinners } from "./actions";

type Props = {
  restaurantSlug: string;
  restaurantName: string;
  missing: number;
  votingOpen: boolean;
};

export function DrawButton({ restaurantSlug, restaurantName, missing, votingOpen }: Props) {
  const [state, action, pending] = useActionState(drawWinners.bind(null, restaurantSlug), null);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        const question = votingOpen
          ? `La votación sigue abierta. ¿Sortear ${missing} ganador(es) de ${restaurantName} de todas formas?`
          : `¿Sortear ${missing} ganador(es) de ${restaurantName}?`;
        if (!window.confirm(question)) event.preventDefault();
      }}
      className="flex flex-col items-start gap-3"
    >
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-5 py-2.5 text-sm font-semibold text-ink-950 transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
      >
        <ShuffleIcon size={18} weight="bold" aria-hidden />
        {pending ? "Sorteando…" : missing === 1 ? "Sortear 1 ganador" : `Sortear ${missing} ganadores`}
      </button>
      {state ? (
        <p role="status" className={state.ok ? "text-sm text-gold-300" : "text-sm text-danger"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
