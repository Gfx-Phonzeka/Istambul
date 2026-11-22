import { NextResponse } from "next/server";
import { getProfile, isStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildTemplate, DATASETS, type Dataset } from "@/lib/import";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ dataset: string }> }) {
  const me = await getProfile();
  if (!isStaff(me) || me?.status !== "approved") return new NextResponse("Forbidden", { status: 403 });
  const { dataset } = await params;
  if (!DATASETS.includes(dataset as Dataset)) return new NextResponse("Not found", { status: 404 });
  const buf = await buildTemplate(await createClient(), dataset as Dataset);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="istanbul2027-${dataset}-template.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
