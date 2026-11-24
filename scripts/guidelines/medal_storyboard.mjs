// Medal ceremony storyboard: uploads the 19 frame illustrations and puts them, with the captions of the existing
// shot table (each reading language), at the top of the guidelines section medal-ceremonies/storyboard.
// Usage: SB_URL=… SB_KEY=… ADMIN_EMAIL=… ADMIN_PASSWORD=… LANGS=es,pt node scripts/guidelines/medal_storyboard.mjs <png dir>
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const dir = process.argv[2];
const langs = process.env.LANGS.split(",");
const sb = createClient(process.env.SB_URL, process.env.SB_KEY);
const { error: authErr } = await sb.auth.signInWithPassword({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
if (authErr) throw authErr;

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".png")).sort();
for (const f of files) {
  const { error } = await sb.storage.from("content-media").upload(`guidelines/medal-storyboard/${f}`, fs.readFileSync(path.join(dir, f)), { contentType: "image/png", upsert: true });
  if (error) throw new Error(`${f}: ${error.message}`);
}
console.log("uploaded", files.length);

const LIST = { es: "Lista de planos", pt: "Lista de planos", en: "Shot list", tr: "Çekim listesi" };
const { data: ch } = await sb.from("guide_chapters").select("id").eq("slug", "medal-ceremonies").single();
const { data: sec, error } = await sb.from("guide_sections").select("*").eq("chapter_id", ch.id).eq("slug", "storyboard").single();
if (error) throw error;
const strip = (h) => h.replace(/<[^>]+>/g, "").trim();
const patch = { content_updated_at: new Date().toISOString() };
for (const l of langs) {
  let body = sec[`body_${l}`] ?? "";
  body = body.replace(/^<table><tbody><tr><td><img src="\/media\/guidelines\/medal-storyboard[\s\S]*?<\/table>\n<h3>[^<]*<\/h3>\n/, ""); // a re-run replaces the grid
  const rows = [...body.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((m) => [...m[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => strip(c[1])));
  const [head, ...data] = rows;
  if (data.length !== files.length) throw new Error(`${l}: ${data.length} rows for ${files.length} frames`);
  const cells = data.map((r, i) => `<td><img src="/media/guidelines/medal-storyboard/${files[i]}" alt="${r[0]}. ${r[1]} · ${r[2]}" width="320"><p><strong>${r[0]} · ${r[1]}</strong><br>${r[2]}: ${r[3]}${r[4] && r[4] !== "—" ? `<br><em>${head[4]}: ${r[4]}</em>` : ""}</p></td>`);
  let grid = "";
  for (let i = 0; i < cells.length; i += 3) grid += `<tr>${cells.slice(i, i + 3).join("")}${"<td></td>".repeat(Math.max(0, i + 3 - cells.length))}</tr>`;
  patch[`body_${l}`] = `<table><tbody>${grid}</tbody></table>\n<h3>${LIST[l]}</h3>\n` + body;
}
const { error: upErr } = await sb.from("guide_sections").update(patch).eq("id", sec.id);
if (upErr) throw upErr;
console.log("updated", langs.join(","));
