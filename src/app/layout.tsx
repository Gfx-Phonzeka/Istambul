import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { I18nProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: { default: "Istanbul 2027 · Right Holders Portal", template: "%s · Istanbul 2027 RHB Portal" },
  description: "Private portal for Right Holders and partners of the 4th European Games Istanbul 2027.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#eceef1", colorScheme: "light" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
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
