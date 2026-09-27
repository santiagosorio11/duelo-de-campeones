"use client";

import { BowlFoodIcon, HamburgerIcon } from "@phosphor-icons/react";
import Image from "next/image";
import type { Dish, DishCategory } from "@/lib/passport";

export function CategoryIcon({ category, ...props }: { category: DishCategory } & Parameters<typeof HamburgerIcon>[0]) {
  const Icon = category === "hamburguesa" ? HamburgerIcon : BowlFoodIcon;
  return <Icon {...props} />;
}

/**
 * Fondo de la tarjeta de un plato. Usa la foto real (dishes.image_path) cuando
 * exista; mientras tanto, una superficie grafito con el ícono del plato.
 */
export function DishArt({ dish, priority = false }: { dish: Dish; priority?: boolean }) {
  if (dish.imagePath) {
    return (
      <Image src={dish.imagePath} alt="" fill priority={priority} sizes="(max-width: 520px) 100vw, 480px" className="object-cover" />
    );
  }

  return (
    <div aria-hidden className="dish-surface absolute inset-0">
      <CategoryIcon
        category={dish.category}
        weight="thin"
        className="absolute -right-8 -bottom-10 size-[210px] -rotate-12 text-gold-300/[0.13]"
      />
    </div>
  );
}
