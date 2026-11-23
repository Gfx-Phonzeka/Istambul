import { cols, DEFAULT_LOCALE } from "@/lib/i18n";
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
  opts: { includeDrafts?: boolean; onlyPublicVisibility?: boolean; withBodies?: boolean } = {},
): Promise<HbChapter[]> {
  let cq = supabase.from("handbook_chapters").select("*").order("position").order(`title_${DEFAULT_LOCALE}`);
  // Texts are only loaded when needed (PDF); menus and lists use titles only.
  const sectionCols = `id,chapter_id,slug,position,${cols("title")},visibility,status,content_updated_at` + (opts.withBodies !== false ? `,${cols("body")}` : "") + (opts.includeDrafts ? ",draft" : "");
  let sq = supabase.from("handbook_sections").select(sectionCols as "*").order("position").order(`title_${DEFAULT_LOCALE}`);
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
    sections: ((sections ?? []) as unknown as HbSection[]).filter((s) => s.chapter_id === c.id),
  }));
}
