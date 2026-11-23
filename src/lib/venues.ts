import "server-only";
import { intlLocale } from "@/lib/i18n";
import type { SupabaseClient } from "@supabase/supabase-js";
import { tx, type Locale, cols } from "@/lib/i18n";
import { withDraft } from "@/lib/content/render";

export function dateRange(a: string | null, b: string | null, locale: Locale): string {
  const f = (d: string) => new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(d));
  if (a && b) return `${f(a)} – ${f(b)}`;
  return a ? f(a) : b ? f(b) : "";
}

export interface PlanSummary {
  id: string; venue_id: string; sport_id: string; title: string; venueTitle: string; venueSlug: string; sportTitle: string;
  cluster: string; clusterTitle: string; level: string | null; shape: string; total: number; specials: number;
  byLevel: Record<string, number>; draft: boolean; content_updated_at: string | null; published_at: string | null;
}

/** All camera plans visible to the user, with venue / sport / cluster names and camera counts. */
export async function loadPlans(supabase: SupabaseClient, locale: Locale, preview: boolean): Promise<PlanSummary[]> {
  let pq = supabase.from("camera_plans").select("*").order("position");
  if (!preview) pq = pq.eq("status", "published");
  const [{ data: plans }, { data: venues }, { data: sports }, { data: clusters }, { data: cams }] = await Promise.all([
    pq,
    supabase.from("venues").select(`id,slug,${cols("title")},cluster_id,production_level,status,draft` as "*"),
    supabase.from("sports").select(`id,${cols("title")},field_shape` as "*"),
    supabase.from("clusters").select(`id,slug,${cols("title")}` as "*"),
    supabase.from("cameras").select("plan_id,level,is_special"),
  ]);
  const V = new Map((venues ?? []).map((v) => [v.id, withDraft(v, preview)]));
  const S = new Map((sports ?? []).map((s) => [s.id, s]));
  const C = new Map((clusters ?? []).map((c) => [c.id, c]));
  return (plans ?? [])
    .map((raw) => withDraft(raw, preview))
    .filter((p) => V.has(p.venue_id) && (preview || V.get(p.venue_id)!.status === "published"))
    .map((p) => {
      const v = V.get(p.venue_id)!, s = S.get(p.sport_id), c = C.get(v.cluster_id);
      const list = (cams ?? []).filter((x) => x.plan_id === p.id);
      const byLevel: Record<string, number> = { "1": 0, "2": 0, "3": 0 };
      list.forEach((x) => { byLevel[x.level] = (byLevel[x.level] ?? 0) + 1; });
      return {
        id: p.id, venue_id: p.venue_id, sport_id: p.sport_id, title: tx(p, "title", locale),
        venueTitle: tx(v, "title", locale), venueSlug: v.slug, sportTitle: s ? tx(s, "title", locale) : "",
        cluster: c?.slug ?? "", clusterTitle: c ? tx(c, "title", locale) : "", level: v.production_level,
        shape: p.field_shape || s?.field_shape || "generic", total: list.length, specials: list.filter((x) => x.is_special).length,
        byLevel, draft: p.status !== "published", content_updated_at: p.content_updated_at, published_at: p.published_at,
      };
    });
}
