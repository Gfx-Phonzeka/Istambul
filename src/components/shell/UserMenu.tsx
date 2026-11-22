"use client";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/lib/i18n/client";

export function UserMenu({ name, roleLabel, staff, signOut }: { name: string; roleLabel: string; staff: boolean; signOut: () => Promise<void> }) {
  const { t } = useI18n();
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger className="account-pill" aria-label={t("common.profile")}>
        <span className="avatar" aria-hidden="true">{initials(name)}</span>
        <span className="account-name">{name}</span>
        <Icon name="chevron-down" size={16} className="account-chevron" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="dropdown-panel" align="end" sideOffset={8} style={{ width: 260 }}>
          <DropdownMenu.Label className="dropdown-head">
            <div style={{ fontWeight: 600 }}>{name}</div>
            <div className="muted small">{roleLabel}</div>
          </DropdownMenu.Label>
          <DropdownMenu.Item asChild className="dropdown-item">
            <Link href="/profile">{t("common.profile")}</Link>
          </DropdownMenu.Item>
          {staff && (
            <DropdownMenu.Item asChild className="dropdown-item">
              <Link href="/admin">{t("common.admin")}</Link>
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item className="dropdown-item" onSelect={() => void signOut()}>
            {t("common.logout")}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}
