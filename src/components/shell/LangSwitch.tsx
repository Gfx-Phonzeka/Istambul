"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/lib/actions/locale";
import { useI18n } from "@/lib/i18n/client";
import { LOCALES, type Locale } from "@/lib/i18n";

export function LangSwitch() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  // Optimistic choice while the new locale is saved; falls back to the server locale.
  const [chosen, setChosen] = useState<Locale | null>(null);
  const current = pending && chosen ? chosen : locale;
  const choose = (l: Locale) => {
    if (l === current) return;
    setChosen(l);
    start(async () => {
      await setLocale(l);
      router.refresh();
    });
  };
  return (
    <div className="lang-switch" role="group" aria-label={t("common.language")} style={{ opacity: pending ? 0.6 : 1 }}>
      {LOCALES.map((l) => (
        <button key={l} type="button" aria-pressed={current === l} onClick={() => choose(l)} lang={l}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
