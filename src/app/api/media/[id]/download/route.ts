import { NextResponse, type NextRequest } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Single download: checks permissions and terms, records the download, then redirects to a short-lived signed link.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getProfile();
  if (!me || me.status !== "approved") return new NextResponse("Forbidden", { status: 403 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new NextResponse("Not found", { status: 404 });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_download", { p_asset: id, p_via: "single" });
  if (error) {
    if (error.message.includes("terms_required")) return NextResponse.redirect(new URL(`/media-hub?terms=1&item=${id}`, req.url));
    return new NextResponse("Not found", { status: 404 });
  }
  const row = (data as { file_path: string; file_name: string }[])[0];
  // ?inline=1 opens the file in the browser (documents); otherwise it is downloaded with its name.
  const inline = req.nextUrl.searchParams.get("inline") === "1";
  const { data: signed } = await supabase.storage.from("media-files").createSignedUrl(row.file_path, 600, inline ? undefined : { download: row.file_name });
  if (!signed?.signedUrl) return new NextResponse("Not found", { status: 404 });
  return NextResponse.redirect(signed.signedUrl);
}
