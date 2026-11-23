import { EVENT } from "@/lib/event";
import { NextResponse } from "next/server";
import { getProfile, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildTeamTemplate } from "@/lib/team";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getProfile();
  if (!isAdmin(me) || me?.status !== "approved") return new NextResponse("Forbidden", { status: 403 });
  const buf = await buildTeamTemplate(await createClient());
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${EVENT.slug}-production-team-template.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
