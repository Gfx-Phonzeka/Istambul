import { PublicFrame } from "@/components/shell/PublicFrame";
import { ForgotForm } from "./ForgotForm";

export const metadata = { title: "Reset password" };

export default function ForgotPage() {
  return (
    <PublicFrame>
      <ForgotForm />
    </PublicFrame>
  );
}
