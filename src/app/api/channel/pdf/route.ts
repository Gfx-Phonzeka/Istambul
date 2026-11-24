import { NextResponse, type NextRequest } from "next/server";
import { EVENT } from "@/lib/event";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LOCALES, type Locale } from "@/lib/i18n";
import { isDay } from "@/lib/reports";
import { buildChannelPdf } from "@/lib/pdf/channel";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// Integrated Channel grid PDF (published days): ?day=YYYY-MM-DD for one day, without it every day.
export async function GET(req: NextRequest) {
  if (!EVENT.integratedChannel) return new NextResponse("Not found", { status: 404 });
  const me = await getProfile();
  if (!me || me.status !== "approved") return new NextResponse("Forbidden", { status: 403 });
  const sp = req.nextUrl.searchParams;
  const l = sp.get("lang");
  const lang: Locale = LOCALES.includes(l as Locale) ? (l as Locale) : LOCALES[0];
  const day = sp.get("day");
  const supabase = await createClient();
  const buf = await buildChannelPdf(supabase, lang, isDay(day) ? [day] : undefined);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${EVENT.slug}-integrated-channel-${isDay(day) ? day : "all"}-${lang}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
