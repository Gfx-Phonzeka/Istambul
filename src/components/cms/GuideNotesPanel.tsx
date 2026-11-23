"use client";
import { useState, useTransition } from "react";
import { saveGuideNotes } from "@/lib/actions/guide";
import { useI18n } from "@/lib/i18n/client";

/** Internal notes of a Production Guidelines section: editors and admins only, never published. */
export function GuideNotesPanel({ sectionId, notes }: { sectionId: string; notes: string }) {
  const { t } = useI18n();
  const [value, setValue] = useState(notes);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <section className="card stack-sm">
      <h2 className="card-title" style={{ margin: 0 }}>{t("guide.notesTitle")}</h2>
      <p className="muted small" style={{ margin: 0 }}>{t("guide.notesHelp")}</p>
      <textarea className="textarea" rows={4} value={value} onChange={(e) => { setValue(e.target.value); setMsg(null); }} aria-label={t("guide.notesTitle")} />
      <div className="row">
        <button type="button" className="btn btn-sm" disabled={pending} onClick={() => start(async () => {
          const r = await saveGuideNotes(sectionId, value);
          setMsg(r.ok ? t("guide.notesSaved") : t("common.error"));
        })}>{pending ? t("common.sending") : t("guide.notesSave")}</button>
        {msg && <span className="small muted" role="status">{msg}</span>}
      </div>
    </section>
  );
}
