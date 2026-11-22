"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { ResumableUpload, fmtBytes, type UploadedFile } from "@/components/media/ResumableUpload";
import { addCameraDrawing, discardUploadedDrawing, signDrawingPath } from "@/lib/actions/venues";
import { Badge } from "@/components/ui";
import { PdfViewer } from "./PdfViewer";

export interface DrawingRow { id: string; version_number: number; is_current: boolean; file_name: string; file_size: number | null; created_at: string; archived_at: string | null; notes: string | null }

export function DrawingPanel({ planId, drawings, cameras, isAdmin }: {
  planId: string; drawings: DrawingRow[]; cameras: { number: string; type: string }[]; isAdmin: boolean;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [uploaded, setUploaded] = useState<(UploadedFile & { url: string | null }) | null>(null);
  const [checked, setChecked] = useState(false);
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const current = drawings.find((d) => d.is_current);
  const archived = drawings.filter((d) => !d.is_current);
  const date = (d: string) => new Date(d).toLocaleString(locale === "tr" ? "tr-TR" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" });

  return (
    <section className="card stack">
      <h2 className="card-title" style={{ margin: 0 }}>{t("cameraMaps.admin.drawing")}</h2>
      <p className="hint" style={{ margin: 0 }}>{t("cameraMaps.admin.drawingHelp")}</p>
      {msg && <div className={`alert alert-${msg.tone} small`}>{msg.text}</div>}
      {current ? (
        <div className="row">
          <Badge tone="success">v{current.version_number}</Badge>
          <strong>{current.file_name}</strong>
          <span className="muted small">{current.file_size ? fmtBytes(current.file_size) : ""} · {date(current.created_at)}</span>
          <a className="btn btn-sm" href={`/api/camera-plans/${planId}/drawing`}>{t("mediaHub.download")}</a>
        </div>
      ) : <p className="muted small" style={{ margin: 0 }}>{t("cameraMaps.noDrawing")}</p>}

      {!uploaded ? (
        <ResumableUpload bucket="camera-drawings" prefix={`plans/${planId}`} accept="application/pdf,.pdf"
          label={current ? t("cameraMaps.admin.uploadNewDrawing") : t("cameraMaps.admin.uploadDrawing")}
          onUploaded={async (f) => { setChecked(false); setUploaded({ ...f, url: await signDrawingPath(f.path) }); }} />
      ) : (
        <div className="stack">
          <div className="alert alert-warning small">{t("cameraMaps.admin.checkNumbering")}</div>
          <div className="numbering-check">
            <div>{uploaded.url ? <PdfViewer url={uploaded.url} /> : <p className="muted small">{uploaded.name}</p>}</div>
            <div className="card" style={{ padding: "var(--space-3)" }}>
              <strong className="small">{t("cameraMaps.admin.cameraNumbers", { n: cameras.length })}</strong>
              <table className="table" style={{ marginTop: 8 }}>
                <thead><tr><th>{t("cameraMaps.cols.number")}</th><th>{t("cameraMaps.cols.type")}</th></tr></thead>
                <tbody>{cameras.map((c, i) => <tr key={`${c.number}-${i}`}><td><strong>{c.number}</strong></td><td>{t(`cameraTypes.${c.type}`)}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
          <div className="field">
            <label htmlFor="drawing-notes">{t("mediaHub.specs.notes")}</label>
            <input id="drawing-notes" className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <label className="checkbox"><input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} /> <span>{t("cameraMaps.admin.confirmNumbering")}</span></label>
          <div className="row">
            <button type="button" className="btn btn-primary" disabled={!checked || pending} onClick={() => start(async () => {
              const r = await addCameraDrawing(planId, { file_path: uploaded.path, file_name: uploaded.name, file_size: uploaded.size, notes, numbering_checked: checked });
              if (r.ok) { setUploaded(null); setNotes(""); setMsg({ tone: "success", text: t("cameraMaps.admin.drawingSaved") }); router.refresh(); }
              else setMsg({ tone: "danger", text: `${t("common.error")} (${r.error})` });
            })}>{t("cameraMaps.admin.saveDrawing")}</button>
            <button type="button" className="btn" disabled={pending} onClick={() => start(async () => { await discardUploadedDrawing(uploaded.path); setUploaded(null); })}>{t("common.cancel")}</button>
          </div>
        </div>
      )}

      {isAdmin && archived.length > 0 && (
        <div className="stack-sm">
          <strong className="small">{t("mediaHub.admin.archived")}</strong>
          <ul className="list">
            {archived.map((d) => (
              <li key={d.id} className="row">
                <Badge>v{d.version_number}</Badge><span>{d.file_name}</span>
                <span className="muted small">{date(d.created_at)} → {d.archived_at ? date(d.archived_at) : ""}</span>
                <a className="btn btn-sm" href={`/api/camera-plans/${planId}/drawing?version=${d.id}`}>{t("mediaHub.download")}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
