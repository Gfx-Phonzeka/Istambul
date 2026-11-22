import Link from "next/link";
import type { ReactNode } from "react";
import { LangSwitch } from "./LangSwitch";
import { getT } from "@/lib/i18n/server";

/** Frame for the public pages (sign-in, registration, legal). */
export async function PublicFrame({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const { t } = await getT();
  return (
    <div className="auth-wrap">
      <div className="auth-top">
        <Link href="/login" className="brand">
          <span className="brand-mark">IST<br />27</span>
          <span className="brand-text">{t("common.appName")}</span>
        </Link>
        <LangSwitch />
      </div>
      <div className={`card auth-card${wide ? " wide" : ""}`}>{children}</div>
      <p className="muted small" style={{ textAlign: "center" }}>
        {t("common.games")} · {t("common.hostBroadcaster")}
      </p>
    </div>
  );
}
