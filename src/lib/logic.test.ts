import { describe, expect, it } from "vitest";
import { pickWeighted, totalTickets } from "./raffle";
import { leader, overallStandings, standingsForCategory, type DishResult } from "./results";
import { bogotaLocalToIso, isoToBogotaLocal } from "./time";
import { nameSchema, ratingInputSchema } from "./validation";

describe("pickWeighted", () => {
  const pool = [
    { id: "a", tickets: 2 },
    { id: "b", tickets: 4 },
    { id: "c", tickets: 3 },
  ];

  it("recorre los tickets en orden acumulado", () => {
    expect(totalTickets(pool)).toBe(9);
    expect(pickWeighted(pool, () => 0)?.id).toBe("a");
    expect(pickWeighted(pool, () => 1)?.id).toBe("a");
    expect(pickWeighted(pool, () => 2)?.id).toBe("b");
    expect(pickWeighted(pool, () => 5)?.id).toBe("b");
    expect(pickWeighted(pool, () => 6)?.id).toBe("c");
    expect(pickWeighted(pool, () => 8)?.id).toBe("c");
  });

  it("devuelve null sin tickets", () => {
    expect(pickWeighted([], () => 0)).toBeNull();
    expect(pickWeighted([{ tickets: 0 }], () => 0)).toBeNull();
  });

  it("reparte según el peso", () => {
    const counts = { a: 0, b: 0, c: 0 };
    for (let ticket = 0; ticket < 9; ticket++) {
      const winner = pickWeighted(pool, () => ticket);
      if (winner) counts[winner.id as keyof typeof counts]++;
    }
    expect(counts).toEqual({ a: 2, b: 4, c: 3 });
  });
});

describe("results", () => {
  const row = (restaurantSlug: string, category: DishResult["category"], votes: number, avgStars: number | null): DishResult => ({
    dishSlug: `${restaurantSlug}-${category}`,
    dishName: category,
    category,
    restaurantSlug,
    restaurantName: restaurantSlug,
    votes,
    avgStars,
    distribution: [0, 0, 0, 0, 0],
  });

  const results = [
    row("machete", "hamburguesa", 10, 4.5),
    row("machete", "chuzo_desgranado", 30, 3.5),
    row("coliseo", "hamburguesa", 20, 4.0),
    row("coliseo", "chuzo_desgranado", 20, 4.2),
  ];

  it("gana la categoría el mejor promedio", () => {
    expect(leader(standingsForCategory(results, "hamburguesa"))?.restaurantSlug).toBe("machete");
    expect(leader(standingsForCategory(results, "chuzo_desgranado"))?.restaurantSlug).toBe("coliseo");
  });

  it("el general pondera por número de votos", () => {
    const overall = overallStandings(results);
    expect(overall[0]).toMatchObject({ restaurantSlug: "coliseo", votes: 40, avgStars: 4.1 });
    expect(overall[1]).toMatchObject({ restaurantSlug: "machete", votes: 40, avgStars: 3.75 });
  });

  it("sin votos no hay líder", () => {
    expect(leader(standingsForCategory([row("a", "hamburguesa", 0, null), row("b", "hamburguesa", 0, null)], "hamburguesa"))).toBeNull();
  });
});

describe("time", () => {
  it("convierte hora de Bogotá (UTC-5) a ISO y de vuelta", () => {
    expect(bogotaLocalToIso("2026-10-01T18:30")).toBe("2026-10-01T23:30:00.000Z");
    expect(isoToBogotaLocal("2026-10-01T23:30:00.000Z")).toBe("2026-10-01T18:30");
    expect(bogotaLocalToIso("mañana")).toBeNull();
    expect(isoToBogotaLocal(null)).toBe("");
  });
});

describe("validation", () => {
  it("normaliza nombres y rechaza caracteres raros", () => {
    expect(nameSchema.parse("  María   José  Peña ")).toBe("María José Peña");
    expect(nameSchema.safeParse("ab").success).toBe(false);
    expect(nameSchema.safeParse("<script>").success).toBe(false);
    expect(nameSchema.safeParse("123 Pérez").success).toBe(false);
  });

  it("valida la calificación", () => {
    expect(
      ratingInputSchema.safeParse({ dishSlug: "coliseo-hamburguesa", stars: 5, identity: { mode: "remembered" } }).success,
    ).toBe(true);
    expect(
      ratingInputSchema.safeParse({ dishSlug: "coliseo-hamburguesa", stars: 6, identity: { mode: "remembered" } }).success,
    ).toBe(false);
    expect(
      ratingInputSchema.safeParse({ dishSlug: "../hack", stars: 3, identity: { mode: "remembered" } }).success,
    ).toBe(false);
  });
});
