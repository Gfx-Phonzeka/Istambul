import { redirect } from "next/navigation";
import { PublicFrame } from "@/components/shell/PublicFrame";
import { getProfile } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { signOut } from "@/lib/actions/auth";
import { Icon } from "@/components/ui";

export const metadata = { title: "Account status" };

export default async function AccountStatusPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.status === "approved" && profile.role) redirect("/");
  const { t } = await getT();
  const key = profile.status === "pending" ? "pending" : profile.status === "rejected" ? "rejected" : "suspended";
  return (
    <PublicFrame>
      <div className="stack" style={{ textAlign: "center" }}>
        <div style={{ color: key === "pending" ? "var(--color-info)" : "var(--color-danger)" }}>
          <Icon name={key === "pending" ? "clock" : "alert"} size={44} />
        </div>
        <h1>{t(`accountStatus.${key}Title`)}</h1>
        <p className="muted">{t(`accountStatus.${key}Text`)}</p>
        {key === "rejected" && profile.review_reason && (
          <div className="alert alert-warning" style={{ textAlign: "left" }}>
            <strong>{t("accountStatus.reason")}:</strong> {profile.review_reason}
          </div>
        )}
        <p className="small muted">{profile.email}</p>
        <form action={signOut}>
          <button className="btn">{t("common.logout")}</button>
        </form>
      </div>
    </PublicFrame>
  );
}
