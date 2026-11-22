"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { markAllNotificationsRead } from "@/lib/actions/notifications";
import { pick } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";

export interface NotificationRow {
  id: number;
  title_en: string;
  title_tr: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export function NotificationBell({ items }: { items: NotificationRow[] }) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const unread = items.filter((n) => !n.read_at).length;

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="dropdown" ref={ref}>
      <button type="button" className="icon-btn" aria-label={t("common.notifications")} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon name="bell" />
        {unread > 0 && <span className="dot">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="dropdown-panel">
          <div className="row-between" style={{ padding: "var(--space-2) var(--space-3)" }}>
            <strong className="small">{t("common.notifications")}</strong>
            {unread > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  start(async () => {
                    await markAllNotificationsRead();
                    router.refresh();
                  })
                }
              >
                {t("common.markAllRead")}
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="muted small" style={{ padding: "var(--space-3)" }}>{t("common.noNotifications")}</p>
          ) : (
            <div className="stack-sm" style={{ maxHeight: 360, overflowY: "auto" }}>
              {items.map((n) => {
                const content = (
                  <>
                    <div>{pick(locale, n.title_en, n.title_tr)}</div>
                    <div className="muted" style={{ fontSize: "var(--text-xs)" }}>
                      {new Date(n.created_at).toLocaleString(locale === "tr" ? "tr-TR" : "en-GB", { dateStyle: "medium", timeStyle: "short" })}
                    </div>
                  </>
                );
                return n.link ? (
                  <Link key={n.id} href={n.link} className={`notif-item${n.read_at ? "" : " unread"}`} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                ) : (
                  <div key={n.id} className={`notif-item${n.read_at ? "" : " unread"}`}>{content}</div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
