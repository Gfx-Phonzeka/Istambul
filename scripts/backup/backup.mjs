// HB Portal · safety copy of one portal's database content (and, optionally, its stored files).
//
// Usage (from the project folder):
//   node scripts/backup/backup.mjs lima            → copy of Lima 2027
//   node scripts/backup/backup.mjs istanbul        → copy of Istanbul 2027
//   node scripts/backup/backup.mjs lima --files    → also downloads the stored files (photos, PDFs, videos: can be large)
//   BACKUP_DIR=/some/private/folder node scripts/backup/backup.mjs lima
//
// Needs the private files that are NOT in git: .env.local (Istanbul) or .env.lima.local (Lima), and
// supabase/seed/demo-accounts.local.sql or lima-demo-accounts.local.sql (admin account used to read the data).
// Output goes OUTSIDE the project (default: ~/HB-backups/<portal>-<date-time>/) because it holds personal data.
// NEVER put a backup inside the project folder or on GitHub.
//
// What it saves: every table the administrator can read, as JSON (one file per table), plus the list of stored files.
// What it cannot save: login passwords (kept by Supabase Auth). Accounts would have to be re-invited after a restore.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const portal = process.argv[2];
const withFiles = process.argv.includes("--files");
const CFG = {
  istanbul: { env: ".env.local", seed: "supabase/seed/demo-accounts.local.sql", admin: "admin@demo.istanbul2027.example" },
  lima: { env: ".env.lima.local", seed: "supabase/seed/lima-demo-accounts.local.sql", admin: "admin@demo.lima2027.example" },
}[portal];
if (!CFG) { console.error("Indique o portal: lima ou istanbul"); process.exit(1); }

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const env = Object.fromEntries(fs.readFileSync(path.join(root, CFG.env), "utf8").split("\n")
  .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)).filter(Boolean).map((m) => [m[1], m[2].replace(/^["']|["']$/g, "")]));
const adminLine = fs.readFileSync(path.join(root, CFG.seed), "utf8").split("\n").find((l) => l.startsWith("-- Administrador"));
const password = adminLine?.split("|")[2]?.trim();
if (!env.NEXT_PUBLIC_SUPABASE_URL || !password) { console.error("Faltam os ficheiros privados (.env / contas demo)."); process.exit(1); }

const TABLES = ["profiles", "settings", "clusters", "sports", "venues", "venue_sports", "venue_files", "camera_plans", "cameras",
  "camera_drawings", "schedule_sessions", "calendar_rows", "broadcast_feeds", "distribution_channels", "tech_parameters", "channel_slots",
  "handbook_chapters", "handbook_sections", "guide_chapters", "guide_sections", "guide_notes", "announcements", "faq_categories", "faqs",
  "glossary_terms", "contact_areas", "contacts", "legal_pages", "info_blocks", "deadlines", "media_assets", "media_versions",
  "briefing_videos", "briefing_views", "media_downloads", "material_terms_acceptances", "favorites", "notifications", "daily_reports",
  "pqc_reports", "service_requests", "request_events", "request_notes", "email_outbox", "activity_log", "page_views"];
const BUCKETS = ["briefings", "camera-drawings", "camera-exports", "content-media", "handbook-pdf", "media-files", "media-previews", "team-media", "venues"];

const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
const out = path.join(process.env.BACKUP_DIR || path.join(os.homedir(), "HB-backups"), `${portal}-${stamp}`);
if (out.startsWith(root + path.sep)) { console.error("A cópia não pode ficar dentro da pasta do projeto."); process.exit(1); }
fs.mkdirSync(path.join(out, "tables"), { recursive: true });

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { error: authErr } = await sb.auth.signInWithPassword({ email: CFG.admin, password });
if (authErr) { console.error("Não consegui entrar com a conta de administrador:", authErr.message); process.exit(1); }

const summary = { portal, date: new Date().toISOString(), tables: {}, buckets: {} };
for (const t of TABLES) {
  const rows = [];
  let error = null;
  for (let from = 0; ; from += 1000) {
    const { data, error: e } = await sb.from(t).select("*").range(from, from + 999);
    if (e) { error = e.message; break; }
    rows.push(...data);
    if (data.length < 1000) break;
  }
  if (error) { summary.tables[t] = `erro: ${error}`; continue; }
  fs.writeFileSync(path.join(out, "tables", `${t}.json`), JSON.stringify(rows));
  summary.tables[t] = rows.length;
}

async function listAll(bucket, prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await sb.storage.from(bucket).list(prefix, { limit: 1000, offset });
    if (error || !data) break;
    for (const f of data) {
      const p = prefix ? `${prefix}/${f.name}` : f.name;
      if (f.id === null) files.push(...(await listAll(bucket, p))); // folder
      else files.push({ path: p, size: f.metadata?.size ?? null });
    }
    if (data.length < 1000) break;
  }
  return files;
}
for (const b of BUCKETS) {
  const files = await listAll(b);
  summary.buckets[b] = files.length;
  fs.writeFileSync(path.join(out, `files-${b}.json`), JSON.stringify(files, null, 1));
  if (withFiles) {
    for (const f of files) {
      const { data } = await sb.storage.from(b).download(f.path);
      if (!data) continue;
      const dest = path.join(out, "files", b, f.path);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, Buffer.from(await data.arrayBuffer()));
    }
  }
}
fs.writeFileSync(path.join(out, "resumo.json"), JSON.stringify(summary, null, 1));
const ok = Object.values(summary.tables).filter((v) => typeof v === "number").length;
const errs = Object.entries(summary.tables).filter(([, v]) => typeof v !== "number");
console.log(`Cópia de ${portal} guardada em: ${out}`);
console.log(`Tabelas copiadas: ${ok} de ${TABLES.length}${errs.length ? ` (sem acesso: ${errs.map(([t]) => t).join(", ")})` : ""}`);
console.log(`Ficheiros listados: ${Object.values(summary.buckets).reduce((a, b) => a + b, 0)}${withFiles ? " (descarregados)" : " (só a lista; use --files para os descarregar)"}`);
