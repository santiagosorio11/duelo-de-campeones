import { describe, expect, it } from "vitest";
import { buildPassport, raffleMessage, type Restaurant } from "./passport";

const catalog: Restaurant[] = [
  {
    id: 1,
    slug: "machete-burger",
    name: "Machete Burger",
    tagline: null,
    accentColor: "#E5484D",
    logoPath: null,
    dishes: [
      { id: 1, slug: "machete-burger-hamburguesa", name: "Hamburguesa", category: "hamburguesa", description: null, imagePath: null },
      { id: 2, slug: "machete-burger-chuzo-desgranado", name: "Chuzo desgranado", category: "chuzo_desgranado", description: null, imagePath: null },
    ],
  },
  {
    id: 2,
    slug: "coliseo",
    name: "Coliseo",
    tagline: null,
    accentColor: "#3E63DD",
    logoPath: null,
    dishes: [
      { id: 3, slug: "coliseo-hamburguesa", name: "Hamburguesa", category: "hamburguesa", description: null, imagePath: null },
      { id: 4, slug: "coliseo-chuzo-desgranado", name: "Chuzo desgranado", category: "chuzo_desgranado", description: null, imagePath: null },
    ],
  },
];

describe("buildPassport", () => {
  it("sin calificaciones no participa", () => {
    const passport = buildPassport(catalog, []);
    expect(passport).toMatchObject({ ratedCount: 0, totalDishes: 4, eligible: false, tickets: 0 });
    expect(passport.missingRestaurants).toEqual(["machete-burger", "coliseo"]);
  });

  it("dos platos del mismo restaurante no bastan para el sorteo", () => {
    const passport = buildPassport(catalog, [
      { dishSlug: "machete-burger-hamburguesa", stars: 5 },
      { dishSlug: "machete-burger-chuzo-desgranado", stars: 4 },
    ]);
    expect(passport).toMatchObject({ ratedCount: 2, eligible: false, tickets: 0, missingRestaurants: ["coliseo"] });
  });

  it("un plato de cada restaurante participa con 2 oportunidades", () => {
    const passport = buildPassport(catalog, [
      { dishSlug: "machete-burger-hamburguesa", stars: 5 },
      { dishSlug: "coliseo-chuzo-desgranado", stars: 3 },
    ]);
    expect(passport).toMatchObject({ ratedCount: 2, eligible: true, tickets: 2, missingRestaurants: [] });
    expect(passport.stamps).toEqual({ "machete-burger-hamburguesa": 5, "coliseo-chuzo-desgranado": 3 });
  });

  it("los 4 platos dan 4 oportunidades e ignora platos desconocidos", () => {
    const passport = buildPassport(catalog, [
      { dishSlug: "machete-burger-hamburguesa", stars: 5 },
      { dishSlug: "machete-burger-chuzo-desgranado", stars: 4 },
      { dishSlug: "coliseo-hamburguesa", stars: 2 },
      { dishSlug: "coliseo-chuzo-desgranado", stars: 3 },
      { dishSlug: "plato-retirado", stars: 1 },
    ]);
    expect(passport).toMatchObject({ ratedCount: 4, eligible: true, tickets: 4 });
  });
});

describe("raffleMessage", () => {
  it("explica la regla si aún no hay sellos", () => {
    expect(raffleMessage(null, catalog)).toMatch(/al menos un plato de cada restaurante/);
  });

  it("dice qué restaurante falta", () => {
    const passport = buildPassport(catalog, [{ dishSlug: "coliseo-hamburguesa", stars: 4 }]);
    expect(raffleMessage(passport, catalog)).toBe("Te falta calificar un plato de Machete Burger para entrar al sorteo.");
  });

  it("cuenta oportunidades y platos restantes", () => {
    const passport = buildPassport(catalog, [
      { dishSlug: "coliseo-hamburguesa", stars: 4 },
      { dishSlug: "machete-burger-hamburguesa", stars: 5 },
      { dishSlug: "machete-burger-chuzo-desgranado", stars: 5 },
    ]);
    expect(raffleMessage(passport, catalog)).toBe("Ya participas con 3 oportunidades. Califica 1 plato más para sumar.");
  });

  it("felicita el pasaporte completo", () => {
    const passport = buildPassport(
      catalog,
      catalog.flatMap((r) => r.dishes.map((d) => ({ dishSlug: d.slug, stars: 5 }))),
    );
    expect(raffleMessage(passport, catalog)).toBe("Pasaporte completo: participas con 4 oportunidades.");
  });
});
