import clsx from "clsx";
import type { ComponentProps } from "react";

/** Emblema "VS". Medidas en em para escalarlo sin perder proporciones. */
export function VsBadge({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={clsx(
        "grid size-[2.6em] place-items-center rounded-full border-[0.09em] border-gold-400/80 bg-ink-950",
        "shadow-[inset_0_0_0.7em_rgb(239_194_90/0.22),0_0.35em_1.1em_rgb(0_0_0/0.65)]",
        className,
      )}
      {...props}
    >
      <span className="text-gold font-display translate-y-[0.04em] text-[1em] leading-none">VS</span>
    </div>
  );
}
