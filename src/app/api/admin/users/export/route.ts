import ExcelJS from "exceljs";
import { NextResponse, type NextRequest } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const me = await getProfile();
  if (!me || me.status !== "approved" || me.role !== "admin") return new NextResponse("Forbidden", { status: 403 });
  const status = req.nextUrl.searchParams.get("status") ?? "all";
  const supabase = await createClient();
  let q = supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (status !== "all") q = q.eq("status", status);
  const { data } = await q;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Users");
  ws.columns = [
    { header: "First name", key: "first_name", width: 16 },
    { header: "Last name", key: "last_name", width: 18 },
    { header: "Email", key: "email", width: 34 },
    { header: "Organisation", key: "organization", width: 30 },
    { header: "Organisation type", key: "org_type", width: 16 },
    { header: "Country", key: "country", width: 16 },
    { header: "Job title", key: "job_title", width: 24 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Profile", key: "role", width: 14 },
    { header: "Status", key: "status", width: 12 },
    { header: "Language", key: "preferred_language", width: 10 },
    { header: "Registered", key: "created_at", width: 20 },
    { header: "Last sign-in", key: "last_login_at", width: 20 },
    { header: "Deletion requested", key: "deletion_requested_at", width: 20 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const u of data ?? []) {
    ws.addRow({
      ...u,
      created_at: u.created_at ? new Date(u.created_at) : null,
      last_login_at: u.last_login_at ? new Date(u.last_login_at) : null,
      deletion_requested_at: u.deletion_requested_at ? new Date(u.deletion_requested_at) : null,
    });
  }
  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="istanbul2027-users-${status}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
