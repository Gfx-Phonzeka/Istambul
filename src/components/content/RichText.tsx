"use client";
import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n/client";

/** Renders stored (sanitised) rich text; heading "#" links copy a shareable address. */
export function RichText({ html, className = "" }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a.anchor") as HTMLAnchorElement | null;
      if (!a) return;
      e.preventDefault();
      const url = new URL(a.getAttribute("href")!, window.location.href).toString();
      history.replaceState(null, "", url);
      navigator.clipboard?.writeText(url).then(() => {
        a.dataset.copied = t("handbook.copied");
        setTimeout(() => delete a.dataset.copied, 1500);
      });
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [t]);
  return <div ref={ref} className={`prose ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
