"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importTeam, sendTeamInvites, type TeamImportResult } from "@/lib/actions/team";
import { useI18n } from "@/lib/i18n/client";

export function TeamImport() {
  const { t } = useI18n();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [res, setRes] = useState<TeamImportResult | null>(null);
  const [pending, start] = useTransition();
  const onFile = (f: File) => start(async () => {
    const d = new FormData(); d.set("file", f);
    const r = await importTeam(d);
    setRes(r);
    if (input.current) input.current.value = "";
    router.refresh();
  });
  return (
    <div className="stack-sm">
      <div className="row">
        <a className="btn" href="/api/admin/team/template">{t("team.admin.template")}</a>
        <label className="btn btn-primary">
          {pending ? t("common.sending") : t("team.admin.upload")}
          <input ref={input} type="file" accept=".xlsx,.csv" hidden disabled={pending} onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>
      </div>
      {res && !res.ok && <div className="alert alert-danger">{t(`team.admin.errors.${res.error}`)}{res.missing ? ` (${res.missing.join(", ")})` : ""}</div>}
      {res && res.ok && (
        <div className={`alert ${res.problems.length ? "alert-warning" : "alert-success"}`}>
          {t("team.admin.result", { created: res.created, updated: res.updated })}
          {res.problems.length > 0 && (
            <ul className="small" style={{ margin: "8px 0 0" }}>
              {res.problems.map((p) => <li key={p.line}>{t("team.admin.line", { n: p.line })} · {p.email || "—"} · {t(`team.admin.problems.${p.problem}`)}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function InviteButton({ ids, label, variant = "btn-sm" }: { ids: string[]; label: string; variant?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  if (!ids.length) return null;
  return (
    <span className="row" style={{ gap: 8 }}>
      <button className={`btn ${variant}`} disabled={pending} onClick={() => start(async () => {
        const r = await sendTeamInvites(ids);
        setDone(t("team.admin.invitesSent", { n: r.sent }));
        router.refresh();
      })}>{pending ? t("common.sending") : label}</button>
      {done && <span className="small muted" role="status">{done}</span>}
    </span>
  );
}
