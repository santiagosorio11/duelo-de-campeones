import clsx from "clsx";
import type { ComponentProps } from "react";

/** Emblema "VS" en octágono (guiño a la jaula). Medidas en em para escalarlo sin deformarlo. */
export function VsBadge({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={clsx("relative grid size-[2.8em] place-items-center", className)} {...props}>
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#fbe7b0_0%,#efc25a_40%,#8a6420_100%)] [clip-path:var(--octagon)]" />
      <div className="absolute inset-[0.1em] bg-ink-950 [clip-path:var(--octagon)]" />
      <div className="absolute inset-[0.1em] bg-[radial-gradient(70%_60%_at_50%_30%,rgb(239_194_90/0.22),transparent_70%)] [clip-path:var(--octagon)]" />
      <span className="text-gold font-display relative translate-y-[0.03em] text-[1.05em] leading-none tracking-[0.02em]">VS</span>
    </div>
  );
}
