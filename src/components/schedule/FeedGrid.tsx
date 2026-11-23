"use client";
import { intlLocale } from "@/lib/i18n";
import { EVENT } from "@/lib/event";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { Badge, EmptyState } from "@/components/ui";
import { useUrlState } from "@/lib/hooks/useUrlState";

export interface FeedRow {
  id: string; code: string; type: string; title: string; venue: string; venueSlug: string | null; sport: string;
  start: string; end: string; channel: string; notes: string; draft: boolean;
}

const TRT = EVENT.tz;
const TONE: Record<string, "primary" | "info" | "success" | "warning" | "neutral"> = { multilateral: "primary", iso: "info", highlights: "success", ceremony: "warning", other: "neutral" };

export function FeedGrid({ feeds }: { feeds: FeedRow[] }) {
  const { t, locale } = useI18n();
  const loc = intlLocale(locale);
  const dayKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: TRT, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
  const dayLabel = (k: string) => new Intl.DateTimeFormat(loc, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${k}T12:00:00Z`));
  const time = (iso: string) => new Intl.DateTimeFormat(loc, { hour: "2-digit", minute: "2-digit", timeZone: TRT }).format(new Date(iso));
  const days = useMemo(() => [...new Set(feeds.map((f) => dayKey(f.start)))].sort(), [feeds]); // eslint-disable-line react-hooks/exhaustive-deps
  const channels = useMemo(() => [...new Set(feeds.map((f) => f.channel))].sort(), [feeds]);
  const [day, setDay] = useUrlState("fday", days[0] ?? "all");
  const [type, setType] = useUrlState("ftype", "all");
  const [channel, setChannel] = useUrlState("channel", "all");
  const shown = feeds.filter((f) => (day === "all" || dayKey(f.start) === day) && (type === "all" || f.type === type) && (channel === "all" || f.channel === channel));
  const byDay = new Map<string, FeedRow[]>();
  shown.forEach((f) => { const k = dayKey(f.start); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k)!.push(f); });
  return (
    <div className="stack">
      <div className="chips">
        <button type="button" className={`chip${day === "all" ? " is-active" : ""}`} onClick={() => setDay("all")}>{t("schedule.allDays")}</button>
        {days.map((d) => <button key={d} type="button" className={`chip${day === d ? " is-active" : ""}`} onClick={() => setDay(d)}>{dayLabel(d)}</button>)}
      </div>
      <div className="row">
        <select className="select" style={{ width: "auto" }} value={type} onChange={(e) => setType(e.target.value)} aria-label={t("cms.fields.feedType")}>
          <option value="all">{t("broadcast.allTypes")}</option>
          {["multilateral", "iso", "highlights", "ceremony", "other"].map((x) => <option key={x} value={x}>{t(`broadcast.feedTypes.${x}`)}</option>)}
        </select>
        <select className="select" style={{ width: "auto" }} value={channel} onChange={(e) => setChannel(e.target.value)} aria-label={t("cms.fields.channel")}>
          <option value="all">{t("broadcast.allChannels")}</option>
          {channels.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="muted small" style={{ marginLeft: "auto" }}>{t("schedule.trtNote")}</span>
      </div>
      {shown.length === 0 ? <div className="card"><EmptyState icon="broadcast" action={{ label: t("common.clearFilters"), onClick: () => { setDay("all"); setType("all"); setChannel("all"); } }}>{t("broadcast.noFeeds")}</EmptyState></div> : (
        [...byDay.entries()].map(([k, list]) => (
          <section key={k} className="stack-sm">
            <h2>{dayLabel(k)}</h2>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>{t("broadcast.cols.time")}</th><th>{t("broadcast.cols.feed")}</th><th>{t("broadcast.cols.type")}</th><th>{t("broadcast.cols.venue")}</th><th>{t("broadcast.cols.channel")}</th></tr></thead>
                <tbody>
                  {list.map((f) => (
                    <tr key={f.id}>
                      <td style={{ whiteSpace: "nowrap" }}><strong>{time(f.start)}</strong>–{time(f.end)}</td>
                      <td><strong>{f.title}</strong>{f.notes && <div className="small muted">{f.notes}</div>}<div className="small muted">{f.code}</div></td>
                      <td><Badge tone={TONE[f.type]}>{t(`broadcast.feedTypes.${f.type}`)}</Badge> {f.draft && <Badge tone="warning">{t("cms.status.draft")}</Badge>}</td>
                      <td className="small">{f.venueSlug ? <a href={`/venues/${f.venueSlug}`}>{f.venue}</a> : "—"}</td>
                      <td><code className="small">{f.channel}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
