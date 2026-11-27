import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EVENT } from "@/lib/event";

export const dynamic = "force-dynamic";

// Subtitles are served from the same origin so the video player can load them.
export async function GET(_: Request, { params }: { params: Promise<{ id: string; lang: string }> }) {
  const me = await getProfile();
  if (!me || me.status !== "approved") return new NextResponse("Forbidden", { status: 403 });
  const { id, lang } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id) || !(EVENT.locales as string[]).includes(lang)) return new NextResponse("Not found", { status: 404 });
  const supabase = await createClient();
  const col = `subtitles_${lang}_path`;
  const { data: v } = await supabase.from("briefing_videos").select(col).eq("id", id).maybeSingle();
  const path = (v as Record<string, string | null> | null)?.[col];
  if (!path) return new NextResponse("Not found", { status: 404 });
  const { data } = await supabase.storage.from("briefings").download(path);
  if (!data) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(await data.text(), { headers: { "Content-Type": "text/vtt; charset=utf-8", "Cache-Control": "private, max-age=300" } });
}
