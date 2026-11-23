import en, { type Messages } from "./en";
import tr from "./tr";
import es from "./es";
import pt from "./pt";
import { EVENT_MESSAGES } from "./event-messages";
import { EVENT, type Locale } from "@/lib/event";

export type { Locale };
/** Languages of this event's portal (Istanbul: EN/TR · Lima: ES/EN/PT). The first one is the default. */
export const LOCALES: Locale[] = EVENT.locales;
export const DEFAULT_LOCALE: Locale = EVENT.locales[0];
export const LOCALE_COOKIE = "lang";

type Tree = { [k: string]: string | Tree };
type DeepPartial<T> = { [K in keyof T]?: T[K] extends string ? string : DeepPartial<T[K]> };
export type PartialMessages = DeepPartial<Messages>;

function merge(base: Tree, over: Tree | undefined): Tree {
  if (!over) return base;
  const out: Tree = { ...base };
  for (const [k, v] of Object.entries(over)) {
    out[k] = typeof v === "object" && typeof base[k] === "object" ? merge(base[k] as Tree, v as Tree) : v;
  }
  return out;
}

const BASE: Record<Locale, PartialMessages> = { en, tr, es, pt };

// Missing keys fall back to English; event-specific wording (names, dates, places) is laid on top.
export const dictionaries = Object.fromEntries(
  (["en", "tr", "es", "pt"] as Locale[]).map((l) => [
    l,
    merge(merge(merge(en as unknown as Tree, EVENT_MESSAGES.en as Tree), BASE[l] as Tree), EVENT_MESSAGES[l] as Tree),
  ]),
) as unknown as Record<Locale, Messages>;

export function normalizeLocale(v: string | undefined | null): Locale {
  return LOCALES.includes(v as Locale) ? (v as Locale) : DEFAULT_LOCALE;
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


/**
 * Multilingual content: reads <field>_<locale> from a row, falling back to the event's default
 * language and then to any other language of the event.
 */
export function tx(row: unknown, field: string, locale: Locale): string {
  if (!row || typeof row !== "object") return "";
  const r = row as Record<string, unknown>;
  const get = (l: Locale) => {
    const v = r[`${field}_${l}`];
    return typeof v === "string" && v.trim() !== "" ? v : "";
  };
  return get(locale) || get(DEFAULT_LOCALE) || LOCALES.map(get).find(Boolean) || "";
}

/** Column list for multilingual fields in this event: cols("title", "body") → "title_en,title_tr,body_en,body_tr". */
export function cols(...fields: string[]): string {
  return fields.flatMap((f) => LOCALES.map((l) => `${f}_${l}`)).join(",");
}

/** Intl locale tag for dates and numbers. */
export function intlLocale(locale: Locale): string {
  return { en: "en-GB", tr: "tr-TR", es: "es-PE", pt: "pt-PT" }[locale];
}

export type TFunction = (key: string, vars?: Record<string, string | number>) => string;
export type { Messages };
