import "server-only";
import { cookies } from "next/headers";
import { dictionaries, LOCALE_COOKIE, normalizeLocale, translate, type Locale, type TFunction } from "./index";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return normalizeLocale(store.get(LOCALE_COOKIE)?.value);
}

export async function getT(): Promise<{ t: TFunction; locale: Locale }> {
  const locale = await getLocale();
  const dict = dictionaries[locale];
  return { t: (key, vars) => translate(dict, key, vars), locale };
}
