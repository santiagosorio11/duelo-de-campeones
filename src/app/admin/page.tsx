import { DownloadSimpleIcon, QrCodeIcon, SignOutIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { getAdminOverview, type DrawRow } from "@/lib/admin";
import { CATEGORY_LABEL, type DishCategory } from "@/lib/passport";
import { overallStandings, standingsForCategory, type DishResult, type Standing } from "@/lib/results";
import { isAdmin } from "@/lib/session";
import { formatBogota, isoToBogotaLocal } from "@/lib/time";
import { logout, resolveDraw } from "./actions";
import { CampaignForm } from "./CampaignForm";
import { DrawButton } from "./DrawButton";

export const metadata: Metadata = { title: "Admin | Duelo de Campeones" };

const ENTRIES_PREVIEW = 50;

function formatAvg(value: number | null): string {
  return value === null ? "sin votos" : value.toFixed(2).replace(".", ",");
}

function formatPhone(e164: string): string {
  const national = e164.replace(/^\+57/, "");
  return `${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
}

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const { campaign, catalog, results, entries, draws, alerts, participants, ratings } = await getAdminOverview();
  const tickets = entries.reduce((sum, entry) => sum + entry.tickets, 0);
  const pending = draws.find((draw) => draw.status === "pending");
  const confirmed = draws.find((draw) => draw.status === "confirmed");
  const colorFor = new Map(catalog.map((r) => [r.slug, r.accentColor]));

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Wordmark className="text-[22px]" />
          <span className="rounded-full border border-white/12 px-3 py-1 text-xs text-mist">Panel admin</span>
        </div>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link href="/admin/qr" className={navClass}>
            <QrCodeIcon size={18} aria-hidden /> QR de mesas
          </Link>
          <a href="/admin/export" className={navClass}>
            <DownloadSimpleIcon size={18} aria-hidden /> Descargar CSV
          </a>
          <form action={logout}>
            <button type="submit" className={navClass}>
              <SignOutIcon size={18} aria-hidden /> Salir
            </button>
          </form>
        </nav>
      </header>

      <section aria-label="Resumen" className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Participantes" value={participants} />
        <Stat label="Calificaciones" value={ratings} />
        <Stat label="En el sorteo" value={entries.length} />
        <Stat label="Oportunidades" value={tickets} />
      </section>

      <p className="mt-4 text-sm text-mist">
        Votación{" "}
        <strong className={campaign.isOpen ? "text-gold-300" : "text-danger"}>
          {campaign.isOpen ? "abierta" : "cerrada"}
        </strong>
        {campaign.endsAt ? ` · cierra el ${formatBogota(campaign.endsAt)}` : ""}. Resultados{" "}
        {campaign.resultsPublished ? "publicados" : "ocultos al público"}.
      </p>

      <Section title="Resultados">
        <div className="grid gap-4 md:grid-cols-3">
          {(["hamburguesa", "chuzo_desgranado"] as DishCategory[]).map((category) => (
            <Duel
              key={category}
              title={CATEGORY_LABEL[category]}
              standings={standingsForCategory(results, category)}
              results={results.filter((row) => row.category === category)}
              colorFor={colorFor}
            />
          ))}
          <Duel title="General" standings={overallStandings(results)} colorFor={colorFor} />
        </div>
      </Section>

      <Section title="Campaña">
        <CampaignForm
          isOpen={campaign.isOpenFlag}
          resultsPublished={campaign.resultsPublished}
          startsAt={isoToBogotaLocal(campaign.startsAt)}
          endsAt={isoToBogotaLocal(campaign.endsAt)}
        />
      </Section>

      <Section title="Sorteo">
        <p className="mb-4 max-w-[65ch] text-sm text-mist">
          Participan quienes calificaron al menos un plato de cada restaurante. Cada plato calificado es una
          oportunidad. Llama al ganador: si el número no es real o no responde, márcalo como no válido y sortea de
          nuevo.
        </p>

        {pending ? <DrawCard draw={pending} /> : null}
        {confirmed ? <DrawCard draw={confirmed} /> : null}
        {!pending && !confirmed ? <DrawButton disabled={entries.length === 0} votingOpen={campaign.isOpen} /> : null}

        {draws.some((draw) => draw.status === "rejected") ? (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-bone/90">Descartados</h3>
            <ul className="mt-2 space-y-1 text-sm text-mist">
              {draws
                .filter((draw) => draw.status === "rejected")
                .map((draw) => (
                  <li key={draw.id}>
                    {draw.fullName} ({formatPhone(draw.phone)}), {formatBogota(draw.drawnAt)}
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
      </Section>

      <Section title={`En el sorteo (${entries.length})`}>
        {entries.length === 0 ? (
          <p className="text-sm text-mist">Todavía nadie ha calificado platos de ambos restaurantes.</p>
        ) : (
          <div className="overflow-x-auto rounded-[16px] border border-white/10">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-white/[0.04] text-xs text-mist">
                <tr>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Celular</th>
                  <th className="px-4 py-3 font-medium">Oportunidades</th>
                  <th className="px-4 py-3 font-medium">Primera calificación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {entries.slice(0, ENTRIES_PREVIEW).map((entry) => (
                  <tr key={entry.participantId}>
                    <td className="px-4 py-3">{entry.fullName}</td>
                    <td className="px-4 py-3 tabular-nums">{formatPhone(entry.phone)}</td>
                    <td className="px-4 py-3 tabular-nums">{entry.tickets}</td>
                    <td className="px-4 py-3 text-mist">{formatBogota(entry.firstRatingAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {entries.length > ENTRIES_PREVIEW ? (
          <p className="mt-3 text-sm text-mist">
            Mostrando {ENTRIES_PREVIEW} de {entries.length}. Descarga el CSV para ver la lista completa.
          </p>
        ) : null}
      </Section>

      <Section title="Alertas">
        {alerts.length === 0 ? (
          <p className="text-sm text-mist">Ningún dispositivo ha calificado con más de un celular.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {alerts.map((alert) => (
              <li key={alert.deviceId} className="flex items-start gap-2">
                <WarningIcon size={18} className="mt-0.5 shrink-0 text-gold-400" aria-hidden />
                <span>
                  Dispositivo <code className="text-mist">{alert.deviceId.slice(0, 8)}</code>: {alert.participants}{" "}
                  celulares distintos, {alert.ratings} calificaciones.
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </main>
  );
}

const navClass =
  "inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-bone/90 transition hover:bg-white/5";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display mb-4 text-2xl leading-none uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-ink-900 p-4">
      <p className="text-xs text-mist">{label}</p>
      <p className="font-display mt-2 text-4xl leading-none tabular-nums">{value.toLocaleString("es-CO")}</p>
    </div>
  );
}

function Duel({
  title,
  standings,
  results,
  colorFor,
}: {
  title: string;
  standings: Standing[];
  results?: DishResult[];
  colorFor: Map<string, string>;
}) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-ink-900 p-4">
      <h3 className="text-sm font-medium text-bone/90">{title}</h3>
      <ol className="mt-3 space-y-4">
        {standings.map((standing, index) => {
          const row = results?.find((r) => r.restaurantSlug === standing.restaurantSlug);
          const max = Math.max(1, ...(row?.distribution ?? [1]));
          return (
            <li key={standing.restaurantSlug}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2.5 rounded-full"
                    style={{ background: colorFor.get(standing.restaurantSlug) }}
                  />
                  <span className={index === 0 && standing.avgStars !== null ? "font-semibold" : ""}>
                    {standing.restaurantName}
                  </span>
                </span>
                <span className="tabular-nums">
                  <span className="font-display text-2xl">{formatAvg(standing.avgStars)}</span>
                  <span className="ml-2 text-xs text-mist">{standing.votes} votos</span>
                </span>
              </div>
              {row ? (
                <div className="mt-2 grid grid-cols-5 items-end gap-1" aria-label="Distribución de estrellas">
                  {row.distribution.map((value, star) => (
                    <div key={star} className="flex flex-col items-center gap-1">
                      <div className="flex h-10 w-full items-end">
                        <div
                          className="w-full rounded-t-[4px] bg-gold-400/70"
                          style={{ height: `${Math.round((value / max) * 100)}%`, minHeight: value ? 2 : 0 }}
                        />
                      </div>
                      <span className="text-[10px] text-mist tabular-nums">
                        {star + 1}★ {value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function DrawCard({ draw }: { draw: DrawRow }) {
  const confirmed = draw.status === "confirmed";
  return (
    <div className="rounded-[16px] border border-gold-400/30 bg-ink-900 p-5">
      <p className="text-xs text-mist">{confirmed ? "Ganador confirmado" : "Ganador sorteado, pendiente de confirmar"}</p>
      <p className="font-display text-gold mt-2 text-4xl leading-none uppercase">{draw.fullName}</p>
      <p className="mt-2 text-sm">
        <a href={`tel:${draw.phone}`} className="text-gold-300 underline underline-offset-4">
          {formatPhone(draw.phone)}
        </a>
        <span className="text-mist">
          {" "}
          · {draw.tickets} de {draw.totalTickets} oportunidades entre {draw.poolSize} participantes
        </span>
      </p>
      <p className="mt-1 text-xs text-mist">{formatBogota(draw.drawnAt)}</p>
      {confirmed ? null : (
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={resolveDraw}>
            <input type="hidden" name="id" value={draw.id} />
            <input type="hidden" name="status" value="confirmed" />
            <button
              type="submit"
              className="rounded-full bg-gold-400 px-5 py-2.5 text-sm font-semibold text-ink-950 transition active:scale-[0.98]"
            >
              Confirmar ganador
            </button>
          </form>
          <form action={resolveDraw}>
            <input type="hidden" name="id" value={draw.id} />
            <input type="hidden" name="status" value="rejected" />
            <button
              type="submit"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-bone/90 transition hover:bg-white/5 active:scale-[0.98]"
            >
              Número no válido
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
