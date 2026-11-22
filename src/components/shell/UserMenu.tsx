"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/lib/i18n/client";

export function UserMenu({ name, roleLabel, staff, signOut }: { name: string; roleLabel: string; staff: boolean; signOut: () => Promise<void> }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  return (
    <div className="dropdown" ref={ref}>
      <button type="button" className="account-pill" aria-label={t("common.profile")} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="avatar" aria-hidden="true">{initials(name)}</span>
        <span className="account-name">{name}</span>
        <Icon name="chevron-down" size={16} className="account-chevron" />
      </button>
      {open && (
        <div className="dropdown-panel" style={{ width: 260 }}>
          <div className="dropdown-head">
            <div style={{ fontWeight: 600 }}>{name}</div>
            <div className="muted small">{roleLabel}</div>
          </div>
          <Link href="/profile" className="dropdown-item" onClick={() => setOpen(false)}>{t("common.profile")}</Link>
          {staff && <Link href="/admin" className="dropdown-item" onClick={() => setOpen(false)}>{t("common.admin")}</Link>}
          <form action={signOut}>
            <button type="submit" className="dropdown-item">{t("common.logout")}</button>
          </form>
        </div>
      )}
    </div>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}
