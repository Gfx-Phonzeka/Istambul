import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { I18nProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: { default: "Istanbul 2027 · Right Holders Portal", template: "%s · Istanbul 2027 RHB Portal" },
  description: "Private portal for Right Holders and partners of the 4th European Games Istanbul 2027.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
