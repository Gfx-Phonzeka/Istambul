// Lima 2027 · replaces the Handbook (chapters + sections, ES/EN/PT) with the content of a JSON file, signed in as an admin.
// Usage: LIMA_URL=… LIMA_KEY=… ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/lima/load_handbook.mjs handbook.json
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const chapters = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const sb = createClient(process.env.LIMA_URL, process.env.LIMA_KEY);
const { error: authErr } = await sb.auth.signInWithPassword({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
if (authErr) throw authErr;

const now = new Date().toISOString();
const { error: delErr } = await sb.from("handbook_chapters").delete().not("id", "is", null);
if (delErr) throw delErr;
for (const { sections, ...c } of chapters) {
  const { data: ch, error } = await sb.from("handbook_chapters").insert({ ...c, visibility: "all", status: "published", published_at: now }).select("id").single();
  if (error) throw new Error(`${c.slug}: ${error.message}`);
  const { error: sErr } = await sb.from("handbook_sections").insert(sections.map((s) => ({ ...s, chapter_id: ch.id, visibility: "all", status: "published", published_at: now })));
  console.log(sErr ? `✗ ${c.slug}: ${sErr.message}` : `✓ ${c.slug} (${sections.length})`);
}
