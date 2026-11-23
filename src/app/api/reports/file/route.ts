import { NextResponse, type NextRequest } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Opens a daily-report attachment or a PQC PDF. Storage rules decide who may read it
// (the person who uploaded it, coordination and admins).
export async function GET(req: NextRequest) {
  const me = await getProfile();
  if (!me || me.status !== "approved") return new NextResponse("Forbidden", { status: 403 });
  const path = req.nextUrl.searchParams.get("path") ?? "";
  const name = req.nextUrl.searchParams.get("name") ?? undefined;
  if (!path || path.includes("..") || path.startsWith("/") || path.length > 500) return new NextResponse("Not found", { status: 404 });
  const supabase = await createClient();
  const { data } = await supabase.storage.from("reports").createSignedUrl(path, 300, name ? { download: name.slice(0, 200) } : undefined);
  return data?.signedUrl ? NextResponse.redirect(data.signedUrl) : new NextResponse("Not found", { status: 404 });
}
