import { redirect } from "next/navigation";

// Istanbul: right-holder service requests are handled by the EBU, so only team requests remain.
export default function AdminRequests() {
  redirect("/admin/team-requests");
}
