"use server";
import { after } from "next/server";
import { flushEmails } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { getProfile, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; error?: string };
const UUID = /^[0-9a-f-]{36}$/;
const safePath = (p: string) => typeof p === "string" && p.length < 500 && !p.includes("..") && !p.startsWith("/");

export interface VersionInput {
  file_path: string; file_name: string; file_size: number; mime: string;
  format?: string; codec?: string; resolution?: string; frame_rate?: string; duration_seconds?: string; notes?: string;
}

export async function addMediaVersion(assetId: string, v: VersionInput): Promise<Result> {
  await requireStaff();
  if (!UUID.test(assetId) || !safePath(v.file_path)) return { ok: false, error: "invalid" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_media_version", {
    p_asset: assetId,
    p: { ...v, file_size: String(v.file_size ?? ""), duration_seconds: v.duration_seconds ?? "" },
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  after(flushEmails);
  return { ok: true };
}

export async function updateVersionSpecs(versionId: string, specs: Partial<VersionInput>): Promise<Result> {
  await requireStaff();
  if (!UUID.test(versionId)) return { ok: false, error: "invalid" };
  const supabase = await createClient();
  const clean = (x?: string) => (x ?? "").trim().slice(0, 120) || null;
  const dur = (specs.duration_seconds ?? "").trim();
  const { error } = await supabase.from("media_versions").update({
    format: clean(specs.format), codec: clean(specs.codec), resolution: clean(specs.resolution),
    frame_rate: clean(specs.frame_rate), notes: (specs.notes ?? "").trim().slice(0, 1000) || null,
    duration_seconds: dur && Number.isFinite(Number(dur)) ? Number(dur) : null,
  }).eq("id", versionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setMediaPreview(assetId: string, path: string | null, kind: "image" | "video" | null): Promise<Result> {
  await requireStaff();
  if (!UUID.test(assetId) || (path && !safePath(path))) return { ok: false, error: "invalid" };
  const supabase = await createClient();
  const { data: old } = await supabase.from("media_assets").select("preview_path").eq("id", assetId).single();
  const { error } = await supabase.from("media_assets").update({ preview_path: path, preview_kind: path ? kind : null }).eq("id", assetId);
  if (error) return { ok: false, error: error.message };
  if (old?.preview_path && old.preview_path !== path && !old.preview_path.startsWith("seed/")) {
    await supabase.storage.from("media-previews").remove([old.preview_path]);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

const BRIEFING_FILE_COLUMNS = { video: "video_path", poster: "poster_path", subtitles_en: "subtitles_en_path", subtitles_tr: "subtitles_tr_path" } as const;
export type BriefingFileKind = keyof typeof BRIEFING_FILE_COLUMNS;

export async function setBriefingFile(
  videoId: string, kind: BriefingFileKind, path: string | null, meta?: { mime?: string; duration?: number },
): Promise<Result> {
  await requireStaff();
  const col = BRIEFING_FILE_COLUMNS[kind];
  if (!UUID.test(videoId) || !col || (path && !safePath(path))) return { ok: false, error: "invalid" };
  const supabase = await createClient();
  const { data: old } = await supabase.from("briefing_videos").select(col).eq("id", videoId).single();
  const update: Record<string, unknown> = { [col]: path };
  if (kind === "video") {
    update.video_mime = path ? meta?.mime ?? null : null;
    if (meta?.duration) update.duration_seconds = Math.round(meta.duration);
  }
  const { data: cur } = await supabase.from("briefing_videos").select("status").eq("id", videoId).single();
  if (cur?.status === "published" && (kind === "video" || kind.startsWith("subtitles"))) update.content_updated_at = new Date().toISOString();
  const { error } = await supabase.from("briefing_videos").update(update).eq("id", videoId);
  if (error) return { ok: false, error: error.message };
  const oldPath = (old as Record<string, string | null> | null)?.[col];
  if (oldPath && oldPath !== path && !oldPath.startsWith("seed/")) await supabase.storage.from("briefings").remove([oldPath]);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function acceptMaterialTerms(): Promise<Result> {
  const p = await getProfile();
  if (!p || p.status !== "approved") return { ok: false, error: "forbidden" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_material_terms");
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function setBriefingWatched(videoId: string, watched: boolean): Promise<Result> {
  const p = await getProfile();
  if (!p || p.status !== "approved" || !UUID.test(videoId)) return { ok: false, error: "forbidden" };
  const supabase = await createClient();
  const { error } = watched
    ? await supabase.from("briefing_views").upsert({ user_id: p.id, video_id: videoId, watched_at: new Date().toISOString() })
    : await supabase.from("briefing_views").delete().eq("user_id", p.id).eq("video_id", videoId);
  if (!error) revalidatePath("/briefings", "layout");
  return error ? { ok: false, error: error.message } : { ok: true };
}
