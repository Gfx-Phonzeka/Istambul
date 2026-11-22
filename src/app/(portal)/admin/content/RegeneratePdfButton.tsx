"use client";
import { useState, useTransition } from "react";
import { regeneratePdfsNow } from "@/lib/actions/content";
import { useI18n } from "@/lib/i18n/client";

export function RegeneratePdfButton() {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="row">
      <button className="btn" disabled={pending} onClick={() => start(async () => {
        const r = await regeneratePdfsNow();
        setMsg(r.ok ? t("cms.regenerated") : t("cms.errors.generic"));
      })}>
        {pending ? t("handbook.exportWorking") : t("cms.regeneratePdf")}
      </button>
      {msg && <span className="small">{msg}</span>}
    </div>
  );
}
