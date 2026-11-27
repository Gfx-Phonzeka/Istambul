import Link from "next/link";
import { redirect } from "next/navigation";
import { requireTeam } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { tx, cols, DEFAULT_LOCALE } from "@/lib/i18n";
import { EVENT_TZ, formatDate, formatDateTime } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { PRODUCER_AREAS, fileHref, isDay, reportKind, reportsAccess, todayIn, type ReportFile } from "@/lib/reports";
import { Alert, Card, EmptyState, PageHeader } from "@/components/ui";
import { DailyReportForm, DeletePqcButton, PqcForm } from "@/components/reports/ReportForms";

export const metadata = { title: "Daily reports" };

const TZ = EVENT_TZ;
const day = (d: string, locale: Locale) => formatDate(`${d}T12:00:00Z`, locale, "UTC");

type SP = { date?: string; venue?: string };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const me = await requireTeam();
  const can = reportsAccess(me);
  if (!can.any) redirect("/team");
  const sp = await searchParams;
  const today = todayIn(TZ);
  const date = isDay(sp.date) ? sp.date : today;
  const venueFilter = sp.venue && /^[0-9a-f-]{36}$/.test(sp.venue) ? sp.venue : "";
  const { t, locale } = await getT();
  const supabase = await createClient();

  let allReports = supabase.from("daily_reports").select("*").eq("report_date", date).order("created_at");
  let pqcQuery = supabase.from("pqc_reports").select("*").eq("report_date", date).order("created_at");
  if (venueFilter) { allReports = allReports.eq("venue_id", venueFilter); pqcQuery = pqcQuery.eq("venue_id", venueFilter); }

  const [{ data: venues }, { data: sports }, mine, myList, all, pqc] = await Promise.all([
    supabase.from("venues").select(`id,${cols("title")}` as "*").eq("status", "published").order(`title_${DEFAULT_LOCALE}`),
    supabase.from("sports").select(`id,${cols("title")}` as "*").eq("status", "published").order("position"),
    can.write ? supabase.from("daily_reports").select("*").eq("author_id", me.id).eq("report_date", date).maybeSingle() : Promise.resolve({ data: null }),
    can.write ? supabase.from("daily_reports").select("id,report_date,venue_id,sport_id,updated_at").eq("author_id", me.id).order("report_date", { ascending: false }).limit(60) : Promise.resolve({ data: [] }),
    can.read ? allReports : Promise.resolve({ data: [] }),
    can.read || can.pqc ? (can.read ? pqcQuery : pqcQuery.eq("uploaded_by", me.id)) : Promise.resolve({ data: [] }),
  ]);
  const V = new Map((venues ?? []).map((v) => [v.id, tx(v, "title", locale)]));
  const S = new Map((sports ?? []).map((s) => [s.id, tx(s, "title", locale)]));
  const opts = (m: Map<string, string>) => [...m.entries()].map(([id, title]) => ({ id, title }));
  const where = (r: { venue_id: string | null; sport_id: string | null }) => [r.venue_id && V.get(r.venue_id), r.sport_id && S.get(r.sport_id)].filter(Boolean).join(" · ");
  const m = mine.data;
  const href = (d: string, v = venueFilter) => `/team/reports?date=${d}${v ? `&venue=${v}` : ""}`;
  const shift = (n: number) => { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

  return (
    <div className="stack">
      <PageHeader title={t("reports.title")} subtitle={t(can.read ? "reports.subtitleRead" : "reports.subtitle")} />
      <Alert tone="info">{t("reports.privacy")}</Alert>

      <form className="row" method="get" action="/team/reports" style={{ flexWrap: "wrap", gap: 8 }}>
        <Link className="btn btn-ghost btn-sm" href={href(shift(-1))} aria-label={t("reports.prevDay")}>‹</Link>
        <input type="date" name="date" className="input" defaultValue={date} aria-label={t("reports.date")} style={{ maxWidth: 180 }} />
        <Link className="btn btn-ghost btn-sm" href={href(shift(1))} aria-label={t("reports.nextDay")}>›</Link>
        {can.read && (
          <select name="venue" className="select" defaultValue={venueFilter} aria-label={t("schedule.venue")} style={{ maxWidth: 280 }}>
            <option value="">{t("reports.allVenues")}</option>
            {opts(V).map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
          </select>
        )}
        <button className="btn btn-sm">{t("reports.show")}</button>
        {date !== today && <Link className="small" href={href(today)}>{t("reports.today")}</Link>}
      </form>

      {can.write && (
        <Card title={`${t("reports.myReport")} · ${day(date, locale)}`} actions={m?.updated_at ? <span className="muted small">{t("reports.lastSaved", { when: formatDateTime(m.updated_at, locale) })}</span> : undefined}>
          <DailyReportForm
            key={`${date}-${m?.id ?? "new"}-${m?.updated_at ?? ""}`}
            uid={me.id} date={date} venues={opts(V)} sports={opts(S)} canChooseKind={can.admin}
            initial={{
              id: m?.id, venue_id: m?.venue_id ?? me.team_venue_id ?? "", sport_id: m?.sport_id ?? me.team_sport_id ?? "",
              sessions: m?.sessions ?? "", summary: m?.summary ?? "", technical_issues: m?.technical_issues ?? "",
              editorial_issues: m?.editorial_issues ?? "", attachments: (m?.attachments ?? []) as ReportFile[], updated_at: m?.updated_at,
              kind: (m?.kind as "producer" | "director") ?? (can.admin ? "producer" : reportKind(me)), start_time: m?.start_time ?? "", end_time: m?.end_time ?? "",
              checks: (m?.checks ?? {}) as Record<string, string>, logistics_issues: m?.logistics_issues ?? "",
            }}
          />
        </Card>
      )}

      {can.read && (
        <section className="stack-sm">
          <h2>{t("reports.allTitle", { date: day(date, locale) })}</h2>
          {(all.data ?? []).length === 0 ? <Card><EmptyState icon="file">{t("reports.noneForDay")}</EmptyState></Card> : (
            (all.data ?? []).map((r) => {
              const files = (r.attachments ?? []) as ReportFile[];
              return (
                <article key={r.id} className="card stack-sm">
                  <div className="row-between">
                    <strong>{r.author_name || "—"}{r.author_function ? <span className="muted small"> · {r.author_function}</span> : null}</strong>
                    <span className="muted small">{formatDateTime(r.updated_at, locale)}</span>
                  </div>
                  <div className="small muted">
                    <span className="badge">{t(`reports.kinds.${r.kind ?? "director"}`)}</span>{" "}
                    {[where(r), r.sessions, r.kind === "producer" && (r.start_time || r.end_time) ? `${r.start_time || "?"}–${r.end_time || "?"}` : ""].filter(Boolean).join(" · ") || "—"}
                  </div>
                  {r.kind === "producer" ? (
                    <>
                      {PRODUCER_AREAS.map((area) => {
                        const checks = (r.checks ?? {}) as Record<string, string>;
                        const text = r[area.text] as string;
                        const bad = area.items.filter((i) => checks[i] === "incident");
                        return (
                          <div key={area.key}>
                            <strong className="small">{t(`reports.producer.areas.${area.key}`)}</strong>{" "}
                            {bad.length === 0
                              ? <span className="badge badge-success">{t("reports.producer.allOk")}</span>
                              : bad.map((i) => <span key={i} className="badge badge-danger" style={{ marginRight: 4 }}>{t(`reports.producer.items.${i}`)}</span>)}
                            {text && <p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{text}</p>}
                          </div>
                        );
                      })}
                      {r.summary && <div><strong className="small">{t("reports.producer.notes")}</strong><p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{r.summary}</p></div>}
                    </>
                  ) : (
                    <>
                      <div><strong className="small">{t("reports.summary")}</strong><p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{r.summary}</p></div>
                      {r.technical_issues && <div><strong className="small">{t("reports.technical")}</strong><p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{r.technical_issues}</p></div>}
                      {r.editorial_issues && <div><strong className="small">{t("reports.editorial")}</strong><p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{r.editorial_issues}</p></div>}
                    </>
                  )}
                  {files.length > 0 && (
                    <div className="small"><strong>{t("reports.attachments")}:</strong> {files.map((f, i) => <span key={f.path}>{i > 0 && " · "}<a href={fileHref(f)} target="_blank" rel="noreferrer">{f.name}</a></span>)}</div>
                  )}
                </article>
              );
            })
          )}
        </section>
      )}

      {(can.read || can.pqc) && (
        <Card title={t("reports.pqcTitleSection", { date: day(date, locale) })}>
          <div className="stack">
            {(pqc.data ?? []).length === 0 ? <p className="muted" style={{ margin: 0 }}>{t("reports.pqcNone")}</p> : (
              <ul className="stack-sm" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {(pqc.data ?? []).map((p) => (
                  <li key={p.id} className="row-between">
                    <span>
                      <strong>{p.title}</strong>
                      <span className="muted small"> · {where(p) || "—"}</span>
                      <br />
                      <span className="small">
                        {p.file_path && <a href={fileHref({ path: p.file_path, name: p.file_name ?? "pqc.pdf" })} target="_blank" rel="noreferrer">{t("reports.openPdf")}</a>}
                        {p.file_path && p.url && " · "}
                        {p.url && <a href={p.url} target="_blank" rel="noreferrer noopener">{t("reports.openLink")}</a>}
                      </span>
                    </span>
                    {(p.uploaded_by === me.id || can.admin) && <DeletePqcButton id={p.id} />}
                  </li>
                ))}
              </ul>
            )}
            {can.pqc && (
              <details>
                <summary><strong>{t("reports.pqcAdd")}</strong></summary>
                <div style={{ marginTop: 12 }}><PqcForm uid={me.id} date={date} venues={opts(V)} sports={opts(S)} /></div>
              </details>
            )}
          </div>
        </Card>
      )}

      {can.write && (myList.data ?? []).length > 0 && (
        <Card title={t("reports.myList")}>
          <ul className="stack-sm" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {(myList.data ?? []).map((r) => (
              <li key={r.id} className="row-between">
                <Link href={href(r.report_date, "")}>{day(r.report_date, locale)}</Link>
                <span className="muted small">{where(r) || "—"}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
