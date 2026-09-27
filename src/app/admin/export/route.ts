import { getExportRows } from "@/lib/admin";
import { getCatalog } from "@/lib/catalog";
import { buildPassport } from "@/lib/passport";
import { isAdmin } from "@/lib/session";
import { formatBogota } from "@/lib/time";

// Excel en español (Colombia) espera ";" como separador de columnas.
const SEPARATOR = ";";

function cell(value: string | number): string {
  const text = String(value);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  if (!(await isAdmin())) return new Response("No autorizado", { status: 401 });

  const [catalog, rows] = await Promise.all([getCatalog(), getExportRows()]);
  const dishes = catalog.flatMap((restaurant) =>
    restaurant.dishes.map((dish) => ({ slug: dish.slug, label: `${restaurant.name} - ${dish.name}` })),
  );

  const header = ["id", "nombre", "celular", ...dishes.map((d) => d.label), "platos", "en_sorteo", "dispositivos", "registro"];
  const lines = rows.map((row) => {
    const passport = buildPassport(
      catalog,
      Object.entries(row.stars).map(([dishSlug, stars]) => ({ dishSlug, stars })),
    );
    return [
      row.id,
      row.fullName,
      row.phone,
      ...dishes.map((d) => row.stars[d.slug] ?? ""),
      passport.ratedCount,
      passport.eligible ? "si" : "no",
      row.devices,
      formatBogota(row.createdAt),
    ]
      .map(cell)
      .join(SEPARATOR);
  });

  const csv = `﻿${[header.map(cell).join(SEPARATOR), ...lines].join("\r\n")}`;
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="duelo-participantes-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
