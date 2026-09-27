import { describe, expect, it } from "vitest";
import { buildPassport, prizeCopy, raffleMessage, type Restaurant } from "./passport";

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
    expect(passport).toMatchObject({ ratedCount: 0, totalDishes: 4, restaurantsCovered: 0, totalRestaurants: 2, eligible: false });
    expect(passport.missingRestaurants).toEqual(["machete-burger", "coliseo"]);
  });

  it("dos platos del mismo restaurante no bastan para el sorteo", () => {
    const passport = buildPassport(catalog, [
      { dishSlug: "machete-burger-hamburguesa", stars: 5 },
      { dishSlug: "machete-burger-chuzo-desgranado", stars: 4 },
    ]);
    expect(passport).toMatchObject({ ratedCount: 2, restaurantsCovered: 1, eligible: false, missingRestaurants: ["coliseo"] });
  });

  it("un plato en cada restaurante basta para participar", () => {
    const passport = buildPassport(catalog, [
      { dishSlug: "machete-burger-hamburguesa", stars: 5 },
      { dishSlug: "coliseo-chuzo-desgranado", stars: 3 },
    ]);
    expect(passport).toMatchObject({ ratedCount: 2, restaurantsCovered: 2, eligible: true, missingRestaurants: [] });
    expect(passport.stamps).toEqual({ "machete-burger-hamburguesa": 5, "coliseo-chuzo-desgranado": 3 });
  });

  it("ignora platos que ya no están en el catálogo", () => {
    const passport = buildPassport(catalog, [
      { dishSlug: "machete-burger-hamburguesa", stars: 5 },
      { dishSlug: "plato-retirado", stars: 1 },
    ]);
    expect(passport).toMatchObject({ ratedCount: 1, restaurantsCovered: 1, eligible: false });
  });
});

describe("raffleMessage", () => {
  it("explica la regla si aún no hay sellos", () => {
    expect(raffleMessage(null, catalog)).toBe("Califica al menos un plato en cada restaurante y entras al sorteo.");
  });

  it("dice qué restaurante falta", () => {
    const passport = buildPassport(catalog, [{ dishSlug: "coliseo-hamburguesa", stars: 4 }]);
    expect(raffleMessage(passport, catalog)).toBe("Te falta calificar un plato de Machete Burger para entrar al sorteo.");
  });

  it("confirma la participación sin contar oportunidades", () => {
    const passport = buildPassport(
      catalog,
      catalog.flatMap((r) => r.dishes.map((d) => ({ dishSlug: d.slug, stars: 5 }))),
    );
    expect(raffleMessage(passport, catalog)).toBe(
      "¡Ya estás en el sorteo! Si ganas, te contactamos al celular que registraste.",
    );
  });
});

describe("prizeCopy", () => {
  it("describe 4 ganadores por restaurante", () => {
    expect(prizeCopy(catalog, 4)).toEqual({
      title: "1 mes de hamburguesas gratis",
      winners: "8 ganadores: 4 en Machete Burger y 4 en Coliseo.",
      detail: "Cada ganador recibe 1 hamburguesa o 1 chuzo al día. No es acumulable ni transferible.",
    });
  });
});
