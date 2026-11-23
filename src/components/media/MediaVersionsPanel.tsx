"use client";
import { intlLocale } from "@/lib/i18n";
import { EVENT } from "@/lib/event";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ResumableUpload, fmtBytes, type UploadedFile } from "./ResumableUpload";
import { addMediaVersion, setMediaPreview, updateVersionSpecs, type VersionInput } from "@/lib/actions/media";
import { useI18n } from "@/lib/i18n/client";
import { Badge } from "@/components/ui";

export interface VersionRow {
  id: string; version_number: number; is_current: boolean; file_name: string; file_size: number | null; mime: string | null;
  format: string | null; codec: string | null; resolution: string | null; frame_rate: string | null; duration_seconds: number | null;
  notes: string | null; created_at: string; archived_at: string | null;
}

const SPEC_FIELDS = ["format", "codec", "resolution", "frame_rate", "duration_seconds", "notes"] as const;
type Specs = Record<(typeof SPEC_FIELDS)[number], string>;

function guessFormat(f: UploadedFile) {
  const ext = f.name.split(".").pop()?.toUpperCase() ?? "";
  return ext || f.mime;
}

function SpecsForm({ idPrefix, initial, onSave, saveLabel, pending }: { idPrefix: string; initial: Specs; onSave: (s: Specs) => void; saveLabel: string; pending: boolean }) {
  const { t } = useI18n();
  const [s, setS] = useState<Specs>(initial);
  return (
    <div className="stack-sm">
      <div className="form-grid">
        {SPEC_FIELDS.map((k) => (
          <div key={k} className="field">
            <label htmlFor={`${idPrefix}-${k}`}>{t(`mediaHub.specs.${k}`)}</label>
            <input id={`${idPrefix}-${k}`} className="input" value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })}
              placeholder={t(`mediaHub.specsPlaceholder.${k}`)} inputMode={k === "duration_seconds" ? "decimal" : undefined} />
          </div>
        ))}
      </div>
      <div><button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={() => onSave(s)}>{saveLabel}</button></div>
    </div>
  );
}

export function MediaVersionsPanel({ assetId, versions, previewUrl, previewKind, isAdmin }: {
  assetId: string; versions: VersionRow[]; previewUrl: string | null; previewKind: string | null; isAdmin: boolean;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const current = versions.find((v) => v.is_current);
  const archived = versions.filter((v) => !v.is_current);
  const date = (d: string) => new Date(d).toLocaleString(intlLocale(locale), { dateStyle: "medium", timeStyle: "short", timeZone: EVENT.tz });

  const saveNew = (s: Specs) => start(async () => {
    if (!uploaded) return;
    const input: VersionInput = { file_path: uploaded.path, file_name: uploaded.name, file_size: uploaded.size, mime: uploaded.mime, ...s };
    const r = await addMediaVersion(assetId, input);
    if (r.ok) { setUploaded(null); setMsg(t("mediaHub.admin.versionAdded")); router.refresh(); } else setMsg(`${t("common.error")} (${r.error})`);
  });

  const toSpecs = (v?: Partial<VersionRow> | null): Specs => ({
    format: v?.format ?? "", codec: v?.codec ?? "", resolution: v?.resolution ?? "", frame_rate: v?.frame_rate ?? "",
    duration_seconds: v?.duration_seconds != null ? String(v.duration_seconds) : "", notes: v?.notes ?? "",
  });

  return (
    <div className="stack">
      <section className="card stack">
        <h2 className="card-title" style={{ margin: 0 }}>{t("mediaHub.admin.file")}</h2>
        <p className="hint" style={{ margin: 0 }}>{t("mediaHub.admin.uploadHelp")}</p>
        {msg && <div className="alert alert-info small">{msg}</div>}
        {current ? (
          <div className="stack-sm">
            <div className="row">
              <Badge tone="success">v{current.version_number}</Badge>
              <strong>{current.file_name}</strong>
              <span className="muted small">{current.file_size ? fmtBytes(current.file_size) : ""} · {date(current.created_at)}</span>
              <a className="btn btn-sm" href={`/api/media/${assetId}/download?admin=1`}>{t("mediaHub.download")}</a>
            </div>
            <details>
              <summary className="small" style={{ cursor: "pointer" }}>{t("mediaHub.admin.editSpecs")}</summary>
              <SpecsForm idPrefix="cur" initial={toSpecs(current)} pending={pending} saveLabel={t("common.save")}
                onSave={(s) => start(async () => { const r = await updateVersionSpecs(current.id, s); setMsg(r.ok ? t("common.saved") : t("common.error")); router.refresh(); })} />
            </details>
          </div>
        ) : (
          <p className="muted small" style={{ margin: 0 }}>{t("mediaHub.admin.noFile")}</p>
        )}
        {uploaded ? (
          <div className="stack-sm card" style={{ background: "var(--color-surface-muted)" }}>
            <strong className="small">{t("mediaHub.admin.newVersionOf", { n: (versions[0]?.version_number ?? 0) + 1 })}: {uploaded.name} ({fmtBytes(uploaded.size)})</strong>
            <SpecsForm
              idPrefix="spec"
              pending={pending}
              saveLabel={t("mediaHub.admin.saveVersion")}
              initial={{
                ...toSpecs(current),
                format: guessFormat(uploaded),
                resolution: uploaded.width && uploaded.height ? `${uploaded.width}×${uploaded.height}` : current?.resolution ?? "",
                duration_seconds: uploaded.duration ? String(Math.round(uploaded.duration * 100) / 100) : "",
                notes: "",
              }}
              onSave={saveNew}
            />
          </div>
        ) : (
          <ResumableUpload bucket="media-files" prefix={`assets/${assetId}`} label={current ? t("mediaHub.admin.uploadNewVersion") : t("mediaHub.admin.uploadFile")}
            onUploaded={(f) => setUploaded(f)} />
        )}
      </section>

      <section className="card stack">
        <h2 className="card-title" style={{ margin: 0 }}>{t("mediaHub.admin.preview")}</h2>
        <p className="hint" style={{ margin: 0 }}>{t("mediaHub.admin.previewHelp")}</p>
        {previewUrl && (previewKind === "video"
          ? <video src={previewUrl} muted loop autoPlay playsInline style={{ maxWidth: 320, borderRadius: 8 }} />
          : <img src={previewUrl} alt="" width={320} height={180} decoding="async" style={{ maxWidth: 320, width: "100%", height: "auto", borderRadius: 8 }} />)}
        <div className="row">
          <ResumableUpload bucket="media-previews" prefix={`assets/${assetId}`} accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
            label={previewUrl ? t("mediaHub.admin.replacePreview") : t("mediaHub.admin.uploadPreview")}
            onUploaded={async (f) => { await setMediaPreview(assetId, f.path, f.mime.startsWith("video/") ? "video" : "image"); router.refresh(); }} />
          {previewUrl && <button type="button" className="btn btn-sm btn-ghost" onClick={() => start(async () => { await setMediaPreview(assetId, null, null); router.refresh(); })}>{t("cms.delete")}</button>}
        </div>
      </section>

      {isAdmin && (
        <section className="card stack">
          <h2 className="card-title" style={{ margin: 0 }}>{t("mediaHub.admin.archived")}</h2>
          <p className="hint" style={{ margin: 0 }}>{t("mediaHub.admin.archivedHelp")}</p>
          {archived.length === 0 ? <p className="muted small" style={{ margin: 0 }}>—</p> : (
            <ul className="list">
              {archived.map((v) => (
                <li key={v.id} className="row">
                  <Badge>v{v.version_number}</Badge>
                  <span>{v.file_name}</span>
                  <span className="muted small">{v.file_size ? fmtBytes(v.file_size) : ""} · {date(v.created_at)} → {v.archived_at ? date(v.archived_at) : ""}</span>
                  <a className="btn btn-sm" href={`/api/media/version/${v.id}`}>{t("mediaHub.download")}</a>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
