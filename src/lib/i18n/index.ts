import en, { type Messages } from "./en";
import tr from "./tr";

export type Locale = "en" | "tr";
export const LOCALES: Locale[] = ["en", "tr"];
export const LOCALE_COOKIE = "lang";
export const dictionaries: Record<Locale, Messages> = { en, tr };

export function normalizeLocale(v: string | undefined | null): Locale {
  return v === "tr" ? "tr" : "en";
}

/** Looks up a dotted key ("auth.loginTitle") and fills {placeholders}. */
export function translate(dict: Messages, key: string, vars?: Record<string, string | number>): string {
  let value: unknown = dict;
  for (const part of key.split(".")) {
    value = value && typeof value === "object" ? (value as Record<string, unknown>)[part] : undefined;
  }
  let out = typeof value === "string" ? value : key;
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
  return out;
}

/** Picks the TR field of bilingual content, falling back to EN when empty. */
export function pick(locale: Locale, en: string | null | undefined, tr: string | null | undefined): string {
  if (locale === "tr" && tr && tr.trim() !== "") return tr;
  return en ?? "";
}

export type TFunction = (key: string, vars?: Record<string, string | number>) => string;
export type { Messages };
