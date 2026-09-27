"use client";

import { TrophyIcon } from "@phosphor-icons/react";
import { leader, overallStandings, standingsForCategory, type DishResult, type Standing } from "@/lib/results";

function formatAvg(value: number | null): string {
  return value === null ? "sin votos" : `${value.toFixed(1).replace(".", ",")} de 5`;
}

function Winner({ label, standing }: { label: string; standing: Standing | null }) {
  return (
    <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3">
      <dt className="text-xs text-mist">{label}</dt>
      <dd className="mt-1">
        <span className="font-display block text-xl leading-none uppercase">{standing?.restaurantName ?? "Empate"}</span>
        {standing ? <span className="mt-1 block text-xs text-mist">{formatAvg(standing.avgStars)}</span> : null}
      </dd>
    </div>
  );
}

/** Revelación del campeón cuando el admin publica los resultados. */
export function ChampionReveal({ results }: { results: DishResult[] }) {
  const overall = leader(overallStandings(results));
  const burger = leader(standingsForCategory(results, "hamburguesa"));
  const chuzo = leader(standingsForCategory(results, "chuzo_desgranado"));

  return (
    <section
      aria-labelledby="champion-title"
      className="reveal-up mt-6 rounded-[24px] border border-gold-400/30 bg-ink-900 bg-[radial-gradient(90%_80%_at_50%_0%,rgb(239_194_90/0.18),transparent_70%)] p-5 text-center"
    >
      <TrophyIcon size={40} weight="duotone" className="mx-auto text-gold-400" aria-hidden />
      <p className="mt-2 text-sm text-mist">Campeón del duelo</p>
      <h2 id="champion-title" className="font-display text-gold mt-1 text-[52px] leading-[0.9] uppercase">
        {overall?.restaurantName ?? "Empate"}
      </h2>
      {overall ? (
        <p className="mt-2 text-sm text-mist">
          {formatAvg(overall.avgStars)} con {overall.votes} calificaciones
        </p>
      ) : null}
      <dl className="mt-5 grid grid-cols-2 gap-3 text-left">
        <Winner label="Mejor hamburguesa" standing={burger} />
        <Winner label="Mejor chuzo desgranado" standing={chuzo} />
      </dl>
    </section>
  );
}
