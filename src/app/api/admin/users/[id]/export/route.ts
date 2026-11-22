import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GDPR: export all personal data held about one user (admin only).
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getProfile();
  if (!me || me.status !== "approved" || me.role !== "admin") return new NextResponse("Forbidden", { status: 403 });
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_export_user_data", { p_user: id });
  if (error) return new NextResponse("Error", { status: 400 });
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="user-data-${id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
