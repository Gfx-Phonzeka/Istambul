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
