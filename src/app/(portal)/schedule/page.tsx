import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { tx, cols, DEFAULT_LOCALE } from "@/lib/i18n";
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
  const [{ data }, { data: sports }, { data: venues }, { data: favs }] = await Promise.all([
    q,
    supabase.from("sports").select(`id,${cols("title")},position` as "*").order("position"),
    supabase.from("venues").select(`id,slug,${cols("title")}` as "*").order(`title_${DEFAULT_LOCALE}`),
    supabase.from("favorites").select("target_id").eq("kind", "sport"),
  ]);
  const S = new Map((sports ?? []).map((s) => [s.id, tx(s, "title", locale)]));
  const V = new Map((venues ?? []).map((v) => [v.id, { title: tx(v, "title", locale), slug: v.slug }]));
  const rows: SessionRow[] = (data ?? []).map((raw) => {
    const s = withDraft(raw, preview);
    return {
      id: s.id, code: s.code, sportId: s.sport_id, sport: S.get(s.sport_id) ?? "", venueId: s.venue_id, venue: V.get(s.venue_id)?.title ?? "",
      venueSlug: V.get(s.venue_id)?.slug ?? "", discipline: tx(s, "discipline", locale), phase: tx(s, "phase", locale),
      start: s.start_at, end: s.end_at, isMedal: s.is_medal, medalEvents: tx(s, "medal_events", locale), isOq: s.is_oq,
      notes: tx(s, "notes", locale), draft: s.status !== "published",
    };
  });
  const usedSports = new Set(rows.map((r) => r.sportId));
  const usedVenues = new Set(rows.map((r) => r.venueId));
  return (
    <div className="stack">
      {preview && <PreviewBanner exitHref="/schedule" />}
      <PageHeader title={t("nav.schedule")} subtitle={t("schedule.subtitle")} />
      {rows.length === 0 ? <Card><EmptyState icon="calendar" action={{ label: t("common.contactHost"), href: "/contacts" }}>{t("schedule.empty")}</EmptyState></Card> : (
        <ScheduleView
          sessions={rows}
          focus={sp.session ?? null}
          favSports={(favs ?? []).map((f) => f.target_id)}
          sports={(sports ?? []).filter((s) => usedSports.has(s.id)).map((s) => ({ id: s.id, title: S.get(s.id)! }))}
          venues={(venues ?? []).filter((v) => usedVenues.has(v.id)).map((v) => ({ id: v.id, title: V.get(v.id)!.title }))}
        />
      )}
      <p className="muted small">{t("common.exampleNote")}</p>
    </div>
  );
}
