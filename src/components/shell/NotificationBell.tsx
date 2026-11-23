"use client";
import { intlLocale } from "@/lib/i18n";
import { EVENT } from "@/lib/event";
import { useState, useTransition } from "react";
import * as Popover from "@radix-ui/react-popover";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { markAllNotificationsRead } from "@/lib/actions/notifications";
import { tx } from "@/lib/i18n";
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
  const unread = items.filter((n) => !n.read_at).length;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="icon-btn" aria-label={unread > 0 ? `${t("common.notifications")} (${unread})` : t("common.notifications")}>
        <Icon name="bell" />
        {unread > 0 && <span className="dot" aria-hidden="true">{unread > 9 ? "9+" : unread}</span>}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="dropdown-panel" align="end" sideOffset={8} aria-label={t("common.notifications")}>
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
                    <div>{tx(n, "title", locale)}</div>
                    <div className="muted" style={{ fontSize: "var(--text-xs)" }}>
                      {new Date(n.created_at).toLocaleString(intlLocale(locale), { dateStyle: "medium", timeStyle: "short", timeZone: EVENT.tz })}
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
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
