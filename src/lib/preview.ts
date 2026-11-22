import "server-only";
import { getProfile, isStaff } from "@/lib/auth";

/** Staff can append ?preview=1 to see drafts and pending changes. */
export async function isPreview(sp: { preview?: string }): Promise<boolean> {
  if (sp.preview !== "1") return false;
  return isStaff(await getProfile());
}
