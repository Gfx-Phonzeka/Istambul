import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { pick } from "@/lib/i18n";
import { isPreview } from "@/lib/preview";
import { withDraft } from "@/lib/content/render";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { ScheduleView, type SessionRow } from "@/components/schedule/ScheduleView";
import { PreviewBanner } from "@/components/content/PreviewBanner";

export const metadata = { title: "Competition schedule" };

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ preview?: string; session?: string }> }) {
  const sp = await searchParams;
  const preview = await isPreview(sp);
  const { t, locale } = await getT();
  const supabase = await createClient();
  let q = supabase.from("schedule_sessions").select("*").order("start_at");
  if (!preview) q = q.eq("status", "published");
  const [{ data }, { data: sports }, { data: venues }] = await Promise.all([
    q,
    supabase.from("sports").select("id,title_en,title_tr,position").order("position"),
    supabase.from("venues").select("id,slug,title_en,title_tr").order("title_en"),
  ]);
  const S = new Map((sports ?? []).map((s) => [s.id, pick(locale, s.title_en, s.title_tr)]));
  const V = new Map((venues ?? []).map((v) => [v.id, { title: pick(locale, v.title_en, v.title_tr), slug: v.slug }]));
  const rows: SessionRow[] = (data ?? []).map((raw) => {
    const s = withDraft(raw, preview);
    return {
      id: s.id, code: s.code, sportId: s.sport_id, sport: S.get(s.sport_id) ?? "", venueId: s.venue_id, venue: V.get(s.venue_id)?.title ?? "",
      venueSlug: V.get(s.venue_id)?.slug ?? "", discipline: pick(locale, s.discipline_en, s.discipline_tr), phase: pick(locale, s.phase_en, s.phase_tr),
      start: s.start_at, end: s.end_at, isMedal: s.is_medal, medalEvents: pick(locale, s.medal_events_en, s.medal_events_tr), isOq: s.is_oq,
      notes: pick(locale, s.notes_en, s.notes_tr), draft: s.status !== "published",
    };
  });
  const usedSports = new Set(rows.map((r) => r.sportId));
  const usedVenues = new Set(rows.map((r) => r.venueId));
  return (
    <div className="stack">
      {preview && <PreviewBanner exitHref="/schedule" />}
      <PageHeader title={t("nav.schedule")} subtitle={t("schedule.subtitle")} />
      {rows.length === 0 ? <Card><EmptyState icon="calendar">{t("schedule.empty")}</EmptyState></Card> : (
        <ScheduleView
          sessions={rows}
          focus={sp.session ?? null}
          sports={(sports ?? []).filter((s) => usedSports.has(s.id)).map((s) => ({ id: s.id, title: S.get(s.id)! }))}
          venues={(venues ?? []).filter((v) => usedVenues.has(v.id)).map((v) => ({ id: v.id, title: V.get(v.id)!.title }))}
        />
      )}
      <p className="muted small">{t("common.exampleNote")}</p>
    </div>
  );
}
