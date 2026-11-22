import "server-only";
import { createClient } from "@/lib/supabase/server";
import { loadHandbook, type HbChapter } from "@/lib/handbook";
import { withDraft } from "@/lib/content/render";

/** Handbook tree for the current user; in preview mode drafts and pending changes are included. */
export async function getHandbookTree(preview: boolean): Promise<HbChapter[]> {
  const supabase = await createClient();
  const tree = await loadHandbook(supabase, { includeDrafts: preview });
  if (!preview) return tree;
  return tree.map((c) => ({ ...withDraft(c, true), sections: c.sections.map((s) => withDraft(s, true)) }));
}
