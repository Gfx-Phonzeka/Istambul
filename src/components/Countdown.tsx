"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/client";

export function Countdown({ target }: { target: string }) {
  const { t } = useI18n();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = now === null ? null : Math.max(0, new Date(target).getTime() - now);
  if (diff === 0) return <p className="countdown-value">{t("dashboard.started")}</p>;
  const parts = diff === null
    ? ["–", "–", "–", "–"]
    : [Math.floor(diff / 86400000), Math.floor(diff / 3600000) % 24, Math.floor(diff / 60000) % 60, Math.floor(diff / 1000) % 60].map(String);
  const labels = ["dashboard.days", "dashboard.hours", "dashboard.minutes", "dashboard.seconds"];
  return (
    <div className="countdown" role="timer" aria-live="off">
      {parts.map((v, i) => (
        <div key={labels[i]} className="countdown-cell">
          <div className="countdown-value">{i === 0 ? v : v.padStart(2, "0")}</div>
          <div className="countdown-label">{t(labels[i])}</div>
        </div>
      ))}
    </div>
  );
}
