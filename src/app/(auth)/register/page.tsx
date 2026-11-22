import { redirect } from "next/navigation";
import { PublicFrame } from "@/components/shell/PublicFrame";
import { getProfile } from "@/lib/auth";
import { RegisterForm } from "./RegisterForm";

export const metadata = { title: "Request access" };

export default async function RegisterPage() {
  if (await getProfile()) redirect("/");
  return (
    <PublicFrame wide>
      <RegisterForm />
    </PublicFrame>
  );
}
