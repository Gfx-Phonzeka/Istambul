// HB Portal · adds (or replaces, by slug) chapters at the END of the Production Guidelines, without touching the others.
// Usage: node scripts/guidelines/add_chapters.mjs <lima|istanbul> <chapters.json>
// JSON: [{ slug, title_<lang>…, sections: [{ slug, position, title_<lang>…, body_<lang>… }] }] — HTML bodies.
// Chapters are published for the production team only (visibility "production").
// The JSON holds confidential team content: keep it outside the repository.
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const [portal, file] = process.argv.slice(2);
const CFG = {
  istanbul: { env: ".env.local", seed: "supabase/seed/demo-accounts.local.sql", admin: "admin@demo.istanbul2027.example" },
  lima: { env: ".env.lima.local", seed: "supabase/seed/lima-demo-accounts.local.sql", admin: "admin@demo.lima2027.example" },
}[portal];
if (!CFG || !file) { console.error("Uso: add_chapters.mjs <lima|istanbul> <ficheiro.json>"); process.exit(1); }
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const env = Object.fromEntries(fs.readFileSync(path.join(root, CFG.env), "utf8").split("\n")
  .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)).filter(Boolean).map((m) => [m[1], m[2].replace(/^["']|["']$/g, "")]));
const password = fs.readFileSync(path.join(root, CFG.seed), "utf8").split("\n").find((l) => l.startsWith("-- Administrador"))?.split("|")[2]?.trim();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { error: authErr } = await sb.auth.signInWithPassword({ email: CFG.admin, password });
if (authErr) throw authErr;

const chapters = JSON.parse(fs.readFileSync(file, "utf8"));
const now = new Date().toISOString();
const { data: existing } = await sb.from("guide_chapters").select("id,slug,position").order("position");
let next = Math.max(0, ...(existing ?? []).map((c) => c.position)) + 1;
for (const { sections, ...c } of chapters) {
  const old = (existing ?? []).find((x) => x.slug === c.slug);
  const position = old ? old.position : next++;
  if (old) {
    await sb.from("guide_sections").delete().eq("chapter_id", old.id);
    const { error } = await sb.from("guide_chapters").update({ ...c, position, content_updated_at: now }).eq("id", old.id);
    if (error) throw new Error(`${c.slug}: ${error.message}`);
  }
  const chapterId = old?.id ?? (await (async () => {
    const { data, error } = await sb.from("guide_chapters").insert({ ...c, position, visibility: "production", status: "published", published_at: now }).select("id").single();
    if (error) throw new Error(`${c.slug}: ${error.message}`);
    return data.id;
  })());
  const { error: sErr } = await sb.from("guide_sections").insert(sections.map((s) => ({ ...s, chapter_id: chapterId, visibility: "production", status: "published", published_at: now, content_updated_at: now })));
  console.log(sErr ? `✗ ${c.slug}: ${sErr.message}` : `✓ ${c.slug} (capítulo ${position}, ${sections.length} secções)`);
}
