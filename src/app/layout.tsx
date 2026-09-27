import type { Metadata, Viewport } from "next";
import { Anton, Geist } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: "Duelo de Campeones | Machete Burger vs Coliseo",
  description:
    "Califica la hamburguesa y el chuzo desgranado de Machete Burger y Coliseo. Prueba un plato en cada uno y participa por 1 mes de hamburguesas gratis.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#07070a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO" className={`${geist.variable} ${anton.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
