import { z } from "zod";

/** Versión del texto de autorización de datos que acepta cada participante. */
export const CONSENT_VERSION = "2026-09";

const slug = z
  .string()
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);

/** Nombre completo: letras (con tildes), espacios, apóstrofes, puntos y guiones. */
export const nameSchema = z
  .string()
  .transform((value) => value.replace(/\s+/g, " ").trim())
  .pipe(
    z
      .string()
      .min(3)
      .max(80)
      .regex(/^\p{L}[\p{L}\p{M}\s'.-]*$/u),
  );

export const ratingInputSchema = z.object({
  dishSlug: slug,
  stars: z.number().int().min(1).max(5),
  entrySlug: slug.nullish(),
  identity: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("remembered") }),
    z.object({
      mode: z.literal("new"),
      fullName: z.string().max(120),
      phone: z.string().max(30),
      consent: z.boolean(),
    }),
  ]),
});

export type RatingInput = z.input<typeof ratingInputSchema>;
