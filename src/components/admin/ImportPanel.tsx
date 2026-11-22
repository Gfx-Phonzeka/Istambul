"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyImport, previewImport } from "@/lib/actions/import";
import type { ImportPreview } from "@/lib/import";
import { useI18n } from "@/lib/i18n/client";
import { Badge } from "@/components/ui";

export function ImportPanel({ dataset }: { dataset: "sessions" | "feeds" }) {
  const { t } = useI18n();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [deleteMissing, setDeleteMissing] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "danger" | "info"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [showUnchanged, setShowUnchanged] = useState(false);

  const fd = (f: File) => { const d = new FormData(); d.set("dataset", dataset); d.set("file", f); if (deleteMissing) d.set("deleteMissing", "on"); return d; };
  const errText = (e: string) => {
    if (e.startsWith("missing_columns:")) return t("import.errors.missing_columns", { cols: e.slice(16) });
    return t(`import.errors.${e}`) === `import.errors.${e}` ? `${t("common.error")} (${e})` : t(`import.errors.${e}`);
  };
  const rowErr = (m: string) => {
    const [k, v] = m.split(":");
    return t(`import.rowErrors.${k}`, { value: v ?? "" });
  };

  const onFile = (f: File) => {
    setFile(f); setPreview(null); setMsg(null);
    start(async () => {
      const r = await previewImport(fd(f));
      if (r.ok) setPreview(r.preview); else setMsg({ tone: "danger", text: errText(r.error) });
    });
  };

  const apply = () => file && start(async () => {
    const r = await applyImport(fd(file));
    if (r.ok) {
      setMsg({ tone: "success", text: t("import.applied", r.result) });
      setPreview(null); setFile(null);
      router.refresh();
    } else setMsg({ tone: "danger", text: errText(r.error) });
  });

  const counts = preview ? {
    new: preview.items.filter((i) => i.status === "new").length,
    changed: preview.items.filter((i) => i.status === "changed").length,
    unchanged: preview.items.filter((i) => i.status === "unchanged").length,
  } : null;

  return (
    <section className="card stack">
      <div className="row-between">
        <h2 className="card-title" style={{ margin: 0 }}>{t(`import.datasets.${dataset}`)}</h2>
        <a className="btn btn-sm" href={`/api/admin/import/${dataset}/template`}>⬇ {t("import.template")}</a>
      </div>
      <ol className="small" style={{ margin: 0, paddingLeft: 18 }}>
        <li>{t("import.step1")}</li><li>{t("import.step2")}</li><li>{t("import.step3")}</li>
      </ol>
      <div className="row">
        <input ref={input} type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
        <button type="button" className="btn btn-primary" disabled={pending} onClick={() => input.current?.click()}>{t("import.choose")}</button>
        {file && <span className="small muted">{file.name}</span>}
        {pending && <span className="small">{t("common.loading")}</span>}
      </div>
      {msg && <div className={`alert alert-${msg.tone}`}>{msg.text}</div>}
      {preview && counts && (
        <div className="stack">
          <div className="row">
            <Badge tone="success">{t("import.new", { n: counts.new })}</Badge>
            <Badge tone="info">{t("import.changed", { n: counts.changed })}</Badge>
            <Badge>{t("import.unchanged", { n: counts.unchanged })}</Badge>
            <Badge tone="warning">{t("import.notInFile", { n: preview.removed.length })}</Badge>
            {preview.errors.length > 0 && <Badge tone="danger">{t("import.errorsCount", { n: preview.errors.length })}</Badge>}
          </div>
          {preview.errors.length > 0 && (
            <div className="alert alert-danger">
              <strong>{t("import.fixErrors")}</strong>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {preview.errors.map((e, i) => <li key={i}>{t("import.row", { n: e.row })}{e.code ? ` (${e.code})` : ""}: {rowErr(e.message)}</li>)}
              </ul>
            </div>
          )}
          <div className="table-wrap" style={{ maxHeight: 360, overflowY: "auto" }}>
            <table className="table">
              <thead><tr><th>{t("import.code")}</th><th>{t("import.item")}</th><th>{t("common.status")}</th><th>{t("import.changes")}</th></tr></thead>
              <tbody>
                {preview.items.filter((i) => showUnchanged || i.status !== "unchanged").map((i) => (
                  <tr key={i.code}>
                    <td><code>{i.code}</code></td><td>{i.label}</td>
                    <td><Badge tone={i.status === "new" ? "success" : i.status === "changed" ? "info" : "neutral"}>{t(`import.status.${i.status}`)}</Badge></td>
                    <td className="small muted">{i.changes.map((c) => t(`import.fields.${c}`)).join(", ")}</td>
                  </tr>
                ))}
                {preview.removed.map((r) => (
                  <tr key={`rm-${r.code}`}>
                    <td><code>{r.code}</code></td><td>{r.label}</td>
                    <td><Badge tone={deleteMissing ? "danger" : "warning"}>{deleteMissing ? t("import.status.removed") : t("import.status.kept")}</Badge></td><td />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <label className="checkbox"><input type="checkbox" checked={showUnchanged} onChange={(e) => setShowUnchanged(e.target.checked)} /> <span>{t("import.showUnchanged")}</span></label>
          {preview.removed.length > 0 && (
            <label className="checkbox"><input type="checkbox" checked={deleteMissing} onChange={(e) => setDeleteMissing(e.target.checked)} /> <span>{t("import.deleteMissing", { n: preview.removed.length })}</span></label>
          )}
          <div className="row">
            <button type="button" className="btn btn-primary" disabled={pending || preview.errors.length > 0} onClick={apply}>{t("import.apply")}</button>
            <button type="button" className="btn" disabled={pending} onClick={() => { setPreview(null); setFile(null); }}>{t("common.cancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
