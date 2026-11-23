import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { withDraft } from "@/lib/content/render";
import { GUIDE_LANG_COOKIE, GUIDE_UI, loadGuide, resolveGuideLang, type GuideChapter } from "@/lib/guide";

/** Guidelines tree + reading language for the current (team) user. Preview mode includes drafts. */
export async function getGuideContext(preview: boolean) {
  const supabase = await createClient();
  const { locale } = await getT();
  const lang = resolveGuideLang((await cookies()).get(GUIDE_LANG_COOKIE)?.value, locale);
  let chapters: GuideChapter[] = await loadGuide(supabase, preview);
  if (preview) chapters = chapters.map((c) => ({ ...withDraft(c, true), sections: c.sections.map((s) => withDraft(s, true)) }));
  const ui = GUIDE_UI[lang];
  const fmt = (k: string, vars: Record<string, string> = {}) => Object.entries(vars).reduce((s, [a, b]) => s.replaceAll(`{${a}}`, b), ui[k] ?? k);
  return { chapters, lang, ui: fmt, locale };
}
