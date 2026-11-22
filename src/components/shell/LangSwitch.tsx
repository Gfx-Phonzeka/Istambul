"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/lib/actions/locale";
import { useI18n } from "@/lib/i18n/client";

export function LangSwitch() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [current, setCurrent] = useState(locale);
  useEffect(() => setCurrent(locale), [locale]);
  const choose = (l: "en" | "tr") => {
    if (l === current) return;
    setCurrent(l);
    start(async () => {
      await setLocale(l);
      router.refresh();
    });
  };
  return (
    <div className="lang-switch" role="group" aria-label={t("common.language")} style={{ opacity: pending ? 0.6 : 1 }}>
      {(["en", "tr"] as const).map((l) => (
        <button key={l} type="button" aria-pressed={current === l} onClick={() => choose(l)} lang={l}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
