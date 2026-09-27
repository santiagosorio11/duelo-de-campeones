/**
 * URL pública del sitio. Usa NEXT_PUBLIC_SITE_URL si es una URL válida; si no
 * (vacía o mal escrita), el dominio de producción de Vercel, el de la
 * implementación actual o localhost. Nunca lanza error.
 */
export function siteUrl(env: Record<string, string | undefined> = process.env): URL {
  const candidates = [
    env.NEXT_PUBLIC_SITE_URL,
    env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`,
    env.VERCEL_URL && `https://${env.VERCEL_URL}`,
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (!value) continue;
    try {
      const url = new URL(value);
      if (url.protocol === "https:" || url.protocol === "http:") return url;
    } catch {
      // Valor inválido: se prueba el siguiente.
    }
  }

  return new URL("http://localhost:3000");
}
