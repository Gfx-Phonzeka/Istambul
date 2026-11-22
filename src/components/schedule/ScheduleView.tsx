"use client";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { Badge, EmptyState } from "@/components/ui";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useUrlState, useUrlFlag } from "@/lib/hooks/useUrlState";

export interface SessionRow {
  id: string; code: string; sportId: string; sport: string; venueId: string; venue: string; venueSlug: string;
  discipline: string; phase: string; start: string; end: string; isMedal: boolean; medalEvents: string; isOq: boolean;
  notes: string; draft: boolean;
}

const TRT = "Europe/Istanbul";

export function ScheduleView({ sessions, sports, venues, focus, favSports = [] }: {
  sessions: SessionRow[]; sports: { id: string; title: string }[]; venues: { id: string; title: string }[]; focus?: string | null; favSports?: string[];
}) {
  const { t, locale } = useI18n();
  const loc = locale === "tr" ? "tr-TR" : "en-GB";
  const [tzModeRaw, setTzMode] = useUrlState("tz", "trt");
  const tzMode = tzModeRaw === "local" ? "local" : "trt";
  const [localTz, setLocalTz] = useState<string | null>(null);
  useEffect(() => { setLocalTz(Intl.DateTimeFormat().resolvedOptions().timeZone); }, []);
  const tz = tzMode === "trt" || !localTz ? TRT : localTz;

  const [viewRaw, setView] = useUrlState("view", "list");
  const view = viewRaw === "timeline" ? "timeline" : "list";
  const [groupRaw, setGroup] = useUrlState("group", "day");
  const group = (["day", "sport", "venue"].includes(groupRaw) ? groupRaw : "day") as "day" | "sport" | "venue";
  const [sport, setSport] = useUrlState("sport", "all");
  const [venue, setVenue] = useUrlState("venue", "all");
  const [medal, setMedal] = useUrlFlag("medal");
  const [oq, setOq] = useUrlFlag("oq");
  const [q, setQ] = useUrlState("q", "");

  const dayKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
  const dayLabel = (key: string) => new Intl.DateTimeFormat(loc, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${key}T12:00:00Z`));
  const time = (iso: string) => new Intl.DateTimeFormat(loc, { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(new Date(iso));

  const days = useMemo(() => [...new Set(sessions.map((s) => dayKey(s.start)))].sort(), [sessions, tz]); // eslint-disable-line react-hooks/exhaustive-deps
  const [day, setDay] = useUrlState("day", "all");
  const [chosenTimelineDay, setTimelineDay] = useUrlState("tday", days[0] ?? "");
  const timelineDay = days.includes(chosenTimelineDay) ? chosenTimelineDay : (days[0] ?? "");

  const clearFilters = () => { setSport("all"); setVenue("all"); setMedal(false); setOq(false); setQ(""); setDay("all"); };
  const term = q.trim().toLocaleLowerCase();
  const filtered = sessions.filter((s) =>
    (sport === "all" || s.sportId === sport) && (venue === "all" || s.venueId === venue) && (!medal || s.isMedal) && (!oq || s.isOq) &&
    (day === "all" || dayKey(s.start) === day) &&
    (!term || `${s.code} ${s.sport} ${s.discipline} ${s.phase} ${s.venue} ${s.medalEvents}`.toLocaleLowerCase().includes(term)),
  );

  const groups = useMemo(() => {
    const m = new Map<string, { title: string; items: SessionRow[] }>();
    for (const s of filtered) {
      const key = group === "day" ? dayKey(s.start) : group === "sport" ? s.sportId : s.venueId;
      const title = group === "day" ? dayLabel(key) : group === "sport" ? s.sport : s.venue;
      if (!m.has(key)) m.set(key, { title, items: [] });
      m.get(key)!.items.push(s);
    }
    return [...m.entries()].sort((a, b) => (group === "day" ? a[0].localeCompare(b[0]) : a[1].title.localeCompare(b[1].title, locale)));
  }, [filtered, group, tz, locale]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (focus) document.getElementById(`s-${focus}`)?.scrollIntoView({ block: "center", behavior: "smooth" }); }, [focus]);

  const icsAll = `/api/schedule/ics?lang=${locale}`;
  const icsSport = sport !== "all" ? `/api/schedule/ics?lang=${locale}&sport=${sport}` : null;

  return (
    <div className="stack">
      <div className="schedule-toolbar">
        <div className="view-toggle" style={{ display: "inline-flex" }} role="tablist">
          <button type="button" className={view === "list" ? "is-active" : ""} onClick={() => setView("list")}>{t("schedule.list")}</button>
          <button type="button" className={view === "timeline" ? "is-active" : ""} onClick={() => setView("timeline")}>{t("schedule.timeline")}</button>
        </div>
        <div className="view-toggle" style={{ display: "inline-flex" }} role="group" aria-label={t("schedule.timezone")}>
          <button type="button" className={tzMode === "trt" ? "is-active" : ""} onClick={() => setTzMode("trt")}>{t("schedule.trt")}</button>
          <button type="button" className={tzMode === "local" ? "is-active" : ""} onClick={() => setTzMode("local")} disabled={!localTz}>
            {t("schedule.localTime")}{localTz && tzMode === "local" ? ` (${localTz})` : ""}
          </button>
        </div>
        <div className="row" style={{ marginLeft: "auto" }}>
          <a className="btn btn-sm" href={icsAll}>📅 {t("schedule.icsAll")}</a>
          {icsSport && <a className="btn btn-sm btn-primary" href={icsSport}>📅 {t("schedule.icsSport", { sport: sports.find((s) => s.id === sport)?.title ?? "" })}</a>}
        </div>
      </div>

      <div className="row">
        <input type="search" className="input" autoComplete="off" style={{ flex: 1, minWidth: 180 }} placeholder={t("schedule.searchPlaceholder")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("common.search")} />
        <select className="select" style={{ width: "auto" }} value={sport} onChange={(e) => setSport(e.target.value)} aria-label={t("venues.sport")}>
          <option value="all">{t("venues.allSports")}</option>
          {sports.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
        {sport !== "all" && <FavoriteButton key={sport} kind="sport" id={sport} initial={favSports.includes(sport)} label={sports.find((x) => x.id === sport)?.title} />}
        <select className="select" style={{ width: "auto" }} value={venue} onChange={(e) => setVenue(e.target.value)} aria-label={t("schedule.venue")}>
          <option value="all">{t("schedule.allVenues")}</option>
          {venues.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
        </select>
        <label className="checkbox"><input type="checkbox" checked={medal} onChange={(e) => setMedal(e.target.checked)} /> <span>{t("schedule.medalOnly")}</span></label>
        <label className="checkbox"><input type="checkbox" checked={oq} onChange={(e) => setOq(e.target.checked)} /> <span>{t("schedule.oqOnly")}</span></label>
      </div>

      {view === "list" ? (
        <>
          <div className="row">
            <div className="chips">
              <button type="button" className={`chip${day === "all" ? " is-active" : ""}`} onClick={() => setDay("all")}>{t("schedule.allDays")}</button>
              {days.map((d) => <button key={d} type="button" className={`chip${day === d ? " is-active" : ""}`} onClick={() => setDay(d)}>{dayLabel(d)}</button>)}
            </div>
            <select className="select" style={{ width: "auto", marginLeft: "auto" }} value={group} onChange={(e) => setGroup(e.target.value as typeof group)} aria-label={t("schedule.groupBy")}>
              <option value="day">{t("schedule.byDay")}</option>
              <option value="sport">{t("schedule.bySport")}</option>
              <option value="venue">{t("schedule.byVenue")}</option>
            </select>
          </div>
          {groups.length === 0 ? <div className="card"><EmptyState icon="calendar" action={{ label: t("common.clearFilters"), onClick: clearFilters }}>{t("schedule.noMatch")}</EmptyState></div> : groups.map(([key, g]) => (
            <section key={key} className="stack-sm">
              <h2>{g.title}</h2>
              <div className="table-wrap">
                <table className="table schedule-table">
                  <tbody>
                    {g.items.map((s) => (
                      <tr key={s.id} id={`s-${s.id}`} className={`${s.isMedal ? "is-medal" : ""}${focus === s.id ? " is-highlighted" : ""}`}>
                        <td className="sched-time">
                          <strong>{time(s.start)}</strong>–{time(s.end)}
                          {group !== "day" && <div className="muted">{dayLabel(dayKey(s.start))}</div>}
                        </td>
                        <td>
                          <strong>{s.sport}</strong>{s.discipline && s.discipline !== s.sport && <span className="muted"> · {s.discipline}</span>}
                          <div>{s.phase}</div>
                          {s.isMedal && s.medalEvents && <div className="small medal-events">🥇 {s.medalEvents}</div>}
                          {s.notes && <div className="small muted">{s.notes}</div>}
                        </td>
                        <td className="small"><a href={`/venues/${s.venueSlug}`}>{s.venue}</a></td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          {s.isMedal && <Badge tone="warning">{t("schedule.medal")}</Badge>} {s.isOq && <Badge tone="info" >OQ</Badge>}
                          {s.draft && <Badge tone="warning">{t("cms.status.draft")}</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </>
      ) : (
        <Timeline sessions={filtered} day={timelineDay} days={days} setDay={setTimelineDay} dayKey={dayKey} dayLabel={dayLabel} time={time} tz={tz} clearFilters={clearFilters} />
      )}
      <p className="hint">{t("schedule.oqHelp")} {tzMode === "trt" ? t("schedule.trtNote") : ""}</p>
    </div>
  );
}

function Timeline({ sessions, day, days, setDay, dayKey, dayLabel, time, tz, clearFilters }: {
  clearFilters: () => void;
  sessions: SessionRow[]; day: string; days: string[]; setDay: (d: string) => void; dayKey: (iso: string) => string;
  dayLabel: (k: string) => string; time: (iso: string) => string; tz: string;
}) {
  const { t } = useI18n();
  const items = sessions.filter((s) => dayKey(s.start) === day);
  const hourOf = (iso: string) => {
    const p = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: tz }).formatToParts(new Date(iso));
    return Number(p.find((x) => x.type === "hour")!.value) + Number(p.find((x) => x.type === "minute")!.value) / 60;
  };
  const from = Math.max(0, Math.floor(Math.min(8, ...items.map((s) => hourOf(s.start)))));
  const to = Math.min(24, Math.ceil(Math.max(22, ...items.map((s) => { const e = hourOf(s.end); return e < hourOf(s.start) ? 24 : e; }))));
  const span = to - from;
  const venues = [...new Map(items.map((s) => [s.venueId, s.venue])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  return (
    <div className="stack-sm">
      <div className="chips">
        {days.map((d) => <button key={d} type="button" className={`chip${day === d ? " is-active" : ""}`} onClick={() => setDay(d)}>{dayLabel(d)}</button>)}
      </div>
      {items.length === 0 ? <div className="card"><EmptyState icon="calendar" action={{ label: t("common.clearFilters"), onClick: clearFilters }}>{t("schedule.noMatch")}</EmptyState></div> : (
        <div className="timeline card">
          <div className="tl-scroll">
            <div className="tl-grid" style={{ ["--span" as string]: span }}>
              <div className="tl-head">
                <div className="tl-label" />
                <div className="tl-hours">
                  {Array.from({ length: span }, (_, i) => <span key={i} style={{ left: `${(i / span) * 100}%` }}>{String(from + i).padStart(2, "0")}:00</span>)}
                </div>
              </div>
              {venues.map(([vid, vname]) => (
                <div key={vid} className="tl-row">
                  <div className="tl-label small"><strong>{vname}</strong></div>
                  <div className="tl-track">
                    {Array.from({ length: span }, (_, i) => <span key={`h${i}`} className="tl-hourline" style={{ left: `${(i / span) * 100}%` }} aria-hidden="true" />)}
                    {items.filter((s) => s.venueId === vid).map((s) => {
                      const a = hourOf(s.start), b0 = hourOf(s.end), b = b0 < a ? 24 : b0;
                      return (
                        <a key={s.id} href={`/schedule?session=${s.id}`} className={`tl-block${s.isMedal ? " is-medal" : ""}`}
                          style={{ left: `${((a - from) / span) * 100}%`, width: `${Math.max(2, ((b - a) / span) * 100)}%` }}
                          title={`${time(s.start)}–${time(s.end)} · ${s.sport} · ${s.phase}`}>
                          <strong>{s.sport}</strong> <span>{s.phase}</span>
                          <span className="tl-badges">{s.isMedal && "🥇"}{s.isOq && " OQ"}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
