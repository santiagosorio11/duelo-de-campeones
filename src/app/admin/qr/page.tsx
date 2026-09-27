import { ArrowLeftIcon, PrinterIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { Wordmark } from "@/components/brand/Wordmark";
import { getCatalog } from "@/lib/catalog";
import { isAdmin } from "@/lib/session";
import { siteUrl } from "@/lib/site";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = { title: "QR de mesas | Duelo de Campeones" };

/** Base de los QR: la URL configurada o de Vercel; en local, el host de la petición. */
async function qrBaseUrl(): Promise<string> {
  const configured = siteUrl();
  if (configured.hostname !== "localhost") return configured.origin;
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  return `http://${host}`;
}

export default async function QrPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const [catalog, base] = await Promise.all([getCatalog(), qrBaseUrl()]);
  const isLocal = /localhost|127\.0\.0\.1/.test(base);

  const items = await Promise.all(
    catalog.map(async (restaurant) => {
      const url = `${base}/?r=${restaurant.slug}`;
      const svg = await QRCode.toString(url, {
        type: "svg",
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#07070a", light: "#ffffff" },
      });
      return { restaurant, url, svg };
    }),
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 print:max-w-none print:p-0">
      <header className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-mist hover:text-bone">
          <ArrowLeftIcon size={18} aria-hidden /> Volver al panel
        </Link>
        <PrintButton>
          <PrinterIcon size={18} aria-hidden /> Imprimir
        </PrintButton>
      </header>

      {isLocal ? (
        <p className="mt-6 rounded-[14px] bg-danger/10 p-4 text-sm text-danger print:hidden">
          Estos QR apuntan a {base}. Configura NEXT_PUBLIC_SITE_URL con el dominio final antes de imprimir.
        </p>
      ) : null}

      <p className="mt-6 max-w-[65ch] text-sm text-mist print:hidden">
        Cada restaurante tiene su propio QR: así la app abre con ese restaurante seleccionado y sabemos desde dónde
        entró cada calificación.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 print:mt-0 print:gap-0">
        {items.map(({ restaurant, url, svg }) => (
          <article
            key={restaurant.slug}
            className="flex flex-col items-center gap-5 rounded-[24px] bg-[#fbfaf7] p-8 text-center text-ink-950 print:min-h-[50vh] print:break-inside-avoid print:rounded-none"
          >
            <div className="rounded-[20px] bg-ink-950 px-6 py-4 text-[28px]">
              <Wordmark />
            </div>
            <div
              className="w-full max-w-[260px] [&>svg]:h-auto [&>svg]:w-full"
              // SVG generado por la librería qrcode a partir de nuestra propia URL.
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            <div>
              <p className="font-display text-3xl leading-none uppercase">{restaurant.name}</p>
              <p className="mt-2 text-sm">Escanea, califica los platos y participa por 1 mes de hamburguesas gratis.</p>
            </div>
            <a
              href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
              download={`qr-${restaurant.slug}.svg`}
              className="text-xs text-ink-700 underline underline-offset-4 print:hidden"
            >
              Descargar SVG ({url})
            </a>
          </article>
        ))}
      </div>
    </main>
  );
}
