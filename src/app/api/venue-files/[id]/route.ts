import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getProfile();
  if (!me || me.status !== "approved") return new NextResponse("Forbidden", { status: 403 });
  const { id } = await params;
  const supabase = await createClient();
  const { data: f } = await supabase.from("venue_files").select("file_path,file_name").eq("id", id).maybeSingle();
  if (!f) return new NextResponse("Not found", { status: 404 });
  const { data } = await supabase.storage.from("venues").createSignedUrl(f.file_path, 600, { download: f.file_name });
  return data?.signedUrl ? NextResponse.redirect(data.signedUrl) : new NextResponse("Not found", { status: 404 });
}
