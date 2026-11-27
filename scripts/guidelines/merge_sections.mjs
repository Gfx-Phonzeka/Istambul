// HB Portal · fuses new content into EXISTING Production Guidelines chapters, from a merge plan (JSON).
// Usage: node scripts/guidelines/merge_sections.mjs <lima|istanbul> <plan.json>
// Plan: { ops: [{ chapter, slug, position, action: "keep"|"update"|"insert", title_<l>?, body_<l>?, append_tbc? }], delete: [chapter slugs] }
//  - keep: only sets the position; update: replaces the given bodies (other languages untouched);
//  - insert: new section (production only); append_tbc: re-adds the old [TBC]/[A CONFIRMAR]/[POR CONFIRMAR] items of that section.
// Run the backup script first. The plan holds confidential team content: keep it outside the repository.
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const [portal, file] = process.argv.slice(2);
const CFG = {
  istanbul: { env: ".env.local", seed: "supabase/seed/demo-accounts.local.sql", admin: "admin@demo.istanbul2027.example", langs: ["en", "pt", "tr"] },
  lima: { env: ".env.lima.local", seed: "supabase/seed/lima-demo-accounts.local.sql", admin: "admin@demo.lima2027.example", langs: ["es", "pt", "en"] },
}[portal];
if (!CFG || !file) { console.error("Uso: merge_sections.mjs <lima|istanbul> <plano.json>"); process.exit(1); }
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const env = Object.fromEntries(fs.readFileSync(path.join(root, CFG.env), "utf8").split("\n")
  .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)).filter(Boolean).map((m) => [m[1], m[2].replace(/^["']|["']$/g, "")]));
const password = fs.readFileSync(path.join(root, CFG.seed), "utf8").split("\n").find((l) => l.startsWith("-- Administrador"))?.split("|")[2]?.trim();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { error: authErr } = await sb.auth.signInWithPassword({ email: CFG.admin, password });
if (authErr) throw authErr;

const plan = JSON.parse(fs.readFileSync(file, "utf8"));
const now = new Date().toISOString();
const { data: chapters } = await sb.from("guide_chapters").select("id,slug");
const chId = Object.fromEntries(chapters.map((c) => [c.slug, c.id]));
const TBC = /<li>[^<]*(\[TBC|\[A CONFIRMAR|\[POR CONFIRMAR)[\s\S]*?<\/li>/;

for (const op of plan.ops) {
  const chapter_id = chId[op.chapter];
  if (!chapter_id) throw new Error(`capítulo em falta: ${op.chapter}`);
  const fields = Object.fromEntries(Object.entries(op).filter(([k]) => k.startsWith("title_") || k.startsWith("body_")));
  if (op.action === "insert") {
    await sb.from("guide_sections").delete().eq("chapter_id", chapter_id).eq("slug", op.slug); // re-runs replace
    const { error } = await sb.from("guide_sections").insert({ ...fields, chapter_id, slug: op.slug, position: op.position, visibility: "production", status: "published", published_at: now, content_updated_at: now });
    console.log(error ? `✗ ${op.chapter}/${op.slug}: ${error.message}` : `+ ${op.chapter}/${op.slug}`);
    continue;
  }
  const { data: cur, error: gErr } = await sb.from("guide_sections").select("*").eq("chapter_id", chapter_id).eq("slug", op.slug).single();
  if (gErr) throw new Error(`${op.chapter}/${op.slug}: ${gErr.message}`);
  const patch = { position: op.position };
  if (op.action === "update") {
    Object.assign(patch, fields, { content_updated_at: now });
    if (op.append_tbc) for (const l of CFG.langs) {
      if (!patch[`body_${l}`]) continue;
      const m = (cur[`body_${l}`] ?? "").match(TBC);
      if (m) patch[`body_${l}`] += `\n<ul>${m[0]}</ul>`;
    }
  }
  const { error } = await sb.from("guide_sections").update(patch).eq("id", cur.id);
  console.log(error ? `✗ ${op.chapter}/${op.slug}: ${error.message}` : `${op.action === "keep" ? "=" : "~"} ${op.chapter}/${op.slug}`);
}
for (const slug of plan.delete ?? []) {
  if (!chId[slug]) continue;
  await sb.from("guide_sections").delete().eq("chapter_id", chId[slug]);
  const { error } = await sb.from("guide_chapters").delete().eq("id", chId[slug]);
  console.log(error ? `✗ apagar ${slug}: ${error.message}` : `- capítulo ${slug}`);
}
