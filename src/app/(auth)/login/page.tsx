import { redirect } from "next/navigation";
import { PublicFrame } from "@/components/shell/PublicFrame";
import { getProfile } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const sp = await searchParams;
  const profile = await getProfile();
  if (profile) redirect(profile.status === "approved" ? "/" : "/account-status");
  return (
    <PublicFrame>
      <LoginForm next={sp.next} notice={sp.reset ? "auth.resetDone" : undefined} />
    </PublicFrame>
  );
}
