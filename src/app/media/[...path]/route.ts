import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Images embedded in rich text live in a private bucket; this returns a short-lived signed link.
export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const key = path.map(decodeURIComponent).join("/");
  if (key.includes("..")) return new NextResponse("Bad request", { status: 400 });
  const supabase = await createClient();
  const { data } = await supabase.storage.from("content-media").createSignedUrl(key, 300);
  if (!data?.signedUrl) return new NextResponse("Not found", { status: 404 });
  const res = NextResponse.redirect(data.signedUrl);
  res.headers.set("Cache-Control", "private, max-age=240");
  return res;
}
