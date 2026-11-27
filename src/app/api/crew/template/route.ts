import { NextResponse } from "next/server";
import { EVENT } from "@/lib/event";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildCrewTemplate } from "@/lib/crew-import";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getProfile();
  if (!me || me.status !== "approved" || me.role !== "admin") return new NextResponse("Forbidden", { status: 403 });
  const buf = await buildCrewTemplate(await createClient());
  return new NextResponse(buf, { headers: {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${EVENT.slug}-crew-import-template.xlsx"`, "Cache-Control": "no-store",
  } });
}
