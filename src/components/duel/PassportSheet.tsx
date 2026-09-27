"use client";

import { SealCheckIcon, StackIcon, TicketIcon } from "@phosphor-icons/react";
import Link from "next/link";
import type { PublicParticipant } from "@/app/actions";
import { BottomSheet, useSheetClose } from "@/components/ui/BottomSheet";
import { raffleMessage, type Passport, type Restaurant } from "@/lib/passport";
import { PassportSlots } from "./PassportSlots";

type Props = {
  catalog: Restaurant[];
  passport: Passport | null;
  identity: PublicParticipant | null;
  onForget: () => void;
  onClose: () => void;
};

/** Pasaporte y reglas del sorteo, fuera de la pantalla principal para no saturarla. */
export function PassportSheet({ onClose, ...props }: Props) {
  return (
    <BottomSheet labelledBy="passport-title" onClose={onClose}>
      <PassportContent {...props} />
    </BottomSheet>
  );
}

function PassportContent({ catalog, passport, identity, onForget }: Omit<Props, "onClose">) {
  const close = useSheetClose();

  return (
    <div className="px-5 pt-1">
      <h2 id="passport-title" className="font-display text-[40px] leading-[0.92] uppercase">
        Tu pasaporte
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-mist">{raffleMessage(passport, catalog)}</p>

      <div className="mt-6">
        <PassportSlots catalog={catalog} passport={passport} />
      </div>

      <ul className="mt-7 space-y-4 text-sm leading-relaxed">
        <li className="flex gap-3">
          <TicketIcon size={20} weight="duotone" className="mt-0.5 shrink-0 text-gold-400" aria-hidden />
          <span>
            <strong className="font-semibold">Premio: 1 mes de hamburguesas gratis.</strong>{" "}
            <span className="text-mist">Participas al calificar al menos un plato de cada restaurante.</span>
          </span>
        </li>
        <li className="flex gap-3">
          <StackIcon size={20} weight="duotone" className="mt-0.5 shrink-0 text-gold-400" aria-hidden />
          <span className="text-mist">Cada plato calificado es una oportunidad más: hasta 4.</span>
        </li>
        <li className="flex gap-3">
          <SealCheckIcon size={20} weight="duotone" className="mt-0.5 shrink-0 text-gold-400" aria-hidden />
          <span className="text-mist">Una calificación por celular en cada plato. Si ganas, te llamamos.</span>
        </li>
      </ul>

      {identity ? (
        <p className="mt-6 text-xs text-dim">
          Pasaporte de {identity.name} ({identity.phoneMasked}).{" "}
          <button type="button" onClick={onForget} className="text-mist underline underline-offset-4 hover:text-bone">
            No soy yo
          </button>
        </p>
      ) : null}

      <button
        type="button"
        onClick={close}
        className="mt-7 w-full rounded-full bg-gold-400 py-4 text-base font-semibold text-ink-950 transition active:scale-[0.99]"
      >
        Seguir calificando
      </button>

      <nav aria-label="Legal" className="mt-5 flex justify-center gap-6 text-xs text-mist">
        <Link href="/terminos" className="underline-offset-4 hover:text-bone hover:underline">
          Bases del sorteo
        </Link>
        <Link href="/privacidad" className="underline-offset-4 hover:text-bone hover:underline">
          Tratamiento de datos
        </Link>
      </nav>
    </div>
  );
}
