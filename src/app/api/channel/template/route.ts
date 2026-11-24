import { NextResponse } from "next/server";
import { EVENT } from "@/lib/event";
import { getProfile, isStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildChannelTemplate } from "@/lib/channel-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Excel template of the Integrated Channel grid (with the current grid, so it can be edited and imported again). Editors only.
export async function GET() {
  if (!EVENT.integratedChannel) return new NextResponse("Not found", { status: 404 });
  const me = await getProfile();
  if (!me || me.status !== "approved" || !isStaff(me)) return new NextResponse("Forbidden", { status: 403 });
  const buf = await buildChannelTemplate(await createClient());
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${EVENT.slug}-integrated-channel-grid.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
