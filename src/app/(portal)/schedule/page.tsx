import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { tx, cols, DEFAULT_LOCALE } from "@/lib/i18n";
import { isPreview } from "@/lib/preview";
import { withDraft } from "@/lib/content/render";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { ScheduleView, type SessionRow } from "@/components/schedule/ScheduleView";
import { PreviewBanner } from "@/components/content/PreviewBanner";
import { CompetitionCalendar, type CalendarGroup, type DayCode } from "@/components/schedule/CompetitionCalendar";
import { EVENT } from "@/lib/event";
import { intlLocale } from "@/lib/i18n";
import { todayIn } from "@/lib/reports";

/** Every day from the first to the last date used by a group of calendar rows. */
function dayRange(rows: { days: Record<string, string> }[], fixed?: [string, string]): string[] {
  const all = rows.flatMap((r) => Object.keys(r.days)).sort();
  const [first, last] = fixed ?? [all[0], all[all.length - 1]];
  if (!first || !last) return [];
  const out: string[] = [];
  for (let d = new Date(first + "T00:00:00Z"); d <= new Date(last + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 1)) out.push(d.toISOString().slice(0, 10));
  return out;
}

/** Short location of a cluster: "Clúster C · VIDENA" → "VIDENA". */
const shortCluster = (title: string) => (title.includes("·") ? title.split("·").pop()!.trim() : title);

export const metadata = { title: "Competition schedule" };

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ preview?: string; session?: string }> }) {
  const sp = await searchParams;
  const preview = await isPreview(sp);
  const { t, locale } = await getT();
  const supabase = await createClient();
  let q = supabase.from("schedule_sessions").select("*").order("start_at");
  if (!preview) q = q.eq("status", "published");
  const [{ data }, { data: sports }, { data: venues }, { data: favs }, { data: cal }, { data: clusters }] = await Promise.all([
    q,
    supabase.from("sports").select(`id,${cols("title")},position` as "*").order("position"),
    supabase.from("venues").select(`id,slug,cluster_id,${cols("title")}` as "*").order(`title_${DEFAULT_LOCALE}`),
    supabase.from("favorites").select("target_id").eq("kind", "sport"),
    supabase.from("calendar_rows").select(`id,games,position,sport_id,venue_id,location,${cols("label")},days` as "*").order("position"),
    supabase.from("clusters").select(`id,${cols("title")}` as "*"),
  ]);
  const CL = new Map((clusters ?? []).map((c) => [c.id, shortCluster(tx(c, "title", locale))]));
  const S = new Map((sports ?? []).map((s) => [s.id, tx(s, "title", locale)]));
  const V = new Map((venues ?? []).map((v) => [v.id, { title: tx(v, "title", locale), slug: v.slug, location: CL.get(v.cluster_id) ?? "" }]));
  const rows: SessionRow[] = (data ?? []).map((raw) => {
    const s = withDraft(raw, preview);
    return {
      id: s.id, code: s.code, sportId: s.sport_id, sport: S.get(s.sport_id) ?? "", venueId: s.venue_id, venue: V.get(s.venue_id)?.title ?? "",
      venueSlug: V.get(s.venue_id)?.slug ?? "", discipline: tx(s, "discipline", locale), phase: tx(s, "phase", locale),
      start: s.start_at, end: s.end_at, isMedal: s.is_medal, medalEvents: tx(s, "medal_events", locale), isOq: s.is_oq,
      notes: tx(s, "notes", locale), draft: s.status !== "published",
    };
  });
  // Competition calendar by day (no times), grouped by Games (Lima: Pan / Parapan)
  const calRows = (cal ?? []) as unknown as { id: string; games: string; sport_id: string | null; venue_id: string | null; days: Record<string, DayCode>; location: string | null }[];
  const calGroups: CalendarGroup[] = [...new Set(calRows.map((r) => r.games))].map((g) => {
    const rs = calRows.filter((r) => r.games === g);
    return {
      key: g, title: t(`schedule.calendar.games.${g}`), days: dayRange(rs, EVENT.calendarRanges?.[g]),
      rows: rs.map((r) => ({
        id: r.id, label: tx(r, "label", locale) || (r.sport_id ? S.get(r.sport_id) ?? "" : ""),
        location: r.location || (r.venue_id && V.get(r.venue_id)?.location) || "",
        venue: (r.venue_id && V.get(r.venue_id)?.title) || "", venueSlug: (r.venue_id && V.get(r.venue_id)?.slug) || null, days: r.days,
      })),
    };
  });
  const usedSports = new Set(rows.map((r) => r.sportId));
  const usedVenues = new Set(rows.map((r) => r.venueId));
  return (
    <div className="stack">
      {preview && <PreviewBanner exitHref="/schedule" />}
      <PageHeader title={t("nav.schedule")} subtitle={t("schedule.subtitle")} />
      {calGroups.length > 0 && (
        <CompetitionCalendar
          groups={calGroups}
          today={todayIn(EVENT.tz)}
          intl={intlLocale(locale)}
          labels={{
            cols: { discipline: t("schedule.calendar.cols.discipline"), location: t("schedule.calendar.cols.location"), venue: t("schedule.calendar.cols.venue") },
            subjectToChange: t("schedule.calendar.subjectToChange"),
            legend: Object.fromEntries((["X", "F", "M", "P", "T", "C"] as DayCode[]).map((c) => [c, t(`schedule.calendar.legend.${c}`)])) as Record<DayCode, string>,
            note: t("schedule.calendar.note"),
          }}
        />
      )}
      {rows.length === 0 ? (calGroups.length > 0 ? null : <Card><EmptyState icon="calendar" action={{ label: t("common.contactHost"), href: "/contacts" }}>{t("schedule.empty")}</EmptyState></Card>) : (
        <ScheduleView
          sessions={rows}
          focus={sp.session ?? null}
          favSports={(favs ?? []).map((f) => f.target_id)}
          sports={(sports ?? []).filter((s) => usedSports.has(s.id)).map((s) => ({ id: s.id, title: S.get(s.id)! }))}
          venues={(venues ?? []).filter((v) => usedVenues.has(v.id)).map((v) => ({ id: v.id, title: V.get(v.id)!.title }))}
        />
      )}
      {rows.length > 0 && <p className="muted small">{t("common.exampleNote")}</p>}
    </div>
  );
}
