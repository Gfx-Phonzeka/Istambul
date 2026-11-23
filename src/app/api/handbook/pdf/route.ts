import { EVENT } from "@/lib/event";
import { NextResponse, type NextRequest } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildHandbookPdf, type PdfScope } from "@/lib/pdf/handbook";
import { normalizeLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const UUID = /^[0-9a-f-]{36}$/;

// On-demand PDF: whole handbook, one chapter or selected sections, in EN or TR.
export async function GET(req: NextRequest) {
  const me = await getProfile();
  if (!me || me.status !== "approved") return new NextResponse("Forbidden", { status: 403 });
  const sp = req.nextUrl.searchParams;
  const locale = normalizeLocale(sp.get("lang"));
  let scope: PdfScope = { kind: "all" };
  if (sp.get("scope") === "chapter" && UUID.test(sp.get("id") ?? "")) scope = { kind: "chapter", id: sp.get("id")! };
  if (sp.get("scope") === "sections") {
    const ids = (sp.get("ids") ?? "").split(",").filter((x) => UUID.test(x)).slice(0, 200);
    if (ids.length) scope = { kind: "sections", ids };
  }
  const supabase = await createClient();
  const buf = await buildHandbookPdf(supabase, locale, scope);
  await supabase.rpc("log_event", { p_action: "handbook.pdf_exported", p_details: { scope: scope.kind, lang: locale } });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${EVENT.slug}-handbook-${scope.kind}-${locale}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
