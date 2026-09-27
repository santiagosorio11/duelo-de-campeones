"use client";

import { HamburgerIcon, PhoneIcon, SealCheckIcon, TrophyIcon } from "@phosphor-icons/react";
import Link from "next/link";
import type { PublicParticipant } from "@/app/actions";
import { BottomSheet, useSheetClose } from "@/components/ui/BottomSheet";
import { prizeCopy, raffleMessage, type Passport, type Restaurant } from "@/lib/passport";
import { PassportSlots } from "./PassportSlots";

type Props = {
  catalog: Restaurant[];
  passport: Passport | null;
  identity: PublicParticipant | null;
  winnersPerRestaurant: number;
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

function PassportContent({ catalog, passport, identity, winnersPerRestaurant, onForget }: Omit<Props, "onClose">) {
  const close = useSheetClose();
  const prize = prizeCopy(catalog, winnersPerRestaurant);

  return (
    <div className="px-5 pt-1">
      <h2 id="passport-title" className="font-display text-[40px] leading-[0.92] uppercase">
        Tu pasaporte
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-mist">{raffleMessage(passport, catalog)}</p>

      <div className="mt-6">
        <PassportSlots catalog={catalog} passport={passport} />
      </div>

      <h3 className="font-display mt-8 text-2xl leading-none uppercase text-gold">{prize.title}</h3>
      <ul className="mt-4 space-y-4 text-sm leading-relaxed">
        <li className="flex gap-3">
          <SealCheckIcon size={20} weight="duotone" className="mt-0.5 shrink-0 text-gold-400" aria-hidden />
          <span className="text-mist">Participas si calificas al menos un plato en cada restaurante.</span>
        </li>
        <li className="flex gap-3">
          <TrophyIcon size={20} weight="duotone" className="mt-0.5 shrink-0 text-gold-400" aria-hidden />
          <span className="text-mist">{prize.winners}</span>
        </li>
        <li className="flex gap-3">
          <HamburgerIcon size={20} weight="duotone" className="mt-0.5 shrink-0 text-gold-400" aria-hidden />
          <span className="text-mist">{prize.detail}</span>
        </li>
        <li className="flex gap-3">
          <PhoneIcon size={20} weight="duotone" className="mt-0.5 shrink-0 text-gold-400" aria-hidden />
          <span className="text-mist">Si ganas, te contactamos al celular que registraste. Usa un número válido.</span>
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
