import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export const NEW_DAYS = 14;

/** Signs many storage paths at once; returns a path → URL map. */
export async function signPaths(supabase: SupabaseClient, bucket: string, paths: (string | null | undefined)[], expires = 3600) {
  const list = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  if (!list.length) return {} as Record<string, string>;
  const { data } = await supabase.storage.from(bucket).createSignedUrls(list, expires);
  return Object.fromEntries((data ?? []).filter((d) => d.signedUrl && d.path).map((d) => [d.path!, d.signedUrl])) as Record<string, string>;
}

/** "new" when published recently, "updated" when its content (e.g. a new file version) changed recently. */
export function freshness(publishedAt: string | null, updatedAt: string | null): "new" | "updated" | null {
  const limit = Date.now() - NEW_DAYS * 86400000;
  const p = publishedAt ? new Date(publishedAt).getTime() : 0;
  const u = updatedAt ? new Date(updatedAt).getTime() : 0;
  if (p > limit) return "new";
  if (u > limit && u - p > 60000) return "updated";
  return null;
}

export function formatDuration(sec: number | null | undefined): string {
  if (sec == null || !Number.isFinite(Number(sec))) return "";
  const s = Math.round(Number(sec));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
}
