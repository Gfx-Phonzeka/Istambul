import "server-only";
import { createClient } from "@/lib/supabase/server";
import { loadHandbook, type HbChapter } from "@/lib/handbook";
import { withDraft } from "@/lib/content/render";

/** Handbook tree for the current user; in preview mode drafts and pending changes are included. */
export async function getHandbookTree(preview: boolean): Promise<HbChapter[]> {
  const supabase = await createClient();
  const tree = await loadHandbook(supabase, { includeDrafts: preview, withBodies: false });
  if (!preview) return tree;
  return tree.map((c) => ({ ...withDraft(c, true), sections: c.sections.map((s) => withDraft(s, true)) }));
}

/** Text of one handbook section (EN and TR), with pending changes in preview mode. */
export async function getHandbookBody(id: string, preview: boolean): Promise<{ body_en: string; body_tr: string | null }> {
  const supabase = await createClient();
  const { data } = await supabase.from("handbook_sections").select("body_en,body_tr,draft").eq("id", id).maybeSingle();
  const row = withDraft((data ?? { body_en: "", body_tr: null, draft: null }) as { body_en: string; body_tr: string | null; draft: Record<string, unknown> | null }, preview);
  return { body_en: row.body_en, body_tr: row.body_tr };
}
