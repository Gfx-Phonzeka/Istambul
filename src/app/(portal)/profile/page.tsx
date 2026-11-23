import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { tx, cols } from "@/lib/i18n";
import Link from "next/link";
import { FavoriteButton } from "@/components/FavoriteButton";
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
    .select(`id,created_at,via,asset_id,media_assets(${cols("title")}),media_versions(version_number,file_name)` as "*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);
  type Dl = { id: number; created_at: string; via: string; asset_id: string | null;
    media_assets: { title_en: string; title_tr: string | null } | null; media_versions: { version_number: number; file_name: string } | null };
  const rows = (downloads ?? []) as unknown as Dl[];
  const { data: favs } = await supabase.from("favorites").select("kind,target_id").eq("user_id", profile.id);
  const ids = (k: string) => (favs ?? []).filter((f) => f.kind === k).map((f) => f.target_id);
  const [{ data: fv }, { data: fs }, { data: fm }] = await Promise.all([
    supabase.from("venues").select(`id,slug,${cols("title")}` as "*").in("id", ids("venue").length ? ids("venue") : ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("sports").select(`id,${cols("title")}` as "*").in("id", ids("sport").length ? ids("sport") : ["00000000-0000-0000-0000-000000000000"]),
    supabase.from("media_assets").select(`id,${cols("title")}` as "*").in("id", ids("media_asset").length ? ids("media_asset") : ["00000000-0000-0000-0000-000000000000"]),
  ]);
  const favItems = [
    ...(fv ?? []).map((x) => ({ kind: "venue" as const, id: x.id, label: tx(x, "title", locale), href: `/venues/${x.slug}` })),
    ...(fs ?? []).map((x) => ({ kind: "sport" as const, id: x.id, label: tx(x, "title", locale), href: `/schedule` })),
    ...(fm ?? []).map((x) => ({ kind: "media_asset" as const, id: x.id, label: tx(x, "title", locale), href: `/media-hub?item=${x.id}` })),
  ];
  return (
    <div className="stack">
      <PageHeader title={t("profile.title")} subtitle={profile.email} actions={<Badge tone="primary">{t(`admin.roles.${profile.role}`)}</Badge>} />
      <Card title={t("profile.personal")}>
        <DetailsForm profile={profile} />
      </Card>
      <Card title={t("profile.changePassword")}>
        <PasswordForm />
      </Card>
      <Card title={t("favorites.title")}>
        <p className="small muted">{t("favorites.intro")}</p>
        {favItems.length === 0 ? <p className="small muted" style={{ margin: 0 }}>{t("favorites.none")}</p> : (
          <ul className="list">
            {favItems.map((f) => (
              <li key={`${f.kind}-${f.id}`} className="row-between">
                <span><span className="badge">{t(`favorites.kinds.${f.kind}`)}</span> <Link href={f.href}>{f.label}</Link></span>
                <FavoriteButton kind={f.kind} id={f.id} initial compact label={f.label} />
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title={t("profile.downloads")}>
        {rows.length === 0 ? (
          <EmptyState icon="download" action={{ label: t("common.openMediaHub"), href: "/media-hub" }}>{t("profile.noDownloads")}</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>{t("admin.activityCols.when")}</th><th>{t("mediaHub.file")}</th><th>{t("mediaHub.specs.version")}</th></tr></thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{formatDateTime(d.created_at, locale)}</td>
                    <td>
                      {d.asset_id ? <Link href={`/media-hub?item=${d.asset_id}`}>{d.media_assets ? tx(d.media_assets, "title", locale) : "—"}</Link> : "—"}
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
