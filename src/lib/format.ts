import type { Locale } from "@/lib/i18n";

export const ISTANBUL_TZ = "Europe/Istanbul";

export function formatDateTime(value: string | null | undefined, locale: Locale, tz = ISTANBUL_TZ): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: tz,
  }).format(new Date(value));
}

export function formatDate(value: string | null | undefined, locale: Locale, tz = ISTANBUL_TZ): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", { dateStyle: "medium", timeZone: tz }).format(
    new Date(value),
  );
}
