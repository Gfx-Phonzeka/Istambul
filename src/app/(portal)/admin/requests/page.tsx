import { AdminRequestList, type SP } from "@/components/requests/AdminRequestList";

export const metadata = { title: "Service requests" };

export default async function AdminRequests({ searchParams }: { searchParams: Promise<SP> }) {
  return <AdminRequestList sp={await searchParams} scope="rhb" />;
}
