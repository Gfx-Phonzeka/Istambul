import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <div className="auth-wrap">
      <div className="card auth-card stack" style={{ textAlign: "center" }}>
        <h1>{t("notFound.title")}</h1>
        <p className="muted">{t("notFound.text")}</p>
        <Link href="/" className="btn btn-primary">{t("notFound.home")}</Link>
      </div>
    </div>
  );
}
