import { EVENT } from "@/lib/event";
import { NextResponse, type NextRequest } from "next/server";
import { getProfile, isTeam } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildGuidePdf, type GuidePdfScope } from "@/lib/pdf/guide";
import { GUIDE_LANGS, type GuideLang } from "@/lib/guide";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const UUID = /^[0-9a-f-]{36}$/;

// Production Guidelines PDF (team only): whole manual, one chapter or selected sections, in EN, PT or TR.
export async function GET(req: NextRequest) {
  const me = await getProfile();
  if (!me || me.status !== "approved" || !isTeam(me)) return new NextResponse("Forbidden", { status: 403 });
  const sp = req.nextUrl.searchParams;
  const l = sp.get("lang");
  const lang: GuideLang = GUIDE_LANGS.includes(l as GuideLang) ? (l as GuideLang) : GUIDE_LANGS[0];
  let scope: GuidePdfScope = { kind: "all" };
  if (sp.get("scope") === "chapter" && UUID.test(sp.get("id") ?? "")) scope = { kind: "chapter", id: sp.get("id")! };
  if (sp.get("scope") === "sections") {
    const ids = (sp.get("ids") ?? "").split(",").filter((x) => UUID.test(x)).slice(0, 200);
    if (ids.length) scope = { kind: "sections", ids };
  }
  const supabase = await createClient();
  const buf = await buildGuidePdf(supabase, lang, scope, req.nextUrl.origin);
  await supabase.rpc("log_event", { p_action: "guidelines.pdf_exported", p_details: { scope: scope.kind, lang } });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${EVENT.slug}-production-guidelines-${scope.kind}-${lang}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
