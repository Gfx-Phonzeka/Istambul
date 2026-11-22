"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { dictionaries, translate, type Locale, type TFunction } from "./index";

const I18nContext = createContext<{ locale: Locale; t: TFunction }>({
  locale: "en",
  t: (k) => k,
});

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo(() => {
    const dict = dictionaries[locale];
    return { locale, t: ((key, vars) => translate(dict, key, vars)) as TFunction };
  }, [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
