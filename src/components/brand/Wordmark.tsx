import clsx from "clsx";
import type { ComponentProps } from "react";

/**
 * Logotipo tipográfico "Duelo de Campeones". Todas las medidas internas están
 * en em: la intro y el header usan el mismo componente a distinto tamaño, y la
 * animación puede encajar uno sobre el otro con una escala uniforme.
 */
export function Wordmark({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={clsx("font-display text-center uppercase select-none", className)} {...props}>
      <span data-wm="top" className="-mr-[0.42em] block text-[0.34em] leading-none tracking-[0.42em] text-bone/85">
        Duelo de
      </span>
      <span data-wm="main" className="text-gold block pt-[0.06em] text-[1em] leading-[0.92] tracking-[0.01em]">
        Campeones
      </span>
    </div>
  );
}
