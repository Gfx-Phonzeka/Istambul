"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setGuideLang } from "@/lib/actions/guide";
import { GUIDE_LANGS, type GuideLang } from "@/lib/guide";

/** Reading-language selector of the Production Guidelines (independent of the portal language). */
export function GuideLangSwitch({ lang, label }: { lang: GuideLang; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="lang-switch" role="group" aria-label={label} aria-busy={pending || undefined}>
      {GUIDE_LANGS.map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} disabled={pending}
          onClick={() => start(async () => { await setGuideLang(l); router.refresh(); })}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
