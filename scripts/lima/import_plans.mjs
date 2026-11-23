// Lima 2027 · loads the camera plans produced by parse_plans.mjs into Lima's database, signed in as an administrator.
// Replaces the plans of the same sport + venue + title. Plans are published right away.
//
// Usage: LIMA_URL=… LIMA_KEY=… ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/lima/import_plans.mjs plans.json
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const plans = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const sb = createClient(process.env.LIMA_URL, process.env.LIMA_KEY);
const { error: authErr } = await sb.auth.signInWithPassword({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
if (authErr) throw authErr;

const [{ data: sports }, { data: venues }] = await Promise.all([sb.from("sports").select("id,slug"), sb.from("venues").select("id,slug")]);
const S = new Map(sports.map((x) => [x.slug, x.id])), V = new Map(venues.map((x) => [x.slug, x.id]));

for (const p of plans) {
  const sport_id = S.get(p.sport), venue_id = V.get(p.venue);
  if (!sport_id || !venue_id) { console.error("unknown sport/venue", p.sport, p.venue); continue; }
  await sb.from("camera_plans").delete().eq("sport_id", sport_id).eq("venue_id", venue_id).eq("title_es", p.title_es);
  const { data: plan, error } = await sb.from("camera_plans").insert({
    sport_id, venue_id, position: p.position, title_es: p.title_es, title_en: p.title_en, title_pt: p.title_pt,
    field_shape: p.field_shape, visibility: "all", status: "published", published_at: new Date().toISOString(),
  }).select("id").single();
  if (error) { console.error(p.sport, error.message); continue; }
  const { error: cErr } = await sb.from("cameras").insert(p.cameras.map((c) => ({ ...c, plan_id: plan.id })));
  console.log(cErr ? `✗ ${p.sport} ${p.title_es}: ${cErr.message}` : `✓ ${p.sport} · ${p.venue} · ${p.title_es} (${p.cameras.length})`);
}
