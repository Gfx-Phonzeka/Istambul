"use server";
import { revalidatePath } from "next/cache";
import { getProfile, isStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CHANNEL_KINDS, HHMM, type ChannelKind } from "@/lib/channel";
import { LOCALES } from "@/lib/i18n";
import { isDay } from "@/lib/reports";

type Result = { ok: boolean; error?: string; id?: string };
const UUID = /^[0-9a-f-]{36}$/;
const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
const optId = (v: unknown) => (typeof v === "string" && UUID.test(v) ? v : null);

export interface SlotInput {
  id?: string; day: string; start_time: string; end_time: string; kind: string; sport_id: string; venue_id: string;
  titles: Record<string, string>; notes: Record<string, string>;
}

async function staffClient() {
  const me = await getProfile();
  if (!me || me.status !== "approved" || !isStaff(me)) return null;
  return createClient();
}
const done = () => { revalidatePath("/channel"); revalidatePath("/admin/channel"); };

export async function saveChannelSlot(input: SlotInput): Promise<Result> {
  const supabase = await staffClient();
  if (!supabase) return { ok: false, error: "forbidden" };
  if (!isDay(input.day)) return { ok: false, error: "day" };
  if (!HHMM.test(input.start_time) || (input.end_time && !HHMM.test(input.end_time))) return { ok: false, error: "time" };
  if (!CHANNEL_KINDS.includes(input.kind as ChannelKind)) return { ok: false, error: "kind" };
  const row: Record<string, unknown> = {
    day: input.day, start_time: input.start_time, end_time: input.end_time || null, kind: input.kind,
    sport_id: optId(input.sport_id), venue_id: optId(input.venue_id),
  };
  for (const l of LOCALES) {
    row[`title_${l}`] = clip(input.titles?.[l], 200) || null;
    row[`notes_${l}`] = clip(input.notes?.[l], 1000) || null;
  }
  if (!LOCALES.some((l) => row[`title_${l}`]) && !row.sport_id) return { ok: false, error: "title" };
  const { data, error } = input.id && UUID.test(input.id)
    ? await supabase.from("channel_slots").update(row).eq("id", input.id).select("id").single()
    : await supabase.from("channel_slots").insert(row).select("id").single();
  if (error) return { ok: false, error: "generic" };
  done();
  return { ok: true, id: data.id };
}

export async function deleteChannelSlot(id: string): Promise<Result> {
  const supabase = await staffClient();
  if (!supabase || !UUID.test(id)) return { ok: false, error: "forbidden" };
  const { error } = await supabase.from("channel_slots").delete().eq("id", id);
  if (error) return { ok: false, error: "generic" };
  done();
  return { ok: true };
}

/** Publishes (or takes back to draft) every slot of a day. */
export async function publishChannelDay(day: string, publish: boolean): Promise<Result> {
  const supabase = await staffClient();
  if (!supabase || !isDay(day)) return { ok: false, error: "forbidden" };
  const { error } = await supabase.from("channel_slots").update({ status: publish ? "published" : "draft" }).eq("day", day);
  if (error) return { ok: false, error: "generic" };
  done();
  return { ok: true };
}

/** Copies a day's grid onto another day, as a draft (the target day's slots stay). */
export async function copyChannelDay(from: string, to: string): Promise<Result> {
  const supabase = await staffClient();
  if (!supabase || !isDay(from) || !isDay(to) || from === to) return { ok: false, error: "day" };
  const { data, error } = await supabase.from("channel_slots").select("*").eq("day", from);
  if (error) return { ok: false, error: "generic" };
  if (!data?.length) return { ok: false, error: "empty" };
  const rows = data.map(({ id: _id, created_at: _c, updated_at: _u, updated_by: _b, published_at: _p, ...r }) => ({ ...r, day: to, status: "draft" }));
  const { error: insErr } = await supabase.from("channel_slots").insert(rows);
  if (insErr) return { ok: false, error: "generic" };
  done();
  return { ok: true };
}
