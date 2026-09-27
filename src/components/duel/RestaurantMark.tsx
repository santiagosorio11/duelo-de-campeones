"use client";

import clsx from "clsx";
import Image from "next/image";
import type { Restaurant } from "@/lib/passport";

/**
 * Identidad del restaurante: su logo (restaurants.logo_path) cuando exista,
 * o el nombre en tipografía display mientras tanto. Mide en em: el tamaño lo
 * define el font-size del contenedor.
 */
export function RestaurantMark({
  restaurant,
  align = "left",
  className,
}: {
  restaurant: Restaurant;
  align?: "left" | "right";
  className?: string;
}) {
  if (restaurant.logoPath) {
    return (
      <span className={clsx("relative block h-[1.7em] w-[min(78vw,20rem)]", className)}>
        <Image
          src={restaurant.logoPath}
          alt={restaurant.name}
          fill
          sizes="320px"
          className={clsx("object-contain", align === "right" ? "object-right" : "object-left")}
        />
      </span>
    );
  }

  return (
    <span className={clsx("font-display block leading-[0.86] uppercase", align === "right" && "text-right", className)}>
      {restaurant.name}
    </span>
  );
}
