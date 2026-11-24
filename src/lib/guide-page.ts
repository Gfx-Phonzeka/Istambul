import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { withDraft } from "@/lib/content/render";
import { GUIDE_LANGS, GUIDE_LANG_COOKIE, GUIDE_UI, loadGuide, resolveGuideLang, type GuideChapter, type GuideSection } from "@/lib/guide";

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

/** Texts of one section (every reading language), found by chapter + section slug so it can load alongside the tree. */
export async function getGuideBody(chapterSlug: string, sectionSlug: string, preview: boolean): Promise<Partial<GuideSection>> {
  const supabase = await createClient();
  const cols = GUIDE_LANGS.map((l) => `body_${l}`).join(",");
  const { data } = await supabase.from("guide_sections").select(`${cols},draft,guide_chapters!inner(slug)`)
    .eq("slug", sectionSlug).eq("guide_chapters.slug", chapterSlug).limit(1).maybeSingle();
  if (!data) return {};
  const row = withDraft(data as unknown as GuideSection, preview);
  return Object.fromEntries(GUIDE_LANGS.map((l) => [`body_${l}`, row[`body_${l}`]]));
}
