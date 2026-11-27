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
