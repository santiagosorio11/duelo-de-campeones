"use client";

import { BowlFoodIcon, HamburgerIcon } from "@phosphor-icons/react";
import Image from "next/image";
import type { Dish, DishCategory } from "@/lib/passport";

export function CategoryIcon({ category, ...props }: { category: DishCategory } & Parameters<typeof HamburgerIcon>[0]) {
  const Icon = category === "hamburguesa" ? HamburgerIcon : BowlFoodIcon;
  return <Icon {...props} />;
}

/**
 * Fondo de la tarjeta de un plato. Con foto real (dishes.image_path) la usa;
 * mientras tanto muestra la superficie del restaurante con el ícono del plato.
 */
export function DishArt({ dish, priority = false }: { dish: Dish; priority?: boolean }) {
  if (dish.imagePath) {
    return (
      <Image
        src={dish.imagePath}
        alt=""
        fill
        priority={priority}
        sizes="(max-width: 520px) 100vw, 480px"
        className="object-cover"
      />
    );
  }

  return (
    <div aria-hidden className="team-surface absolute inset-0">
      <CategoryIcon
        category={dish.category}
        weight="thin"
        className="absolute -right-8 -bottom-10 size-[200px] -rotate-12 text-bone/[0.13]"
      />
    </div>
  );
}
