import { NextResponse, type NextRequest } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { normalizeLocale } from "@/lib/i18n";
import { buildCameraPlanPdf } from "@/lib/pdf/cameraPlan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// Builds the PDF, stores it in the user's export folder and redirects to a signed link
// (drawings can be large, so the file is not sent through the server response).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getProfile();
  if (!me || me.status !== "approved") return new NextResponse("Forbidden", { status: 403 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new NextResponse("Not found", { status: 404 });
  const locale = normalizeLocale(req.nextUrl.searchParams.get("lang"));
  const supabase = await createClient();
  const built = await buildCameraPlanPdf(supabase, id, locale);
  if (!built) return new NextResponse("Not found", { status: 404 });
  // Keep only the latest export of this map for this user.
  const { data: old } = await supabase.storage.from("camera-exports").list(me.id, { search: `${id}-${locale}-` });
  if (old?.length) await supabase.storage.from("camera-exports").remove(old.map((o) => `${me.id}/${o.name}`));
  const path = `${me.id}/${id}-${locale}-${Date.now()}.pdf`;
  const { error } = await supabase.storage.from("camera-exports").upload(path, built.pdf, { contentType: "application/pdf" });
  if (error) return new NextResponse("Export failed", { status: 500 });
  const { data } = await supabase.storage.from("camera-exports").createSignedUrl(path, 3600, { download: built.name });
  await supabase.rpc("log_event", { p_action: "view.camera_map_export", p_entity_type: "camera_plans", p_entity_id: id });
  if (!data?.signedUrl) return new NextResponse("Export failed", { status: 500 });
  if (req.nextUrl.searchParams.get("json") === "1") return NextResponse.json({ url: data.signedUrl, name: built.name });
  return NextResponse.redirect(data.signedUrl);
}
