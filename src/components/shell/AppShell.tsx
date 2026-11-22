"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/lib/i18n/client";
import { isActive, type NavItem } from "@/lib/nav";
import { LangSwitch } from "./LangSwitch";
import { NotificationBell, type NotificationRow } from "./NotificationBell";
import { UserMenu } from "./UserMenu";
import { PageViewTracker } from "./PageViewTracker";

export interface ShellNavGroup {
  title: string;
  items: NavItem[];
}

export function AppShell({
  groups,
  notifications,
  userName,
  roleLabel,
  staff,
  signOut,
  children,
}: {
  groups: ShellNavGroup[];
  notifications: NotificationRow[];
  userName: string;
  roleLabel: string;
  staff: boolean;
  signOut: () => Promise<void>;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => setDrawer(false), [pathname]);

  const bottom = [
    { href: "/", icon: "home", label: t("nav.dashboard") },
    { href: "/handbook", icon: "book", label: t("nav.handbook") },
    { href: "/media-hub", icon: "download", label: t("nav.mediaHub") },
    { href: "/schedule", icon: "calendar", label: t("nav.schedule") },
  ];

  return (
    <>
      <PageViewTracker />
      <header className="topbar">
        <button type="button" className="icon-btn only-mobile" aria-label={t("common.menu")} aria-expanded={drawer} onClick={() => setDrawer((d) => !d)}>
          <Icon name={drawer ? "close" : "menu"} />
        </button>
        <Link href="/" className="brand">
          <span className="brand-mark">IST<br />27</span>
          <span className="brand-text">{t("common.appName")}</span>
        </Link>
        <form
          className="topbar-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
          }}
        >
          <label className="sr-only" htmlFor="global-search">{t("common.search")}</label>
          <input id="global-search" className="input" type="search" placeholder={t("common.searchPlaceholder")} value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        <div className="topbar-actions">
          <Link href="/search" className="icon-btn only-mobile" aria-label={t("common.search")}><Icon name="search" /></Link>
          <LangSwitch />
          <NotificationBell items={notifications} />
          <UserMenu name={userName} roleLabel={roleLabel} staff={staff} signOut={signOut} />
        </div>
      </header>

      <div className="shell">
        <nav className={`sidebar${drawer ? " open" : ""}`} aria-label={t("common.menu")}>
          {groups.map((g) => (
            <div key={g.title} className="nav-group">
              <div className="nav-group-title">{t(g.title)}</div>
              {g.items.map((it) => (
                <Link key={it.href} href={it.href} className="nav-link" aria-current={isActive(pathname, it.href) ? "page" : undefined}>
                  <Icon name={it.icon} className="nav-icon" />
                  {t(it.key.includes(".") ? it.key : `nav.${it.key}`)}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className={`drawer-backdrop${drawer ? " open" : ""}`} onClick={() => setDrawer(false)} />
        <main className="main" id="main">
          <div className="main-inner">{children}</div>
        </main>
      </div>

      <nav className="bottomnav" aria-label="Quick navigation">
        {bottom.map((b) => (
          <Link key={b.href} href={b.href} aria-current={isActive(pathname, b.href) ? "page" : undefined}>
            <Icon name={b.icon} />
            <span>{b.label}</span>
          </Link>
        ))}
        <button type="button" onClick={() => setDrawer(true)}>
          <Icon name="more" />
          <span>{t("common.more")}</span>
        </button>
      </nav>
    </>
  );
}
