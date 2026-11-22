import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface HbSection {
  id: string; chapter_id: string; slug: string; position: number; title_en: string; title_tr: string | null;
  body_en: string; body_tr: string | null; visibility: string; status: string; draft: Record<string, unknown> | null;
  content_updated_at: string | null;
}
export interface HbChapter {
  id: string; slug: string; position: number; title_en: string; title_tr: string | null; summary_en: string | null;
  summary_tr: string | null; visibility: string; status: string; draft: Record<string, unknown> | null;
  sections: HbSection[];
}

/**
 * Loads the handbook tree visible to the caller (RLS applies).
 * `includeDrafts` is only used for staff previews; `onlyPublicVisibility` for the pre-generated PDF.
 */
export async function loadHandbook(
  supabase: SupabaseClient,
  opts: { includeDrafts?: boolean; onlyPublicVisibility?: boolean } = {},
): Promise<HbChapter[]> {
  let cq = supabase.from("handbook_chapters").select("*").order("position").order("title_en");
  let sq = supabase.from("handbook_sections").select("*").order("position").order("title_en");
  if (!opts.includeDrafts) {
    cq = cq.eq("status", "published");
    sq = sq.eq("status", "published");
  }
  if (opts.onlyPublicVisibility) {
    cq = cq.eq("visibility", "all");
    sq = sq.eq("visibility", "all");
  }
  const [{ data: chapters }, { data: sections }] = await Promise.all([cq, sq]);
  return ((chapters ?? []) as HbChapter[]).map((c) => ({
    ...c,
    sections: ((sections ?? []) as HbSection[]).filter((s) => s.chapter_id === c.id),
  }));
}
