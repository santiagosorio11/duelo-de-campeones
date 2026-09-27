import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Política de contenido: solo recursos del propio sitio. Next.js necesita
 * scripts y estilos inline (hidratación, GSAP); no se permite eval en producción,
 * ni incrustar la app en otros sitios, ni enviar formularios a otros dominios.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  // En desarrollo Turbopack necesita eval y websockets: la CSP y HSTS solo aplican en producción.
  ...(isProduction
    ? [
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      ]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Importa solo los iconos usados desde el barrel de Phosphor.
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // El panel y sus exportaciones nunca se guardan en cachés intermedias.
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
