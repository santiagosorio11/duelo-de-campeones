"use client";

import { ShuffleIcon } from "@phosphor-icons/react";
import { useActionState } from "react";
import { drawWinner } from "./actions";

export function DrawButton({ disabled, votingOpen }: { disabled: boolean; votingOpen: boolean }) {
  const [state, action, pending] = useActionState(drawWinner, null);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (votingOpen && !window.confirm("La votación sigue abierta. ¿Sortear de todas formas?")) {
          event.preventDefault();
        }
      }}
      className="flex flex-wrap items-center gap-4"
    >
      <button
        type="submit"
        disabled={disabled || pending}
        className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-sm font-semibold text-ink-950 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ShuffleIcon size={18} weight="bold" aria-hidden />
        {pending ? "Sorteando…" : "Sortear ganador"}
      </button>
      {state ? (
        <p role="status" className={state.ok ? "text-sm text-gold-300" : "text-sm text-danger"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
