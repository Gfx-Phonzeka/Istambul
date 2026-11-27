"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { COLLAB_TYPES, EXTRA_FIELDS, SHEET_FIELDS, TEAM_KINDS } from "@/lib/crew";
import type { FormState } from "./auth";

const clean = (v: FormDataEntryValue | null, max = 200) => String(v ?? "").trim().slice(0, max) || null;

/** Personal sheet: the person themself, or Crew Ops coordination for someone else (profile_id in the form). */
export async function saveCrewSheet(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "error" };
  const target = clean(form.get("profile_id")) ?? user.id;
  const row: Record<string, unknown> = { profile_id: target };
  for (const f of SHEET_FIELDS) {
    const v = clean(form.get(f.key));
    if (v && "options" in f && !(f.options as readonly string[]).includes(v)) return { error: "error", field: f.key };
    if (v && f.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(v)) return { error: "error", field: f.key };
    row[f.key] = v;
  }
  if (EXTRA_FIELDS.length) row.extra = Object.fromEntries(EXTRA_FIELDS.map((f) => [f.key, clean(form.get(`extra_${f.key}`)) ?? ""]));
  const photo = clean(form.get("photo_path"), 300);
  if (photo) {
    if (!photo.startsWith(`${target}/`) || photo.includes("..")) return { error: "error" };
    row.photo_path = photo;
  }
  const { error } = await supabase.from("crew_records").upsert(row, { onConflict: "profile_id" });
  if (error) return { error: "error" };
  revalidatePath("/team/sheet");
  revalidatePath("/team/crew", "layout");
  return { ok: true };
}

async function coord() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_crew_coord");
  return data === true ? supabase : null;
}

export async function saveParticipation(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await coord();
  if (!supabase) return { error: "error" };
  const profile_id = clean(form.get("profile_id"));
  if (!profile_id) return { error: "error" };
  const type = clean(form.get("collaborator_type"));
  if (type && !(COLLAB_TYPES as readonly string[]).includes(type)) return { error: "error" };
  const { error } = await supabase.from("crew_participation").upsert({
    profile_id, function_id: clean(form.get("function_id")), position_label: clean(form.get("position_label")),
    collaborator_type: type, company: type === "group_company" ? clean(form.get("company")) : null, notes: clean(form.get("notes"), 2000),
    in_mediagest: form.get("in_mediagest") === "on",
  }, { onConflict: "profile_id" });
  if (error) return { error: "error" };
  const teams = form.getAll("teams").map(String);
  await supabase.from("crew_team_members").delete().eq("profile_id", profile_id);
  if (teams.length) {
    const { error: tErr } = await supabase.from("crew_team_members").insert(teams.map((team_id) => ({ team_id, profile_id })));
    if (tErr) return { error: "error" };
  }
  revalidatePath("/team/crew", "layout");
  return { ok: true };
}

export async function addTeam(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await coord();
  const name = clean(form.get("name"), 120);
  const kind = clean(form.get("kind")) ?? "operational";
  if (!supabase || !name || !(TEAM_KINDS as readonly string[]).includes(kind)) return { error: "error" };
  const { error } = await supabase.from("crew_teams").insert({ name, kind, notes: clean(form.get("notes"), 500) });
  if (error) return { error: "error" };
  revalidatePath("/team/crew", "layout");
  return { ok: true };
}

export async function deleteTeam(id: string) {
  const supabase = await coord();
  if (!supabase) return;
  await supabase.from("crew_teams").delete().eq("id", id);
  revalidatePath("/team/crew", "layout");
}

export async function addFunction(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await coord();
  const area = clean(form.get("area"), 80);
  const name_en = clean(form.get("name_en"), 120);
  if (!supabase || !area || !name_en) return { error: "error" };
  const { data: last } = await supabase.from("crew_functions").select("position").order("position", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("crew_functions").insert({
    area, name_en, name_es: clean(form.get("name_es"), 120), name_pt: clean(form.get("name_pt"), 120), position: (last?.position ?? 0) + 1,
  });
  if (error) return { error: "error" };
  revalidatePath("/team/crew", "layout");
  return { ok: true };
}

export async function toggleFunction(id: string, active: boolean) {
  const supabase = await coord();
  if (!supabase) return;
  await supabase.from("crew_functions").update({ active }).eq("id", id);
  revalidatePath("/team/crew", "layout");
}

/** Admin only (database rule): who has Crew Ops coordination or finance access. */
export async function setCrewAccess(profileId: string, level: "coordination" | "finance" | "none") {
  const supabase = await createClient();
  if (level === "none") await supabase.from("crew_staff").delete().eq("profile_id", profileId);
  else await supabase.from("crew_staff").upsert({ profile_id: profileId, level }, { onConflict: "profile_id" });
  revalidatePath("/team/crew", "layout");
}

// ---------- Phase B: units, daily plan, assignments, per-person exceptions ----------
const DAY_TYPES_OK = ["travel", "setup", "rehearsal", "check", "live", "off", "dismantle", "office"];
const isDate = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
const UUID_RE = /^[0-9a-f-]{36}$/;
const uuidOrNull = (v: FormDataEntryValue | null) => { const s = String(v ?? ""); return UUID_RE.test(s) ? s : null; };
function range(from: string, to: string) {
  const out: string[] = []; const d = new Date(`${from}T12:00:00Z`); const end = new Date(`${to}T12:00:00Z`);
  for (let i = 0; d <= end && i < 120; i++) { out.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 1); }
  return out;
}

export async function addUnit(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await coord();
  const code = clean(form.get("code"), 40);
  if (!supabase || !code) return { error: "error" };
  const size = clean(form.get("size")); const mode = clean(form.get("mode"));
  const cams = Number.parseInt(String(form.get("cameras") ?? ""), 10);
  const { error } = await supabase.from("crew_units").insert({
    code, name: clean(form.get("name"), 120), size: ["XL", "L", "M", "S"].includes(size ?? "") ? size : null,
    mode: ["OB", "REMI", "REMOTE", "FLYPACK"].includes(mode ?? "") ? mode : null, cameras: Number.isFinite(cams) ? cams : null,
    notes: clean(form.get("notes"), 1000),
  });
  if (error) return { error: "error" };
  revalidatePath("/team/crew", "layout");
  return { ok: true };
}

export async function deleteUnit(id: string) {
  const supabase = await coord();
  if (!supabase || !UUID_RE.test(id)) return;
  await supabase.from("crew_units").delete().eq("id", id);
  revalidatePath("/team/crew", "layout");
}

/** Sets (or clears) the unit's plan for every day of a period. */
export async function applyUnitDays(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await coord();
  const unit_id = uuidOrNull(form.get("unit_id"));
  const from = clean(form.get("from")); const to = clean(form.get("to")) ?? from;
  const type = clean(form.get("day_type"));
  if (!supabase || !unit_id || !isDate(from) || !isDate(to) || to < from) return { error: "error" };
  const days = range(from, to);
  if (type === "clear") {
    const { error } = await supabase.from("crew_unit_days").delete().eq("unit_id", unit_id).gte("day", from).lte("day", to);
    if (error) return { error: "error" };
  } else {
    if (!DAY_TYPES_OK.includes(type ?? "")) return { error: "error" };
    const rows = days.map((day) => ({
      unit_id, day, day_type: type, venue_id: uuidOrNull(form.get("venue_id")), sport_id: uuidOrNull(form.get("sport_id")),
      call_time: clean(form.get("call_time"), 10), notes: clean(form.get("notes"), 300),
    }));
    const { error } = await supabase.from("crew_unit_days").upsert(rows, { onConflict: "unit_id,day" });
    if (error) return { error: "error" };
  }
  revalidatePath("/team", "layout");
  return { ok: true };
}

export async function addAssignment(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await coord();
  const team_id = uuidOrNull(form.get("team_id")); const unit_id = uuidOrNull(form.get("unit_id"));
  const start_date = clean(form.get("from")); const end_date = clean(form.get("to"));
  if (!supabase || !team_id || !unit_id || !isDate(start_date) || !isDate(end_date) || end_date < start_date) return { error: "error" };
  const { error } = await supabase.from("crew_assignments").insert({ team_id, unit_id, start_date, end_date, notes: clean(form.get("notes"), 300) });
  if (error) return { error: "error" };
  revalidatePath("/team", "layout");
  return { ok: true };
}

export async function deleteAssignment(id: string) {
  const supabase = await coord();
  if (!supabase || !UUID_RE.test(id)) return;
  await supabase.from("crew_assignments").delete().eq("id", id);
  revalidatePath("/team", "layout");
}

/** Exceptions for one person over a period: a day type, "none" (no work) or "auto" (remove the exception). */
export async function setPersonDays(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await coord();
  const profile_id = uuidOrNull(form.get("profile_id"));
  const from = clean(form.get("from")); const to = clean(form.get("to")) ?? from;
  const type = clean(form.get("day_type"));
  if (!supabase || !profile_id || !isDate(from) || !isDate(to) || to < from) return { error: "error" };
  if (type === "auto") {
    const { error } = await supabase.from("crew_person_days").delete().eq("profile_id", profile_id).gte("day", from).lte("day", to);
    if (error) return { error: "error" };
  } else {
    if (![...DAY_TYPES_OK, "standby", "none"].includes(type ?? "")) return { error: "error" };
    const rows = range(from, to).map((day) => ({ profile_id, day, day_type: type, unit_id: uuidOrNull(form.get("unit_id")), notes: clean(form.get("notes"), 300) }));
    const { error } = await supabase.from("crew_person_days").upsert(rows, { onConflict: "profile_id,day" });
    if (error) return { error: "error" };
  }
  revalidatePath("/team", "layout");
  return { ok: true };
}

// ---------- Phase C: travel, hotels, stays ----------
const tm = (v: FormDataEntryValue | null) => { const s = String(v ?? "").trim(); return /^\d{2}:\d{2}$/.test(s) ? s : null; };
const dt = (v: FormDataEntryValue | null) => { const s = String(v ?? "").trim(); return isDate(s) ? s : null; };

export async function addTravel(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await coord();
  const profile_id = uuidOrNull(form.get("profile_id")); const depart_date = dt(form.get("depart_date"));
  const direction = clean(form.get("direction")) ?? "outbound"; const mode = clean(form.get("mode")) ?? "flight";
  if (!supabase || !profile_id || !depart_date || !["outbound", "return", "internal"].includes(direction) || !["flight", "train", "car", "bus", "other"].includes(mode)) return { error: "error" };
  const { error } = await supabase.from("crew_travels").insert({
    profile_id, direction, mode, carrier: clean(form.get("carrier"), 80), number: clean(form.get("number"), 40),
    from_place: clean(form.get("from_place"), 80), to_place: clean(form.get("to_place"), 80),
    depart_date, depart_time: tm(form.get("depart_time")), arrive_date: dt(form.get("arrive_date")) ?? depart_date, arrive_time: tm(form.get("arrive_time")),
    booking_ref: clean(form.get("booking_ref"), 40), transfer_needed: form.get("transfer_needed") === "on",
    extras: clean(form.get("extras"), 300), notes: clean(form.get("notes"), 500),
  });
  if (error) return { error: "error" };
  revalidatePath("/team", "layout");
  return { ok: true };
}

export async function deleteTravel(id: string) {
  const supabase = await coord();
  if (!supabase || !UUID_RE.test(id)) return;
  await supabase.from("crew_travels").delete().eq("id", id);
  revalidatePath("/team", "layout");
}

export async function addHotel(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await coord();
  const name = clean(form.get("name"), 120);
  if (!supabase || !name) return { error: "error" };
  const { error } = await supabase.from("crew_hotels").insert({
    name, address: clean(form.get("address"), 200), city: clean(form.get("city"), 80), phone: clean(form.get("phone"), 40), notes: clean(form.get("notes"), 500),
  });
  if (error) return { error: "error" };
  revalidatePath("/team", "layout");
  return { ok: true };
}

export async function deleteHotel(id: string) {
  const supabase = await coord();
  if (!supabase || !UUID_RE.test(id)) return;
  await supabase.from("crew_hotels").delete().eq("id", id);
  revalidatePath("/team", "layout");
}

export async function addStay(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await coord();
  const profile_id = uuidOrNull(form.get("profile_id")); const hotel_id = uuidOrNull(form.get("hotel_id"));
  const check_in = dt(form.get("check_in")); const check_out = dt(form.get("check_out"));
  const room_type = clean(form.get("room_type")) ?? "single";
  if (!supabase || !profile_id || !hotel_id || !check_in || !check_out || check_out <= check_in || !["single", "double", "twin", "triple", "other"].includes(room_type)) return { error: "error" };
  const { error } = await supabase.from("crew_stays").insert({ profile_id, hotel_id, check_in, check_out, room_type, room_code: clean(form.get("room_code"), 20), notes: clean(form.get("notes"), 300) });
  if (error) return { error: "error" };
  revalidatePath("/team", "layout");
  return { ok: true };
}

export async function deleteStay(id: string) {
  const supabase = await coord();
  if (!supabase || !UUID_RE.test(id)) return;
  await supabase.from("crew_stays").delete().eq("id", id);
  revalidatePath("/team", "layout");
}

// ---------- Phase D: rates and costs (finance only; the database enforces it too) ----------
async function finance() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_crew_finance");
  return data === true ? supabase : null;
}
const money = (v: FormDataEntryValue | null) => { const n = Number(String(v ?? "").replace(",", ".").trim()); return String(v ?? "").trim() !== "" && Number.isFinite(n) ? Math.round(n * 100) / 100 : null; };

export async function saveFinance(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await finance();
  const profile_id = uuidOrNull(form.get("profile_id"));
  const basis = clean(form.get("basis")) ?? "daily"; const zone = clean(form.get("per_diem_zone")) ?? "intl";
  if (!supabase || !profile_id || !["daily", "forfait", "per_diem_only", "company"].includes(basis) || !["intl", "es", "pt", "none", "custom"].includes(zone)) return { error: "error" };
  const extras = Number.parseInt(String(form.get("extra_meals") ?? "0"), 10);
  const { error } = await supabase.from("crew_finance").upsert({
    profile_id, basis, daily_rate: money(form.get("daily_rate")), monthly_rate: money(form.get("monthly_rate")), off_half: form.get("off_half") === "on",
    per_diem_zone: zone, per_diem_custom: money(form.get("per_diem_custom")), breakfast: form.get("breakfast") === "on",
    extra_meals: Number.isFinite(extras) && extras >= 0 ? extras : 0, adjustment: money(form.get("adjustment")) ?? 0, notes: clean(form.get("notes"), 1000),
  }, { onConflict: "profile_id" });
  if (error) return { error: "error" };
  revalidatePath("/team/crew", "layout");
  return { ok: true };
}

export async function savePerDiem(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await finance();
  if (!supabase) return { error: "error" };
  const value = Object.fromEntries(["intl", "es", "pt"].map((z) => [z, { meal: money(form.get(`${z}_meal`)), breakfast: money(form.get(`${z}_breakfast`)), extra: money(form.get(`${z}_extra`)) }]));
  const { error } = await supabase.from("crew_settings").upsert({ key: "per_diem", value }, { onConflict: "key" });
  if (error) return { error: "error" };
  revalidatePath("/team/crew", "layout");
  return { ok: true };
}

export async function addService(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await finance();
  const company = clean(form.get("company"), 120); const amount = money(form.get("amount"));
  if (!supabase || !company || amount == null) return { error: "error" };
  const { error } = await supabase.from("crew_services").insert({ company, description: clean(form.get("description"), 300), amount, notes: clean(form.get("notes"), 500) });
  if (error) return { error: "error" };
  revalidatePath("/team/crew", "layout");
  return { ok: true };
}

export async function deleteService(id: string) {
  const supabase = await finance();
  if (!supabase || !UUID_RE.test(id)) return;
  await supabase.from("crew_services").delete().eq("id", id);
  revalidatePath("/team/crew", "layout");
}

export async function addOtherCost(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await finance();
  const amount = money(form.get("amount")); const category = clean(form.get("category")) ?? "other";
  if (!supabase || amount == null || !["transfer", "car", "shipping", "other"].includes(category)) return { error: "error" };
  const { error } = await supabase.from("crew_other_costs").insert({ category, profile_id: uuidOrNull(form.get("profile_id")), description: clean(form.get("description"), 300), amount });
  if (error) return { error: "error" };
  revalidatePath("/team/crew", "layout");
  return { ok: true };
}

export async function deleteOtherCost(id: string) {
  const supabase = await finance();
  if (!supabase || !UUID_RE.test(id)) return;
  await supabase.from("crew_other_costs").delete().eq("id", id);
  revalidatePath("/team/crew", "layout");
}

export async function setTravelCost(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await finance();
  const travel_id = uuidOrNull(form.get("travel_id")); const amount = money(form.get("amount"));
  if (!supabase || !travel_id) return { error: "error" };
  const { error } = amount == null
    ? await supabase.from("crew_travel_costs").delete().eq("travel_id", travel_id)
    : await supabase.from("crew_travel_costs").upsert({ travel_id, amount }, { onConflict: "travel_id" });
  if (error) return { error: "error" };
  revalidatePath("/team/crew", "layout");
  return { ok: true };
}

export async function setHotelRate(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await finance();
  const hotel_id = uuidOrNull(form.get("hotel_id")); const room_type = clean(form.get("room_type")) ?? ""; const night_rate = money(form.get("night_rate"));
  if (!supabase || !hotel_id || !["single", "double", "twin", "triple", "other"].includes(room_type)) return { error: "error" };
  const { error } = night_rate == null
    ? await supabase.from("crew_hotel_rates").delete().eq("hotel_id", hotel_id).eq("room_type", room_type)
    : await supabase.from("crew_hotel_rates").upsert({ hotel_id, room_type, night_rate }, { onConflict: "hotel_id,room_type" });
  if (error) return { error: "error" };
  revalidatePath("/team/crew", "layout");
  return { ok: true };
}

// ---------- Faster data entry ----------

/** Deletes a function; if someone already has it, it is only switched off (so their data is kept). */
export async function deleteFunction(id: string) {
  const supabase = await coord();
  if (!supabase || !UUID_RE.test(id)) return;
  const { count } = await supabase.from("crew_participation").select("profile_id", { count: "exact", head: true }).eq("function_id", id);
  if (count) await supabase.from("crew_functions").update({ active: false }).eq("id", id);
  else await supabase.from("crew_functions").delete().eq("id", id);
  revalidatePath("/team/crew", "layout");
}

const shiftDay = (d: string, n: number) => { const x = new Date(`${d}T12:00:00Z`); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };

/** Builds a unit's plan from the competition calendar: match days (MD) of the chosen sport/venue,
 *  N set-up days and rehearsal days before MD1, dismantling after the last MD, and the gaps as days off. */
export async function generateFromCalendar(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await coord();
  const unit_id = uuidOrNull(form.get("unit_id")); const row_id = uuidOrNull(form.get("calendar_row"));
  const n = (k: string, max = 15) => { const v = Number.parseInt(String(form.get(k) ?? "0"), 10); return Number.isFinite(v) && v >= 0 ? Math.min(v, max) : 0; };
  if (!supabase || !unit_id || !row_id) return { error: "error" };
  const { data: row } = await supabase.from("calendar_rows").select("sport_id,venue_id,days").eq("id", row_id).maybeSingle();
  const days = Object.entries((row?.days ?? {}) as Record<string, string>).filter(([, code]) => code !== "C").map(([d, code]) => [d, code] as const).sort();
  if (!row || !days.length) return { error: "error" };
  const call = clean(form.get("call_time"), 10);
  const plan = new Map<string, string>();
  for (const [d, code] of days) plan.set(d, code === "T" ? "check" : "live");
  const first = days[0][0]; const last = days[days.length - 1][0];
  const reh = n("rehearsal_days"); const setup = n("setup_days", 30); const dism = n("dismantle_days");
  for (let i = 1; i <= reh; i++) plan.set(shiftDay(first, -i), "rehearsal");
  for (let i = 1; i <= setup; i++) plan.set(shiftDay(first, -reh - i), "setup");
  for (let i = 1; i <= dism; i++) plan.set(shiftDay(last, i), "dismantle");
  if (form.get("fill_off") === "on") for (const d of range(first, last)) if (!plan.has(d)) plan.set(d, "off");
  const rows = [...plan].map(([day, day_type]) => ({
    unit_id, day, day_type, venue_id: row.venue_id, sport_id: row.sport_id, call_time: day_type === "live" ? call : null, notes: null,
  }));
  const { error } = await supabase.from("crew_unit_days").upsert(rows, { onConflict: "unit_id,day" });
  if (error) return { error: "error" };
  revalidatePath("/team", "layout");
  return { ok: true };
}

/** Same change for several people at once (team, function, type, company, Mediagest). */
export async function bulkPeople(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await coord();
  const ids = form.getAll("ids").map(String).filter((x) => UUID_RE.test(x)).slice(0, 500);
  const op = clean(form.get("op")); const value = clean(form.get("value"), 120);
  if (!supabase || !ids.length || !op) return { error: "error" };
  const ensure = async () => {
    const { data } = await supabase.from("crew_participation").select("profile_id").in("profile_id", ids);
    const have = new Set((data ?? []).map((r) => r.profile_id));
    const missing = ids.filter((id) => !have.has(id)).map((profile_id) => ({ profile_id }));
    if (missing.length) await supabase.from("crew_participation").insert(missing);
  };
  let error = null as unknown;
  if (op === "team_add" && value && UUID_RE.test(value)) ({ error } = await supabase.from("crew_team_members").upsert(ids.map((profile_id) => ({ team_id: value, profile_id })), { onConflict: "team_id,profile_id" }));
  else if (op === "team_remove" && value && UUID_RE.test(value)) ({ error } = await supabase.from("crew_team_members").delete().eq("team_id", value).in("profile_id", ids));
  else if (op === "function" && value && UUID_RE.test(value)) { await ensure(); ({ error } = await supabase.from("crew_participation").update({ function_id: value }).in("profile_id", ids)); }
  else if (op === "type" && value && (COLLAB_TYPES as readonly string[]).includes(value)) { await ensure(); ({ error } = await supabase.from("crew_participation").update({ collaborator_type: value }).in("profile_id", ids)); }
  else if (op === "company") { await ensure(); ({ error } = await supabase.from("crew_participation").update({ company: value }).in("profile_id", ids)); }
  else if (op === "mediagest_on" || op === "mediagest_off") { await ensure(); ({ error } = await supabase.from("crew_participation").update({ in_mediagest: op === "mediagest_on" }).in("profile_id", ids)); }
  else return { error: "error" };
  if (error) return { error: "error" };
  revalidatePath("/team/crew", "layout");
  return { ok: true };
}

export type CrewImportResult = { ok: true; created: number; updated: number; problems: { line: number; email: string; problem: string }[] } | { ok: false; error: string };

/** Admin: imports the crew from the Excel template (accounts, function, position, teams, type, company). */
export async function importCrew(form: FormData): Promise<CrewImportResult> {
  const { requireAdmin } = await import("@/lib/auth");
  await requireAdmin();
  const { readCrewFile, norm } = await import("@/lib/crew-import");
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "no_file" };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: "too_large" };
  const read = await readCrewFile(file);
  if ("error" in read) return { ok: false, error: read.error };
  const supabase = await createClient();
  const [{ data: fns }, { data: teams }, { data: venues }] = await Promise.all([
    supabase.from("crew_functions").select("id,name_en,name_es,name_pt"),
    supabase.from("crew_teams").select("id,name"),
    supabase.from("venues").select("*"),
  ]);
  const F = new Map<string, string>();
  for (const f of fns ?? []) for (const n of [f.name_en, f.name_es, f.name_pt]) if (n) F.set(norm(n), f.id);
  const T = new Map((teams ?? []).map((t) => [norm(t.name), t.id]));
  const V = new Map<string, string>();
  for (const v of (venues ?? []) as Record<string, string>[]) for (const [k, val] of Object.entries(v)) if (k.startsWith("title_") && val) V.set(norm(val), v.id);
  const TYPES: Record<string, string> = { freelancer: "freelancer", freelance: "freelancer", employee: "employee", funcionario: "employee", empleado: "employee", groupcompany: "group_company", empresadogrupo: "group_company", funcionariodeempresadogrupo: "group_company" };
  let created = 0, updated = 0;
  const problems: { line: number; email: string; problem: string }[] = [];
  for (const { line, data } of read.rows) {
    const fnId = data.function ? F.get(norm(data.function)) ?? null : null;
    if (data.function && !fnId) problems.push({ line, email: data.email, problem: `function not found: ${data.function}` });
    const venueId = data.venue ? V.get(norm(data.venue)) ?? "" : "";
    const { data: res, error } = await supabase.rpc("admin_import_team_member", {
      p: { email: data.email, first_name: data.first_name, last_name: data.last_name, phone: data.phone, lang: data.lang || "en",
        function: data.function, organization: data.company, venue_id: venueId, sport_id: "" },
    });
    const r = res as { ok: boolean; id?: string; status?: string; error?: string } | null;
    if (error || !r?.ok || !r.id) { problems.push({ line, email: data.email, problem: r?.error ?? "failed" }); continue; }
    if (r.status === "created") created++; else updated++;
    const type = TYPES[norm(data.type)] ?? null;
    await supabase.from("crew_participation").upsert({
      profile_id: r.id, function_id: fnId, position_label: data.position || null, collaborator_type: type,
      company: data.company || null, in_mediagest: /^(yes|sim|si|s|y|1|true)$/i.test(data.mediagest),
    }, { onConflict: "profile_id" });
    for (const name of data.teams.split(/[,;]/).map((x) => x.trim()).filter(Boolean)) {
      let tid = T.get(norm(name));
      if (!tid) {
        const { data: t } = await supabase.from("crew_teams").insert({ name, kind: /^(pu|lpu|ob)\b|t[eé]cnic/i.test(name) ? "technical" : "operational" }).select("id").single();
        if (!t) continue;
        tid = t.id; T.set(norm(name), t.id);
      }
      await supabase.from("crew_team_members").upsert({ team_id: tid, profile_id: r.id }, { onConflict: "team_id,profile_id" });
    }
  }
  revalidatePath("/team/crew", "layout");
  revalidatePath("/admin/team");
  return { ok: true, created, updated, problems };
}
