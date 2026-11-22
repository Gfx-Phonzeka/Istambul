import { requireApproved } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { formatDate, formatDateTime } from "@/lib/format";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { DeletionButton, DetailsForm, PasswordForm } from "./ProfileForms";

export const metadata = { title: "My profile" };

export default async function ProfilePage() {
  const profile = await requireApproved();
  const { t, locale } = await getT();
  return (
    <div className="stack">
      <PageHeader title={t("profile.title")} subtitle={profile.email} actions={<Badge tone="primary">{t(`admin.roles.${profile.role}`)}</Badge>} />
      <Card title={t("profile.personal")}>
        <DetailsForm profile={profile} />
      </Card>
      <Card title={t("profile.changePassword")}>
        <PasswordForm />
      </Card>
      <Card title={t("profile.downloads")}>
        <EmptyState icon="download">{t("profile.downloadsSoon")}</EmptyState>
      </Card>
      <Card title={t("profile.account")}>
        <p className="small">
          {t("profile.memberSince")}: {formatDate(profile.created_at, locale)} · {t("admin.columns.lastLogin")}: {formatDateTime(profile.last_login_at, locale)}
        </p>
      </Card>
      <Card title={t("profile.privacy")}>
        <p className="small">{t("profile.deleteText")}</p>
        {profile.deletion_requested_at ? (
          <div className="alert alert-warning">{t("profile.deleteRequested", { date: formatDate(profile.deletion_requested_at, locale) })}</div>
        ) : (
          <DeletionButton />
        )}
      </Card>
    </div>
  );
}
