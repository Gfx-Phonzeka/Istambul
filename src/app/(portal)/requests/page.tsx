import { redirect } from "next/navigation";
import { isTeam, requireApproved } from "@/lib/auth";
import { EVENT } from "@/lib/event";
import { BookingGateway } from "@/components/requests/BookingGateway";

export const metadata = { title: "Service requests" };

/** Right holders' service requests. Lima: the way into the booking site. Istanbul: run by the EBU, so no page here. */
export default async function RequestsPage() {
  const me = await requireApproved();
  if (EVENT.rhbRequests === "booking") return <BookingGateway />;
  redirect(isTeam(me) ? "/team/requests" : "/");
}
