"use client";
import { useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
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

  const bottom = [
    { href: "/", icon: "home", label: t("nav.dashboard") },
    { href: "/handbook", icon: "book", label: t("nav.handbook") },
    { href: "/media-hub", icon: "download", label: t("nav.mediaHub") },
    { href: "/schedule", icon: "calendar", label: t("nav.schedule"), short: t("nav.scheduleShort") },
  ];

  const navBody = (onNavigate?: () => void) => (
    <>
      <Link href="/" className="brand rail-brand" onClick={onNavigate}>
        <span className="brand-mark" translate="no">IST<br />27</span>
        <span className="brand-text" translate="no">{t("common.appName")}</span>
      </Link>
      {groups.map((g) => (
        <div key={g.title} className="nav-group">
          <div className="nav-group-title">{t(g.title)}</div>
          {g.items.map((it) => (
            <Link key={it.href} href={it.href} className="nav-link" onClick={onNavigate} aria-current={isActive(pathname, it.href) ? "page" : undefined}>
              <Icon name={it.icon} className="nav-icon" />
              {t(it.key.includes(".") ? it.key : `nav.${it.key}`)}
            </Link>
          ))}
        </div>
      ))}
    </>
  );

  return (
    <>
      <a href="#main" className="skip-link">{t("common.skipToContent")}</a>
      <PageViewTracker />
      <div className="shell">
        <nav className="sidebar sidebar-rail" aria-label={t("common.menu")}>
          {navBody()}
        </nav>
        <Dialog.Root open={drawer} onOpenChange={setDrawer}>
          <Dialog.Portal>
            <Dialog.Overlay className="drawer-backdrop" />
            <Dialog.Content className="sidebar drawer" aria-describedby={undefined}>
              <Dialog.Title className="sr-only">{t("common.menu")}</Dialog.Title>
              <nav aria-label={t("common.menu")}>{navBody(() => setDrawer(false))}</nav>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <div className="shell-main">
          <header className="topbar">
            <button type="button" className="icon-btn only-mobile" aria-label={t("common.menu")} aria-expanded={drawer} aria-haspopup="dialog" onClick={() => setDrawer(true)}>
              <Icon name="menu" />
            </button>
            <Link href="/" className="brand topbar-brand">
              <span className="brand-mark" translate="no">IST<br />27</span>
              <span className="brand-text" translate="no">{t("common.appName")}</span>
            </Link>
            <form
              className="topbar-search"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
              }}
            >
              <Icon name="search" className="topbar-search-icon" />
              <label className="sr-only" htmlFor="global-search">{t("common.search")}</label>
              <input id="global-search" className="input" type="search" autoComplete="off" placeholder={t("common.searchPlaceholder")} value={q} onChange={(e) => setQ(e.target.value)} />
            </form>
            <div className="topbar-actions">
              <Link href="/search" className="icon-btn only-mobile" aria-label={t("common.search")}><Icon name="search" /></Link>
              <LangSwitch />
              <NotificationBell items={notifications} />
              <UserMenu name={userName} roleLabel={roleLabel} staff={staff} signOut={signOut} />
            </div>
          </header>
          <main className="main" id="main" tabIndex={-1}>
            <div className="main-inner">{children}</div>
          </main>
        </div>
      </div>

      <nav className="bottomnav" aria-label="Quick navigation">
        {bottom.map((b) => (
          <Link key={b.href} href={b.href} aria-current={isActive(pathname, b.href) ? "page" : undefined}>
            <Icon name={b.icon} />
            {"short" in b ? (
              <span><span className="label-long">{b.label}</span><span className="label-short">{b.short}</span></span>
            ) : (
              <span>{b.label}</span>
            )}
          </Link>
        ))}
        <button type="button" aria-haspopup="dialog" aria-expanded={drawer} onClick={() => setDrawer(true)}>
          <Icon name="more" />
          <span>{t("common.more")}</span>
        </button>
      </nav>
    </>
  );
}
