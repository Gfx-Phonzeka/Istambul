import { NextResponse, type NextRequest } from "next/server";
import { EVENT } from "@/lib/event";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildCrewTemplate } from "@/lib/crew-import";
import { buildTemplate } from "@/lib/crew-logistics-import";
import { isCrewCoord } from "@/lib/crew-server";

export const dynamic = "force-dynamic";

/** Excel templates: crew import (admins), travel and rooming lists (Crew Ops coordination). */
export async function GET(req: NextRequest) {
  const me = await getProfile();
  const kind = req.nextUrl.searchParams.get("kind") ?? "crew";
  if (!me || me.status !== "approved") return new NextResponse("Forbidden", { status: 403 });
  if (kind === "crew" ? me.role !== "admin" : !(await isCrewCoord())) return new NextResponse("Forbidden", { status: 403 });
  const buf = kind === "travel" || kind === "rooming" ? await buildTemplate(kind) : await buildCrewTemplate(await createClient());
  return new NextResponse(buf, { headers: {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${EVENT.slug}-${kind}-import-template.xlsx"`, "Cache-Control": "no-store",
  } });
}
