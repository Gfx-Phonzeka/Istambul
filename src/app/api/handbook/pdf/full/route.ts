import { EVENT } from "@/lib/event";
import { NextResponse, type NextRequest } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FULL_PDF_PATH } from "@/lib/pdf/handbook";
import { normalizeLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Pre-generated complete handbook (rebuilt on every handbook publication).
export async function GET(req: NextRequest) {
  const me = await getProfile();
  if (!me || me.status !== "approved") return new NextResponse("Forbidden", { status: 403 });
  const locale = normalizeLocale(req.nextUrl.searchParams.get("lang"));
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("handbook-pdf")
    .createSignedUrl(FULL_PDF_PATH(locale), 120, { download: `${EVENT.slug}-handbook-${locale}.pdf` });
  if (!data?.signedUrl) {
    // Not generated yet: fall back to an on-demand export.
    return NextResponse.redirect(new URL(`/api/handbook/pdf?lang=${locale}`, req.url));
  }
  await supabase.rpc("log_event", { p_action: "handbook.pdf_downloaded", p_details: { lang: locale } });
  return NextResponse.redirect(data.signedUrl);
}
