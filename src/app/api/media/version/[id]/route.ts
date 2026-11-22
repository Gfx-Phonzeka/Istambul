import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Archived versions: administrators only.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getProfile();
  if (!me || me.status !== "approved" || me.role !== "admin") return new NextResponse("Forbidden", { status: 403 });
  const { id } = await params;
  const supabase = await createClient();
  const { data: v } = await supabase.from("media_versions").select("file_path,file_name").eq("id", id).maybeSingle();
  if (!v) return new NextResponse("Not found", { status: 404 });
  const { data: signed } = await supabase.storage.from("media-files").createSignedUrl(v.file_path, 600, { download: v.file_name });
  if (!signed?.signedUrl) return new NextResponse("Not found", { status: 404 });
  return NextResponse.redirect(signed.signedUrl);
}
