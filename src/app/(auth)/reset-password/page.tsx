import { PublicFrame } from "@/components/shell/PublicFrame";
import { getT } from "@/lib/i18n/server";
import { ResetForm } from "./ResetForm";

export const metadata = { title: "New password" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const { t } = await getT();
  return (
    <PublicFrame>
      {token ? <ResetForm token={token} /> : <div className="alert alert-danger">{t("auth.errors.invalid_token")}</div>}
    </PublicFrame>
  );
}
