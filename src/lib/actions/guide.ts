"use server";
import { cookies } from "next/headers";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { GUIDE_LANG_COOKIE, type GuideLang } from "@/lib/guide";

export async function saveGuideNotes(sectionId: string, notes: string): Promise<{ ok: boolean }> {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("guide_notes").upsert({ section_id: sectionId, notes: notes.slice(0, 20000), updated_at: new Date().toISOString() });
  return { ok: !error };
}

/** Remembers the reading language of the Production Guidelines (EN · PT · TR). */
export async function setGuideLang(lang: GuideLang) {
  if (!["en", "pt", "tr"].includes(lang)) return;
  (await cookies()).set(GUIDE_LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}
