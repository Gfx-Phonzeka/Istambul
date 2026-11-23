"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { deleteUser, reviewUser, setUserPassword, setUserRole, setUserStatus } from "@/lib/actions/admin";
import { useI18n } from "@/lib/i18n/client";
import { ConfirmButton } from "@/components/ui/ConfirmButton";

export interface AdminUserRow {
  id: string; email: string; first_name: string; last_name: string; organization: string; country: string;
  org_type: string; job_title: string; phone: string; role: string | null; status: string;
  review_reason: string | null; reviewed_at: string | null; deletion_requested_at: string | null;
  created_at: string; last_login_at: string | null; preferred_language: string;
}

const ROLES = ["right_holder", "partner", "production", "editor", "admin"] as const;

export function UserActions({ user, isSelf }: { user: AdminUserRow; isSelf: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string>(user.role ?? (user.org_type === "partner" ? "partner" : "right_holder"));
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>, close = true) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) setError(res.error === "weak_password" ? t("auth.errors.weak_password") : `${t("common.error")} (${res.error})`);
      else {
        if (close) setOpen(false);
        setPassword("");
        router.refresh();
      }
    });

  return (
    <>
      <button type="button" className="btn btn-sm" onClick={() => setOpen(true)}>{user.status === "pending" ? t("admin.approve") + " / " + t("admin.reject") : t("admin.details")}</button>
      {open && (
        <Modal title={`${user.first_name} ${user.last_name}`} onClose={() => setOpen(false)}>
          <div className="stack">
            {error && <div className="alert alert-danger">{error}</div>}
            <dl className="small" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", margin: 0 }}>
              <dt className="muted">{t("common.email")}</dt><dd style={{ margin: 0 }}>{user.email}</dd>
              <dt className="muted">{t("auth.organization")}</dt><dd style={{ margin: 0 }}>{user.organization}</dd>
              <dt className="muted">{t("auth.orgType")}</dt><dd style={{ margin: 0 }}>{t(`auth.orgTypes.${user.org_type}`)}</dd>
              <dt className="muted">{t("auth.country")}</dt><dd style={{ margin: 0 }}>{user.country}</dd>
              <dt className="muted">{t("auth.jobTitle")}</dt><dd style={{ margin: 0 }}>{user.job_title}</dd>
              <dt className="muted">{t("auth.phone")}</dt><dd style={{ margin: 0 }}>{user.phone}</dd>
              <dt className="muted">{t("common.language")}</dt><dd style={{ margin: 0 }}>{user.preferred_language.toUpperCase()}</dd>
              <dt className="muted">{t("common.status")}</dt><dd style={{ margin: 0 }}>{t(`admin.statuses.${user.status}`)}{user.review_reason ? ` — ${user.review_reason}` : ""}</dd>
            </dl>
            {user.deletion_requested_at && <div className="alert alert-warning">{t("admin.deletionRequested")}</div>}

            {(user.status === "pending" || user.status === "rejected") && (
              <div className="stack-sm">
                <div className="field">
                  <label htmlFor="role">{t("admin.assignRole")}</label>
                  <select id="role" className="select" value={role} onChange={(e) => setRole(e.target.value)}>
                    {ROLES.map((r) => <option key={r} value={r}>{t(`admin.roles.${r}`)}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="reason">{t("admin.reason")}</label>
                  <textarea id="reason" className="textarea" value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
                <div className="row">
                  <button className="btn btn-primary" disabled={pending} onClick={() => act(() => reviewUser(user.id, "approve", role, reason))}>{t("admin.approve")}</button>
                  {user.status === "pending" && (
                    <button className="btn btn-danger" disabled={pending} onClick={() => act(() => reviewUser(user.id, "reject", null, reason))}>{t("admin.reject")}</button>
                  )}
                </div>
              </div>
            )}

            {(user.status === "approved" || user.status === "suspended") && !isSelf && (
              <div className="stack-sm">
                <div className="field">
                  <label htmlFor="role2">{t("admin.changeRole")}</label>
                  <div className="row">
                    <select id="role2" className="select" style={{ flex: 1, minWidth: 0 }} value={role} onChange={(e) => setRole(e.target.value)}>
                      {ROLES.map((r) => <option key={r} value={r}>{t(`admin.roles.${r}`)}</option>)}
                    </select>
                    <button className="btn" disabled={pending || role === user.role} onClick={() => act(() => setUserRole(user.id, role), false)}>{t("common.save")}</button>
                  </div>
                </div>
                <div>
                  {user.status === "approved" ? (
                    <button className="btn" disabled={pending} onClick={() => act(() => setUserStatus(user.id, "suspended"))}>{t("admin.suspend")}</button>
                  ) : (
                    <button className="btn btn-primary" disabled={pending} onClick={() => act(() => setUserStatus(user.id, "approved"))}>{t("admin.reactivate")}</button>
                  )}
                </div>
              </div>
            )}

            {!isSelf && (
              <div className="field">
                <label htmlFor="pw">{t("admin.setPassword")}</label>
                <div className="row">
                  <input id="pw" className="input" style={{ flex: 1, minWidth: 0 }} type="text" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button className="btn" disabled={pending || password.length < 10} onClick={() => act(() => setUserPassword(user.id, password), false)}>{t("common.save")}</button>
                </div>
                <span className="hint">{t("admin.setPasswordHelp")} {t("auth.passwordRules")}</span>
              </div>
            )}

            <div className="row" style={{ borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-3)" }}>
              <a className="btn btn-sm" href={`/api/admin/users/${user.id}/export`}>{t("admin.exportData")}</a>
              {!isSelf && (
                <ConfirmButton className="btn btn-sm btn-danger" disabled={pending} message={t("admin.deleteConfirm")}
                  onConfirm={() => act(() => deleteUser(user.id))}>
                  {t("admin.deleteUser")}
                </ConfirmButton>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
