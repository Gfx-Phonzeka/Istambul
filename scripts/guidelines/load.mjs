// Loads scripts/guidelines/guidelines.json into the portal (replaces the whole manual).
//   node --env-file=.env.local scripts/guidelines/load.mjs   (with ADMIN_EMAIL and ADMIN_PASSWORD of an admin account set)
// Turkish is loaded as "to be reviewed by a native speaker" (tr_reviewed = false).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Supabase address and public key come from the environment (same values as .env.local).
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!URL || !KEY) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.local)");
const sb = createClient(URL, KEY, { auth: { persistSession: false } });
const ok = (res, what) => { if (res.error) throw new Error(`${what}: ${res.error.message}`); return res.data; };
const { error } = await sb.auth.signInWithPassword({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
if (error) throw error;

const chapters = JSON.parse(readFileSync(new globalThis.URL("./guidelines.json", import.meta.url), "utf8"));
const now = new Date().toISOString();
const pub = { status: "published", published_at: now, content_updated_at: now, draft: null, visibility: "production", tr_reviewed: false };

ok(await sb.from("guide_chapters").delete().not("id", "is", null), "delete chapters");
let sections = 0, notes = 0;
for (const c of chapters) {
  const [row] = ok(await sb.from("guide_chapters").insert({
    slug: c.slug, position: c.position,
    title_en: c.title_en, title_pt: c.title_pt, title_tr: c.title_tr,
    summary_en: c.summary_en || null, summary_pt: c.summary_pt || null, summary_tr: c.summary_tr || null, ...pub,
  }).select("id"), `chapter ${c.slug}`);
  for (const s of c.sections) {
    const [sec] = ok(await sb.from("guide_sections").insert({
      chapter_id: row.id, slug: s.slug, position: s.position,
      title_en: s.title_en, title_pt: s.title_pt, title_tr: s.title_tr,
      body_en: s.body_en, body_pt: s.body_pt, body_tr: s.body_tr, ...pub,
    }).select("id"), `section ${c.slug}/${s.slug}`);
    sections++;
    if (s.notes.length) {
      ok(await sb.from("guide_notes").insert({ section_id: sec.id, notes: s.notes.join("\n") }), `notes ${s.slug}`);
      notes++;
    }
  }
}
console.log(`guidelines: ${chapters.length} chapters, ${sections} sections, ${notes} sections with internal notes`);
