"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/client";
import { addPqcReport, deleteDailyReport, deletePqcReport, discardReportUpload, saveDailyReport } from "@/lib/actions/reports";
import { REPORT_MAX_BYTES, type ReportFile } from "@/lib/reports";

type Opt = { id: string; title: string };

async function uploadFile(uid: string, file: File): Promise<ReportFile> {
  if (file.size > REPORT_MAX_BYTES) throw new Error("too_big");
  const safe = file.name.normalize("NFKD").replace(/[^\w.\-]+/g, "_").slice(-80) || "file";
  const path = `${uid}/${crypto.randomUUID()}-${safe}`;
  const { error } = await createClient().storage.from("reports").upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (error) throw error;
  return { path, name: file.name, size: file.size };
}

export const fileHref = (f: { path: string; name: string }) => `/api/reports/file?path=${encodeURIComponent(f.path)}&name=${encodeURIComponent(f.name)}`;

function Selects({ venues, sports, venue, sport, setVenue, setSport }: { venues: Opt[]; sports: Opt[]; venue: string; sport: string; setVenue: (v: string) => void; setSport: (v: string) => void }) {
  const { t } = useI18n();
  return (
    <>
      <div className="field">
        <label htmlFor="r-venue">{t("schedule.venue")}</label>
        <select id="r-venue" className="select" value={venue} onChange={(e) => setVenue(e.target.value)}>
          <option value="">—</option>
          {venues.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="r-sport">{t("venues.sport")}</label>
        <select id="r-sport" className="select" value={sport} onChange={(e) => setSport(e.target.value)}>
          <option value="">—</option>
          {sports.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </div>
    </>
  );
}

export interface DailyReportValues {
  id?: string; venue_id: string; sport_id: string; sessions: string; summary: string;
  technical_issues: string; editorial_issues: string; attachments: ReportFile[]; updated_at?: string;
}

export function DailyReportForm({ uid, date, initial, venues, sports }: { uid: string; date: string; initial: DailyReportValues; venues: Opt[]; sports: Opt[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const fresh = useRef<string[]>([]);
  const set = <K extends keyof DailyReportValues>(k: K, val: DailyReportValues[K]) => setV((x) => ({ ...x, [k]: val }));

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true); setMsg(null);
    try {
      const added: ReportFile[] = [];
      for (const f of Array.from(files)) { const up = await uploadFile(uid, f); fresh.current.push(up.path); added.push(up); }
      setV((x) => ({ ...x, attachments: [...x.attachments, ...added] }));
    } catch (e) {
      setMsg({ tone: "danger", text: t((e as Error).message === "too_big" ? "reports.errors.tooBig" : "reports.errors.upload") });
    } finally { setUploading(false); }
  };

  const remove = (p: string) => {
    setV((x) => ({ ...x, attachments: x.attachments.filter((a) => a.path !== p) }));
    if (fresh.current.includes(p)) { fresh.current = fresh.current.filter((x) => x !== p); void discardReportUpload(p); }
  };

  const save = () => start(async () => {
    setMsg(null);
    const r = await saveDailyReport({ ...v, report_date: date });
    if (r.ok) { fresh.current = []; setMsg({ tone: "success", text: t("reports.saved") }); router.refresh(); }
    else setMsg({ tone: "danger", text: t(`reports.errors.${r.error === "summary" ? "summary" : "generic"}`) });
  });

  const del = () => start(async () => {
    if (!v.id || !confirm(t("reports.confirmDelete"))) return;
    const r = await deleteDailyReport(v.id);
    if (r.ok) router.refresh(); else setMsg({ tone: "danger", text: t("reports.errors.generic") });
  });

  return (
    <div className="stack">
      {msg && <div className={`alert alert-${msg.tone}`}>{msg.text}</div>}
      <div className="form-grid">
        <Selects venues={venues} sports={sports} venue={v.venue_id} sport={v.sport_id} setVenue={(x) => set("venue_id", x)} setSport={(x) => set("sport_id", x)} />
        <div className="field">
          <label htmlFor="r-sessions">{t("reports.sessions")}</label>
          <input id="r-sessions" className="input" value={v.sessions} maxLength={500} placeholder={t("reports.sessionsHint")} onChange={(e) => set("sessions", e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="r-summary">{t("reports.summary")} *</label>
        <textarea id="r-summary" className="textarea" rows={6} maxLength={10000} value={v.summary} placeholder={t("reports.summaryHint")} onChange={(e) => set("summary", e.target.value)} />
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="r-tech">{t("reports.technical")}</label>
          <textarea id="r-tech" className="textarea" rows={5} maxLength={10000} value={v.technical_issues} placeholder={t("reports.noneHint")} onChange={(e) => set("technical_issues", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="r-edit">{t("reports.editorial")}</label>
          <textarea id="r-edit" className="textarea" rows={5} maxLength={10000} value={v.editorial_issues} placeholder={t("reports.noneHint")} onChange={(e) => set("editorial_issues", e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="r-files">{t("reports.attachments")}</label>
        {v.attachments.length > 0 && (
          <ul className="stack-sm" style={{ listStyle: "none", padding: 0, margin: "0 0 8px" }}>
            {v.attachments.map((a) => (
              <li key={a.path} className="row">
                <a href={fileHref(a)} target="_blank" rel="noreferrer">{a.name}</a>
                <span className="muted small">{Math.max(1, Math.round(a.size / 1024))} KB</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(a.path)}>{t("reports.remove")}</button>
              </li>
            ))}
          </ul>
        )}
        <input id="r-files" type="file" multiple disabled={uploading} onChange={(e) => { void onFiles(e.target.files); e.target.value = ""; }} />
        <span className="muted small">{uploading ? t("reports.uploading") : t("reports.attachmentsHint")}</span>
      </div>
      <div className="row">
        <button type="button" className="btn btn-primary" disabled={pending || uploading} onClick={save}>{pending ? t("common.saving") : v.id ? t("reports.update") : t("reports.submit")}</button>
        {v.id && <button type="button" className="btn btn-ghost" disabled={pending} onClick={del}>{t("reports.delete")}</button>}
      </div>
    </div>
  );
}

export function PqcForm({ uid, date, venues, sports }: { uid: string; date: string; venues: Opt[]; sports: Opt[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [venue, setVenue] = useState("");
  const [sport, setSport] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [day, setDay] = useState(date);
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = () => start(async () => {
    setMsg(null);
    if (!file && !url.trim()) { setMsg({ tone: "danger", text: t("reports.errors.source") }); return; }
    let up: ReportFile | null = null;
    try { if (file) up = await uploadFile(uid, file); }
    catch (e) { setMsg({ tone: "danger", text: t((e as Error).message === "too_big" ? "reports.errors.tooBig" : "reports.errors.upload") }); return; }
    const r = await addPqcReport({ report_date: day, venue_id: venue, sport_id: sport, title, url: url.trim(), file: up });
    if (r.ok) {
      setTitle(""); setUrl(""); setFile(null); if (fileRef.current) fileRef.current.value = "";
      setMsg({ tone: "success", text: t("reports.pqcSaved") }); router.refresh();
    } else {
      if (up) void discardReportUpload(up.path);
      setMsg({ tone: "danger", text: t(`reports.errors.${r.error === "url" || r.error === "source" ? r.error : "generic"}`) });
    }
  });

  return (
    <div className="stack">
      {msg && <div className={`alert alert-${msg.tone}`}>{msg.text}</div>}
      <div className="form-grid">
        <div className="field">
          <label htmlFor="p-date">{t("reports.date")} *</label>
          <input id="p-date" type="date" className="input" value={day} onChange={(e) => setDay(e.target.value)} />
        </div>
        <Selects venues={venues} sports={sports} venue={venue} sport={sport} setVenue={setVenue} setSport={setSport} />
        <div className="field">
          <label htmlFor="p-title">{t("reports.pqcTitle")}</label>
          <input id="p-title" className="input" value={title} maxLength={200} placeholder={t("reports.pqcTitleHint")} onChange={(e) => setTitle(e.target.value)} />
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="p-file">{t("reports.pqcFile")}</label>
          <input id="p-file" ref={fileRef} type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <div className="field">
          <label htmlFor="p-url">{t("reports.pqcUrl")}</label>
          <input id="p-url" type="url" className="input" value={url} placeholder="https://…" onChange={(e) => setUrl(e.target.value)} />
        </div>
      </div>
      <div><button type="button" className="btn btn-primary" disabled={pending} onClick={submit}>{pending ? t("common.saving") : t("reports.pqcAdd")}</button></div>
    </div>
  );
}

export function DeletePqcButton({ id }: { id: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button type="button" className="btn btn-ghost btn-sm" disabled={pending}
      onClick={() => start(async () => { if (confirm(t("reports.confirmDelete")) && (await deletePqcReport(id)).ok) router.refresh(); })}>
      {t("reports.delete")}
    </button>
  );
}
