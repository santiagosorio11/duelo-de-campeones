/** Mismo arranque visual que la intro, para que no haya un salto al cargar. */
export default function Loading() {
  return (
    <div className="fixed inset-0 bg-ink-950">
      <div
        aria-hidden
        className="intro-spot absolute inset-0 bg-[radial-gradient(60%_42%_at_50%_50%,rgb(239_194_90/0.16),transparent_70%)]"
      />
      <p className="sr-only">Cargando el duelo…</p>
    </div>
  );
}
