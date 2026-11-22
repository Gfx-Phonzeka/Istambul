import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|pdf.worker.min.mjs|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2|txt)$).*)"],
};
