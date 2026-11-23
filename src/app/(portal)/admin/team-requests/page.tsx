import { AdminRequestList } from "@/components/requests/AdminRequestList";

export const metadata = { title: "Team requests" };

export default async function AdminTeamRequests({ searchParams }: { searchParams: Promise<{ status?: string; type?: string; venue?: string }> }) {
  return <AdminRequestList sp={await searchParams} scope="team" />;
}
