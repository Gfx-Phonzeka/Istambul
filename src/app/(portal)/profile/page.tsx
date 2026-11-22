import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { pick } from "@/lib/i18n";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { formatDate, formatDateTime } from "@/lib/format";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { DeletionButton, DetailsForm, PasswordForm } from "./ProfileForms";

export const metadata = { title: "My profile" };

export default async function ProfilePage() {
  const profile = await requireApproved();
  const { t, locale } = await getT();
  const supabase = await createClient();
  const { data: downloads } = await supabase
    .from("media_downloads")
    .select("id,created_at,via,asset_id,media_assets(title_en,title_tr),media_versions(version_number,file_name)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);
  type Dl = { id: number; created_at: string; via: string; asset_id: string | null;
    media_assets: { title_en: string; title_tr: string | null } | null; media_versions: { version_number: number; file_name: string } | null };
  const rows = (downloads ?? []) as unknown as Dl[];
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
        {rows.length === 0 ? (
          <EmptyState icon="download">{t("profile.noDownloads")}</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>{t("admin.activityCols.when")}</th><th>{t("mediaHub.file")}</th><th>{t("mediaHub.specs.version")}</th></tr></thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{formatDateTime(d.created_at, locale)}</td>
                    <td>
                      {d.asset_id ? <Link href={`/media-hub?item=${d.asset_id}`}>{d.media_assets ? pick(locale, d.media_assets.title_en, d.media_assets.title_tr) : "—"}</Link> : "—"}
                      <div className="muted">{d.media_versions?.file_name}{d.via === "zip" ? " · ZIP" : ""}</div>
                    </td>
                    <td>{d.media_versions ? `v${d.media_versions.version_number}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
