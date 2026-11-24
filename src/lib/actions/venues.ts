"use server";
import { after } from "next/server";
import { flushEmails } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LOCALES } from "@/lib/i18n";

type Result = { ok: boolean; error?: string };
const UUID = /^[0-9a-f-]{36}$/;
const safePath = (p: string) => typeof p === "string" && p.length < 500 && !p.includes("..") && !p.startsWith("/");

export interface CameraInput {
  id?: string; number: string; type: string; lens: string;
  /** function_<locale> for each portal language (Istanbul: en/tr · Lima: es/en/pt) */
  [fn: `function_${string}`]: string;
  level: string; is_special: boolean; x: number; y: number; angle: string;
}

export async function saveCameras(planId: string, cameras: CameraInput[]): Promise<Result & { cameras?: Record<string, unknown>[] }> {
  await requireStaff();
  if (!UUID.test(planId)) return { ok: false, error: "invalid" };
  if (cameras.some((c) => !c.number.trim())) return { ok: false, error: "number_required" };
  const numbers = cameras.map((c) => c.number.trim().toLowerCase());
  if (new Set(numbers).size !== numbers.length) return { ok: false, error: "duplicate_number" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_cameras", {
    p_plan: planId,
    p_cameras: cameras.map((c) => ({ ...c, id: c.id && UUID.test(c.id) ? c.id : "", number: c.number.trim(), angle: c.angle === "" ? "" : String(Number(c.angle)) })),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  after(flushEmails);
  const { data } = await supabase.from("cameras").select("*").eq("plan_id", planId).order("position");
  return { ok: true, cameras: data ?? [] };
}

export async function getPlanCameras(planId: string) {
  await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase.from("cameras").select("*").eq("plan_id", planId).order("position");
  return data ?? [];
}

export async function signDrawingPath(path: string): Promise<string | null> {
  await requireStaff();
  if (!safePath(path)) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from("camera-drawings").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function addCameraDrawing(planId: string, d: { file_path: string; file_name: string; file_size: number; notes: string; numbering_checked: boolean }): Promise<Result> {
  await requireStaff();
  if (!UUID.test(planId) || !safePath(d.file_path)) return { ok: false, error: "invalid" };
  if (!d.numbering_checked) return { ok: false, error: "numbering_not_checked" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_camera_drawing", { p_plan: planId, p: { ...d, file_size: String(d.file_size) } });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  after(flushEmails);
  return { ok: true };
}

export async function discardUploadedDrawing(path: string): Promise<void> {
  await requireStaff();
  if (!safePath(path)) return;
  const supabase = await createClient();
  await supabase.storage.from("camera-drawings").remove([path]);
}

export async function addVenueFile(venueId: string, kind: "photo" | "document", f: { path: string; name: string; size: number; mime: string }): Promise<Result> {
  await requireStaff();
  if (!UUID.test(venueId) || !safePath(f.path) || !["photo", "document"].includes(kind)) return { ok: false, error: "invalid" };
  const supabase = await createClient();
  const { count } = await supabase.from("venue_files").select("id", { count: "exact", head: true }).eq("venue_id", venueId).eq("kind", kind);
  const title = f.name.replace(/\.[^.]+$/, "");
  const { error } = await supabase.from("venue_files").insert({
    venue_id: venueId, kind, position: (count ?? 0) + 1, title_en: title, file_path: f.path, file_name: f.name, file_size: f.size, mime: f.mime,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateVenueFile(id: string, titles: Record<string, string>): Promise<Result> {
  await requireStaff();
  if (!UUID.test(id)) return { ok: false, error: "invalid" };
  const supabase = await createClient();
  const row = Object.fromEntries(LOCALES.map((l) => [`title_${l}`, String(titles?.[l] ?? "").trim().slice(0, 200) || null]));
  const { error } = await supabase.from("venue_files").update(row).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteVenueFile(id: string): Promise<Result> {
  await requireStaff();
  if (!UUID.test(id)) return { ok: false, error: "invalid" };
  const supabase = await createClient();
  const { data } = await supabase.from("venue_files").select("file_path").eq("id", id).single();
  const { error } = await supabase.from("venue_files").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  if (data?.file_path && !data.file_path.startsWith("seed/")) await supabase.storage.from("venues").remove([data.file_path]);
  revalidatePath("/", "layout");
  return { ok: true };
}
