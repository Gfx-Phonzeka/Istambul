import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { I18nProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";
import { EVENT } from "@/lib/event";

export const metadata: Metadata = {
  title: { default: `${EVENT.name} · HB Portal`, template: `%s · ${EVENT.name} HB Portal` },
  description: EVENT.id === "lima"
    ? "Host Broadcaster portal for Right Holders, partners and the production team of the Lima 2027 Pan American and Parapan American Games."
    : "Host Broadcaster portal for Right Holders, partners and the production team of the 4th European Games Istanbul 2027.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#eceef1", colorScheme: "light" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} data-event={EVENT.id}>
      <head>
        <link rel="preload" href="/fonts/instrument-sans-latin-wdth-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />}
      </head>
      <body>
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
