"use server";
import { createClient } from "@/lib/supabase/server";

export async function markAllNotificationsRead() {
  const supabase = await createClient();
  await supabase.rpc("mark_notifications_read");
}
