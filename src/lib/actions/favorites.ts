"use server";
import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function toggleFavorite(kind: "venue" | "sport" | "media_asset", targetId: string, on: boolean) {
  const me = await getProfile();
  if (!me || me.status !== "approved" || !["venue", "sport", "media_asset"].includes(kind) || !/^[0-9a-f-]{36}$/.test(targetId)) return { ok: false };
  const supabase = await createClient();
  const { error } = on
    ? await supabase.from("favorites").upsert({ user_id: me.id, kind, target_id: targetId })
    : await supabase.from("favorites").delete().eq("user_id", me.id).eq("kind", kind).eq("target_id", targetId);
  revalidatePath("/profile");
  return { ok: !error };
}

export async function recordPageView(path: string) {
  const supabase = await createClient();
  await supabase.rpc("record_page_view", { p_path: path.slice(0, 150) });
}
