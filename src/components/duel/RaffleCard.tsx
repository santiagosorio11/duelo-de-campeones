"use client";

import { TicketIcon } from "@phosphor-icons/react";
import type { PublicParticipant } from "@/app/actions";
import { raffleMessage, type Passport, type Restaurant } from "@/lib/passport";
import { PassportSlots } from "./PassportSlots";

type Props = {
  catalog: Restaurant[];
  passport: Passport | null;
  identity: PublicParticipant | null;
  onForget: () => void;
};

export function RaffleCard({ catalog, passport, identity, onForget }: Props) {
  return (
    <section
      id="pasaporte"
      aria-labelledby="raffle-title"
      className="reveal-up mt-8 scroll-mt-6 rounded-[24px] border border-gold-400/20 bg-ink-900 bg-[radial-gradient(120%_120%_at_100%_0%,rgb(239_194_90/0.13),transparent_60%)] p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="raffle-title" className="font-display text-gold text-[30px] leading-[0.95] uppercase">
            1 mes de hamburguesas gratis
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-mist">{raffleMessage(passport, catalog)}</p>
        </div>
        <div className="relative shrink-0">
          <TicketIcon size={40} weight="duotone" className="text-gold-400" aria-hidden />
          {passport?.eligible ? (
            <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-gold-400 text-xs font-bold text-ink-950">
              {passport.tickets}
              <span className="sr-only"> oportunidades</span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-5">
        <PassportSlots catalog={catalog} passport={passport} />
      </div>

      {identity ? (
        <p className="mt-4 text-xs text-dim">
          Pasaporte de {identity.name} ({identity.phoneMasked}).{" "}
          <button type="button" onClick={onForget} className="text-mist underline underline-offset-4 hover:text-bone">
            No soy yo
          </button>
        </p>
      ) : null}
    </section>
  );
}
