import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { withDraft } from "@/lib/content/render";
import { GUIDE_LANG_COOKIE, GUIDE_UI, loadGuide, resolveGuideLang, type GuideChapter, type GuideSection } from "@/lib/guide";

/** Guidelines tree + reading language for the current (team) user. Preview mode includes drafts. */
export async function getGuideContext(preview: boolean, opts: { withBodies?: boolean } = {}) {
  const supabase = await createClient();
  const { locale } = await getT();
  const lang = resolveGuideLang((await cookies()).get(GUIDE_LANG_COOKIE)?.value, locale);
  let chapters: GuideChapter[] = await loadGuide(supabase, { includeDrafts: preview, withBodies: opts.withBodies });
  if (preview) chapters = chapters.map((c) => ({ ...withDraft(c, true), sections: c.sections.map((s) => withDraft(s, true)) }));
  const ui = GUIDE_UI[lang];
  const fmt = (k: string, vars: Record<string, string> = {}) => Object.entries(vars).reduce((s, [a, b]) => s.replaceAll(`{${a}}`, b), ui[k] ?? k);
  return { chapters, lang, ui: fmt, locale };
}

/** Texts of one section (all three languages), with pending changes in preview mode. */
export async function getGuideBody(id: string, preview: boolean): Promise<Pick<GuideSection, "body_en" | "body_pt" | "body_tr">> {
  const supabase = await createClient();
  const { data } = await supabase.from("guide_sections").select("body_en,body_pt,body_tr,draft").eq("id", id).maybeSingle();
  const row = withDraft((data ?? { body_en: "", draft: null }) as GuideSection, preview);
  return { body_en: row.body_en, body_pt: row.body_pt, body_tr: row.body_tr };
}
