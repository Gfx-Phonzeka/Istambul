"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { tx } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";

export interface Ceremony { at: string; label_en: string; label_tr?: string }

const LABELS = ["dashboard.days", "dashboard.hours", "dashboard.minutes", "dashboard.seconds"];

/**
 * On-air countdown on the dashboard. Counts down to the first ceremony that has not started yet
 * (opening, then closing) and switches to the next one by itself when the time is reached.
 */
export function CeremonyCountdown({ ceremonies }: { ceremonies: Ceremony[] }) {
  const { t, locale } = useI18n();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const list = [...ceremonies].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  if (list.length === 0) return null;
  // Before hydration, show the first ceremony that is still in the future on the server clock.
  const ref = now ?? Date.now();
  const next = list.find((c) => new Date(c.at).getTime() > ref);
  const shown = next ?? list[list.length - 1];
  const label = tx(shown, "label", locale);
  const diff = now === null ? null : Math.max(0, new Date(shown.at).getTime() - now);
  // After the last ceremony: "ended" when there was more than one, "started" when only the opening is set.
  const over = next === undefined && now !== null;
  const parts = diff === null
    ? ["–", "–", "–", "–"]
    : [Math.floor(diff / 86400000), Math.floor(diff / 3600000) % 24, Math.floor(diff / 60000) % 60, Math.floor(diff / 1000) % 60].map(String);

  return (
    <section className="onair" aria-label={t("dashboard.countdownTo")}>
      <div>
        <h2 className="onair-title">{over ? label : `${t("dashboard.countdownTo")} ${label}`}</h2>
        <p className="onair-meta">{formatDateTime(shown.at, locale)} (TRT, UTC+3)</p>
      </div>
      {over ? (
        <p className="countdown-value onair-done">{t(list.length > 1 ? "dashboard.finished" : "dashboard.started")}</p>
      ) : (
        <div className="countdown" role="timer" aria-live="off">
          {parts.map((v, i) => (
            <div key={LABELS[i]} className="countdown-cell">
              <div className="countdown-value">{i === 0 ? v : v.padStart(2, "0")}</div>
              <div className="countdown-label">{t(LABELS[i])}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
