import type { Locale } from "@/lib/i18n";

import { EVENT } from "@/lib/event";
import { intlLocale } from "@/lib/i18n";

/** Local time zone of the Games (name kept for older imports). */
export const ISTANBUL_TZ = EVENT.tz;
export const EVENT_TZ = EVENT.tz;

export function formatDateTime(value: string | null | undefined, locale: Locale, tz = ISTANBUL_TZ): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(intlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: tz,
  }).format(new Date(value));
}

export function formatDate(value: string | null | undefined, locale: Locale, tz = ISTANBUL_TZ): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium", timeZone: tz }).format(
    new Date(value),
  );
}
