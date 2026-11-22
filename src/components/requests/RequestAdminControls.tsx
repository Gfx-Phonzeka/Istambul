"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addRequestNote, updateRequestStatus } from "@/lib/actions/requests";
import { REQUEST_STATUSES } from "@/lib/requests";
import { useI18n } from "@/lib/i18n/client";

export function RequestAdminControls({ id, status }: { id: string; status: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [next, setNext] = useState(status);
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="grid grid-2">
      <section className="card stack-sm">
        <h2 className="card-title" style={{ margin: 0 }}>{t("requests.admin.changeStatus")}</h2>
        <select className="select" value={next} onChange={(e) => setNext(e.target.value)} aria-label={t("common.status")}>
          {REQUEST_STATUSES.map((s) => <option key={s} value={s}>{t(`requests.status.${s}`)}</option>)}
        </select>
        <textarea className="textarea" rows={3} placeholder={t("requests.admin.messagePlaceholder")} value={message} onChange={(e) => setMessage(e.target.value)} />
        <p className="hint" style={{ margin: 0 }}>{t("requests.admin.emailNote")}</p>
        <div>
          <button className="btn btn-primary" disabled={pending || (next === status && !message.trim())} onClick={() => start(async () => {
            const r = await updateRequestStatus(id, next, message);
            setMsg(r.ok ? t("requests.admin.updated") : t("common.error")); if (r.ok) { setMessage(""); router.refresh(); }
          })}>{t("requests.admin.update")}</button>
        </div>
        {msg && <div className="alert alert-info small">{msg}</div>}
      </section>
      <section className="card stack-sm">
        <h2 className="card-title" style={{ margin: 0 }}>{t("requests.admin.notes")}</h2>
        <textarea className="textarea" rows={3} placeholder={t("requests.admin.notePlaceholder")} value={note} onChange={(e) => setNote(e.target.value)} />
        <p className="hint" style={{ margin: 0 }}>{t("requests.admin.notesHint")}</p>
        <div><button className="btn" disabled={pending || !note.trim()} onClick={() => start(async () => { await addRequestNote(id, note); setNote(""); router.refresh(); })}>{t("requests.admin.addNote")}</button></div>
      </section>
    </div>
  );
}
