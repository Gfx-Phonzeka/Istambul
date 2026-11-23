import { EVENT } from "@/lib/event";
import Link from "next/link";
import type { ReactNode } from "react";
import { LangSwitch } from "./LangSwitch";
import { Icon } from "@/components/ui/Icon";
import { getT } from "@/lib/i18n/server";

const INSIDE = [
  { key: "handbook", icon: "book" },
  { key: "schedule", icon: "calendar" },
  { key: "cameraMaps", icon: "camera" },
  { key: "mediaHub", icon: "download" },
] as const;

/** Frame for the public pages (sign-in, registration, legal): context panel + task column. */
export async function PublicFrame({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const { t } = await getT();
  return (
    <div className="public">
      <a href="#main" className="skip-link">{t("common.skipToContent")}</a>
      <aside className="public-panel">
        <Link href="/login" className="brand public-brand">
          <span className="brand-mark brand-logo"><img src={EVENT.logo.src} alt="" width={EVENT.logo.width} height={EVENT.logo.height} /></span>
          <span className="brand-text" translate="no">{t("common.appName")}</span>
        </Link>
        <div className="public-intro">
          <p className="public-games">{t("common.games").split(" · ").map((part) => <span key={part}>{part}</span>)}</p>
          <p className="public-host" translate="no">{t("common.hostBroadcaster")}</p>
        </div>
        <div className="public-inside">
          <h2>{t("common.insidePortal")}</h2>
          <ul>
            {INSIDE.map((i) => (
              <li key={i.key}>
                <span className="public-inside-icon"><Icon name={i.icon} size={18} /></span>
                <span>
                  <strong>{t(`nav.${i.key}`)}</strong>
                  <span>{t(`sectionInfo.${i.key}`)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <main className="public-main" id="main" tabIndex={-1}>
        <div className="public-top"><LangSwitch /></div>
        <div className={`public-content${wide ? " wide" : ""}`}><div className="card">{children}</div></div>
      </main>
    </div>
  );
}
