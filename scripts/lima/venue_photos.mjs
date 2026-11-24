// Lima 2027 · adds venue photos (JPEG files) as the first photo of each venue, signed in as an admin.
// Usage: LIMA_URL=… LIMA_KEY=… ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/lima/venue_photos.mjs <dir> slug=file.jpg …
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const [dir, ...pairs] = process.argv.slice(2);
const sb = createClient(process.env.LIMA_URL, process.env.LIMA_KEY);
const { error: authErr } = await sb.auth.signInWithPassword({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
if (authErr) throw authErr;
const credit = "Foto: Lima 2027 (lima2027.org.pe)";
for (const pair of pairs) {
  const [slug, file] = pair.split("=");
  const { data: v, error } = await sb.from("venues").select("id").eq("slug", slug).single();
  if (error) throw new Error(`${slug}: ${error.message}`);
  const buf = fs.readFileSync(path.join(dir, file));
  const key = `${v.id}/web-${file}`;
  const up = await sb.storage.from("venues").upload(key, buf, { contentType: "image/jpeg", upsert: true });
  if (up.error) throw new Error(`${slug}: ${up.error.message}`);
  await sb.from("venue_files").delete().eq("venue_id", v.id).eq("file_path", key);
  const ins = await sb.from("venue_files").insert({ venue_id: v.id, kind: "photo", position: 0, title_en: credit, title_es: credit, title_pt: credit, file_path: key, file_name: file, file_size: buf.length, mime: "image/jpeg" });
  console.log(ins.error ? `✗ ${slug}: ${ins.error.message}` : `✓ ${slug}`);
}
