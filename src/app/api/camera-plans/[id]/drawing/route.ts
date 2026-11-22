import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getProfile();
  if (!me || me.status !== "approved") return new NextResponse("Forbidden", { status: 403 });
  const { id } = await params;
  const version = new URL(req.url).searchParams.get("version"); // archived versions: admins only (RLS)
  const supabase = await createClient();
  let q = supabase.from("camera_drawings").select("file_path,file_name").eq("plan_id", id);
  q = version ? q.eq("id", version) : q.eq("is_current", true);
  const { data: d } = await q.maybeSingle();
  if (!d) return new NextResponse("Not found", { status: 404 });
  const { data } = await supabase.storage.from("camera-drawings").createSignedUrl(d.file_path, 600, { download: d.file_name });
  await supabase.rpc("log_event", { p_action: "view.camera_drawing_download", p_entity_type: "camera_plans", p_entity_id: id });
  return data?.signedUrl ? NextResponse.redirect(data.signedUrl) : new NextResponse("Not found", { status: 404 });
}
