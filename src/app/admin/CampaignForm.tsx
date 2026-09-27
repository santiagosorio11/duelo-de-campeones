"use client";

import { useActionState } from "react";
import { updateCampaign } from "./actions";

type Props = {
  isOpen: boolean;
  resultsPublished: boolean;
  startsAt: string;
  endsAt: string;
};

export function CampaignForm({ isOpen, resultsPublished, startsAt, endsAt }: Props) {
  const [state, action, pending] = useActionState(updateCampaign, null);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-bone/90">Apertura (hora Colombia)</span>
          <input type="datetime-local" name="startsAt" defaultValue={startsAt} className={inputClass} />
          <span className="text-xs text-mist">Vacío: abierta desde ya.</span>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-bone/90">Cierre (hora Colombia)</span>
          <input type="datetime-local" name="endsAt" defaultValue={endsAt} className={inputClass} />
          <span className="text-xs text-mist">Vacío: sin cierre automático.</span>
        </label>
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="isOpen" defaultChecked={isOpen} className="mt-0.5 size-5 accent-gold-400" />
        <span>
          <span className="font-medium">Votación habilitada</span>
          <span className="block text-mist">Apágala para cerrar la votación de inmediato.</span>
        </span>
      </label>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="resultsPublished"
          defaultChecked={resultsPublished}
          className="mt-0.5 size-5 accent-gold-400"
        />
        <span>
          <span className="font-medium">Publicar resultados</span>
          <span className="block text-mist">Muestra al campeón en la página pública. Úsalo al cierre.</span>
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gold-400 px-6 py-3 text-sm font-semibold text-ink-950 transition active:scale-[0.98] disabled:opacity-70"
        >
          {pending ? "Guardando…" : "Guardar campaña"}
        </button>
        {state ? (
          <p role="status" className={state.ok ? "text-sm text-gold-300" : "text-sm text-danger"}>
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

const inputClass =
  "h-11 rounded-[14px] border border-white/12 bg-ink-850 px-3 text-base text-bone [color-scheme:dark] outline-none focus:border-gold-400/70 focus:ring-2 focus:ring-gold-400/25";
