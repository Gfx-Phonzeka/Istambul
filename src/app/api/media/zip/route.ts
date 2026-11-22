import { NextResponse, type NextRequest } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// "Download selection": returns signed links for each selected file; the browser builds the ZIP itself
// (broadcast files can be several GB, too large to zip on the server).
export async function POST(req: NextRequest) {
  const me = await getProfile();
  if (!me || me.status !== "approved") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { ids?: unknown };
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string" && /^[0-9a-f-]{36}$/.test(x)).slice(0, 50) : [];
  if (!ids.length) return NextResponse.json({ error: "empty" }, { status: 400 });
  const supabase = await createClient();
  const files: { name: string; url: string }[] = [];
  const used = new Set<string>();
  for (const id of ids) {
    const { data, error } = await supabase.rpc("register_download", { p_asset: id, p_via: "zip" });
    if (error) {
      if (error.message.includes("terms_required")) return NextResponse.json({ error: "terms_required" }, { status: 409 });
      continue;
    }
    const row = (data as { file_path: string; file_name: string }[])[0];
    const { data: signed } = await supabase.storage.from("media-files").createSignedUrl(row.file_path, 3600);
    if (!signed?.signedUrl) continue;
    let name = row.file_name;
    for (let n = 2; used.has(name); n++) name = row.file_name.replace(/(\.[^.]*)?$/, ` (${n})$1`);
    used.add(name);
    files.push({ name, url: signed.signedUrl });
  }
  return NextResponse.json({ files });
}
