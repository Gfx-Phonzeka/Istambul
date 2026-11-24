"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CONTENT_TYPES, fieldLangs, primaryLang, usesTranslationPair, type ContentTypeKey, type Field } from "@/lib/content/registry";
import type { Locale } from "@/lib/event";
import { deleteContent, discardDraft, publishContent, saveContent, unpublishContent } from "@/lib/actions/content";
import { translateFields } from "@/lib/actions/translate";
import { useI18n } from "@/lib/i18n/client";
import { Badge } from "@/components/ui";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { useUnsavedGuard } from "@/lib/hooks/useUnsavedGuard";
import { ResumableUpload, fmtBytes, type UploadedFile } from "@/components/media/ResumableUpload";
import { addMediaVersion } from "@/lib/actions/media";

const RichTextEditor = dynamic(() => import("./RichTextEditor").then((m) => m.RichTextEditor), {
  ssr: false,
  loading: () => <div className="rte"><div className="rte-content muted">…</div></div>,
});

type Values = Record<string, string>;

export function ContentEditor({
  typeKey, id, initial, status, hasDraft, refOptions, previewUrl,
}: {
  typeKey: ContentTypeKey;
  id: string | null;
  initial: Values;
  status: "draft" | "published" | null;
  hasDraft: boolean;
  refOptions: Record<string, { value: string; label: string }[]>;
  previewUrl: string | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  // New Media Hub item: the file can be chosen before the first save; it becomes version 1 once the item exists.
  const [newFile, setNewFile] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPrefix] = useState(() => `assets/new-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);
  const type = CONTENT_TYPES[typeKey];
  const [values, setValues] = useState<Values>(initial);
  const [dirty, setDirty] = useState(false);
  useUnsavedGuard(dirty);
  const [msg, setMsg] = useState<{ tone: "success" | "danger" | "info"; text: string; at?: "translate" } | null>(null);
  const [errField, setErrField] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<Record<string, Locale>>({});

  const set = (col: string, v: string) => {
    setValues((s) => ({ ...s, [col]: v }));
    setDirty(true);
  };

  const [translating, setTranslating] = useState<string | null>(null);
  const bilingual = usesTranslationPair ? type.fields.filter((f) => f.bilingual) : [];

  /** Machine-translates the English text of the given fields into the Turkish fields. */
  const translate = async (names: string[], onlyEmpty: boolean, tag: string) => {
    const items = names
      .filter((n) => (values[`${n}_en`] ?? "").trim() !== "" && (!onlyEmpty || (values[`${n}_tr`] ?? "").trim() === ""))
      .map((n) => ({ key: n, text: values[`${n}_en`], html: type.fields.find((f) => f.name === n)?.kind === "richtext" }));
    if (!items.length) { setMsg({ at: "translate", tone: "info", text: t("translate.nothing") }); return; }
    setTranslating(tag);
    setMsg(null);
    const r = await translateFields(items);
    setTranslating(null);
    if (!r.ok) { setMsg({ at: "translate", tone: "danger", text: t(`translate.errors.${r.error}`) }); return; }
    setValues((s) => ({ ...s, ...Object.fromEntries(Object.entries(r.translations).map(([k, v]) => [`${k}_tr`, v])) }));
    setDirty(true);
    setMsg({ at: "translate", tone: "info", text: t("translate.done") });
  };

  const run = (fn: () => Promise<void>) => start(async () => { setMsg(null); setErrField(null); await fn(); });

  const save = async (): Promise<string | null> => {
    const res = await saveContent(typeKey, id, values);
    if (!res.ok) {
      setMsg({ tone: "danger", text: t(res.error) });
      setErrField(res.field ?? null);
      if (res.field) { const el = document.getElementById(`f-${res.field}`); el?.scrollIntoView({ behavior: "smooth", block: "center" }); (el?.querySelector("[contenteditable]") as HTMLElement | null ?? el)?.focus({ preventScroll: true }); }
      return null;
    }
    setDirty(false);
    if (!id && newFile && typeKey === "media_asset") {
      const ext = newFile.name.includes(".") ? newFile.name.split(".").pop()!.toUpperCase() : "";
      const v = await addMediaVersion(res.id, { file_path: newFile.path, file_name: newFile.name, file_size: newFile.size, mime: newFile.mime, format: ext,
        duration_seconds: newFile.duration ? String(Math.round(newFile.duration)) : "", resolution: newFile.width && newFile.height ? `${newFile.width}×${newFile.height}` : "" });
      if (!v.ok) setMsg({ tone: "danger", text: `${t("common.error")} (${v.error})` });
    }
    return res.id;
  };

  const onSave = () => run(async () => {
    const newId = await save();
    if (!newId) return;
    if (!id) { router.replace(`/admin/content/${typeKey}/${newId}?m=saved`); return; }
    setMsg({ tone: status === "published" ? "info" : "success", text: status === "published" ? t("cms.savedDraftOfPublished") : t("cms.saved") });
    router.refresh();
  });

  const onPublish = () => run(async () => {
    const savedId = dirty || !id ? await save() : id;
    if (!savedId) return;
    const res = await publishContent(typeKey, savedId);
    if (!res.ok) { setMsg({ tone: "danger", text: t(res.error) }); return; }
    if (!id) { router.replace(`/admin/content/${typeKey}/${savedId}?m=published`); return; }
    setMsg({ tone: "success", text: t("cms.published") });
    router.refresh();
  });

  const onUnpublish = () => run(async () => {
    if (dirty && !(await save())) return;
    const res = await unpublishContent(typeKey, id!);
    setMsg(res.ok ? { tone: "info", text: t("cms.unpublished") } : { tone: "danger", text: t(res.error) });
    router.refresh();
  });

  const onDiscard = () => run(async () => {
    const res = await discardDraft(typeKey, id!);
    if (res.ok) { setMsg({ tone: "info", text: t("cms.discarded") }); router.refresh(); window.location.reload(); }
  });

  const onDelete = () => {
    run(async () => {
      const res = await deleteContent(typeKey, id!);
      if (res.ok) router.replace(`/admin/content/${typeKey}`);
      else setMsg({ tone: "danger", text: t(res.error) });
    });
  };

  const input = (f: Field, col: string, lang?: Locale) => {
    const v = values[col] ?? "";
    const invalid = errField === col;
    const common = { id: `f-${col}`, name: col, autoComplete: "off", "aria-invalid": invalid || undefined };
    switch (f.kind) {
      case "richtext":
        return <RichTextEditor id={`f-${col}`} value={v} onChange={(h) => set(col, h)} />;
      case "textarea":
        return <textarea {...common} className="textarea" value={v} onChange={(e) => set(col, e.target.value)} rows={4} />;
      case "select":
        return (
          <select {...common} className="select" value={v} onChange={(e) => set(col, e.target.value)}>
            {f.options!.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
            {v.startsWith("svg:") && <option value={v}>{t("cms.fields.fieldShapeCustom")}</option>}
          </select>
        );
      case "reference":
        return (
          <select {...common} className="select" value={v} onChange={(e) => set(col, e.target.value)}>
            <option value="">—</option>
            {(refOptions[f.name] ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        );
      case "number":
        return <input {...common} className="input" type="number" value={v} onChange={(e) => set(col, e.target.value)} style={{ maxWidth: 140 }} />;
      case "datetime":
        return <input {...common} className="input" type="datetime-local" value={v} onChange={(e) => set(col, e.target.value)} style={{ maxWidth: 260 }} />;
      case "boolean":
        return (
          <label className="checkbox" style={{ marginTop: 4 }}>
            <input {...common} type="checkbox" checked={v === "true"} onChange={(e) => set(col, e.target.checked ? "true" : "false")} />
            <span>{t(f.label)}</span>
          </label>
        );
      case "date":
        return <input {...common} className="input" type="date" value={v} onChange={(e) => set(col, e.target.value)} style={{ maxWidth: 200 }} />;
      case "email":
        return <input {...common} className="input" type="email" spellCheck={false} value={v} onChange={(e) => set(col, e.target.value)} />;
      default:
        return <input {...common} className="input" type="text" value={v} onChange={(e) => set(col, e.target.value)} lang={lang} />;
    }
  };

  return (
    <div className="stack">
      <div className="row-between">
        <div className="row">
          {status === "published" && <Badge tone="success">{t("cms.status.published")}</Badge>}
          {status === "draft" && <Badge tone="warning">{t("cms.status.draft")}</Badge>}
          {(hasDraft || (status === "published" && dirty)) && <Badge tone="info">{t("cms.status.changes")}</Badge>}
        </div>
        {previewUrl && id && (
          <a className="btn btn-sm" href={previewUrl} target="_blank" rel="noreferrer">
            {status === "published" && !hasDraft ? t("cms.viewOnSite") : t("cms.preview")} ↗
          </a>
        )}
      </div>
      {msg?.at === "translate" && <div className={`alert alert-${msg.tone}`} role="status">{msg.text}</div>}

      {bilingual.length > 0 && (
        <div className="row translate-bar">
          <span className="small muted">{t("translate.hint")}</span>
          <button type="button" className="btn btn-sm" disabled={Boolean(translating)} onClick={() => translate(bilingual.map((f) => f.name), true, "all-empty")}>
            {translating === "all-empty" ? t("translate.working") : t("translate.fillEmpty")}
          </button>
          <ConfirmButton className="btn btn-sm btn-ghost" disabled={Boolean(translating)} danger={false}
            message={t("translate.overwriteConfirm")} onConfirm={() => translate(bilingual.map((f) => f.name), false, "all")}>
            {translating === "all" ? t("translate.working") : t("translate.overwriteAll")}
          </ConfirmButton>
        </div>
      )}

      <div className="card stack">
        {type.fields.map((f) => {
          if (f.langs || (f.bilingual && !usesTranslationPair)) {
            const langs = fieldLangs(f)!;
            if (f.kind === "richtext") {
              const lang = tab[f.name] ?? langs[0];
              return (
                <div key={f.name} className="field">
                  <div className="row-between">
                    <span className="label">{t(f.label)}{f.required ? " *" : ""}</span>
                    <div className="lang-switch" role="tablist">
                      {langs.map((l) => (
                        <button key={l} type="button" role="tab" aria-pressed={lang === l} onClick={() => setTab((s) => ({ ...s, [f.name]: l }))}>
                          {l.toUpperCase()}{!(values[`${f.name}_${l}`] ?? "") ? " ·" : ""}
                        </button>
                      ))}
                    </div>
                  </div>
                  {langs.map((l) => <div key={l} style={{ display: lang === l ? "block" : "none" }}>{input(f, `${f.name}_${l}`, l)}</div>)}
                  {langs.map((l) => errField === `${f.name}_${l}` && <span key={l} className="field-error">{msg?.text}</span>)}
                </div>
              );
            }
            return (
              <div key={f.name} className="form-grid">
                {langs.map((l) => (
                  <div key={l} className="field">
                    <label htmlFor={`f-${f.name}_${l}`}>{t(f.label)} ({l.toUpperCase()}){f.required && l === primaryLang(f) ? " *" : ""}</label>
                    {input(f, `${f.name}_${l}`, l)}
                    {errField === `${f.name}_${l}` && <span className="field-error">{msg?.text}</span>}
                  </div>
                ))}
              </div>
            );
          }
          if (!f.bilingual) {
            return (
              <div key={f.name} className="field">
                {f.kind !== "boolean" && <label htmlFor={`f-${f.name}`}>{t(f.label)}{f.required ? " *" : ""}</label>}
                {input(f, f.name)}
                {f.help && <span className="hint">{t(f.help)}</span>}
                {errField === f.name && <span className="field-error">{msg?.text}</span>}
              </div>
            );
          }
          if (f.kind === "richtext") {
            const lang = tab[f.name] ?? "en";
            return (
              <div key={f.name} className="field">
                <div className="row-between">
                  <span className="label">{t(f.label)}{f.required ? " *" : ""}</span>
                  <div className="lang-switch" role="tablist">
                    {(["en", "tr"] as const).map((l) => (
                      <button key={l} type="button" role="tab" aria-pressed={lang === l} onClick={() => setTab((s) => ({ ...s, [f.name]: l }))}>
                        {l.toUpperCase()}{l === "tr" && !(values[`${f.name}_tr`] ?? "") ? " ·" : ""}
                      </button>
                    ))}
                  </div>
                </div>
                {lang === "tr" && (
                  <div className="row-between">
                    <span className="hint">{t("cms.trFallback")}</span>
                    <button type="button" className="btn btn-sm" disabled={Boolean(translating)} onClick={() => translate([f.name], false, f.name)}>
                      {translating === f.name ? t("translate.working") : `⇄ ${t("translate.fromEnglish")}`}
                    </button>
                  </div>
                )}
                <div style={{ display: lang === "en" ? "block" : "none" }}>{input(f, `${f.name}_en`, "en")}</div>
                <div style={{ display: lang === "tr" ? "block" : "none" }}>{input(f, `${f.name}_tr`, "tr")}</div>
                {(errField === `${f.name}_en`) && <span className="field-error">{msg?.text}</span>}
              </div>
            );
          }
          return (
            <div key={f.name} className="form-grid">
              {(["en", "tr"] as const).map((l) => (
                <div key={l} className="field">
                  <label htmlFor={`f-${f.name}_${l}`}>
                    {t(f.label)} ({l.toUpperCase()}){f.required && l === "en" ? " *" : ""}
                  </label>
                  {input(f, `${f.name}_${l}`, l)}
                  {l === "tr" && (
                    <div className="row-between">
                      <span className="hint">{t("cms.trFallback")}</span>
                      <button type="button" className="btn btn-ghost btn-sm" disabled={Boolean(translating)} onClick={() => translate([f.name], false, f.name)}>
                        {translating === f.name ? t("translate.working") : `⇄ ${t("translate.fromEnglish")}`}
                      </button>
                    </div>
                  )}
                  {errField === `${f.name}_${l}` && <span className="field-error">{msg?.text}</span>}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {!id && typeKey === "media_asset" && (
        <section className="card stack-sm" aria-labelledby="new-file">
          <h2 id="new-file" className="card-title" style={{ margin: 0 }}>{t("mediaHub.admin.file")}</h2>
          <p className="hint" style={{ margin: 0 }}>{t("mediaHub.admin.newFileHelp")}</p>
          {newFile ? (
            <div className="row">
              <strong>{newFile.name}</strong><span className="muted small">{fmtBytes(newFile.size)}</span>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setNewFile(null)}>{t("reports.remove")}</button>
            </div>
          ) : (
            <ResumableUpload bucket="media-files" prefix={uploadPrefix} label={t("mediaHub.admin.uploadFile")} onBusy={setUploading} onUploaded={(f) => { setNewFile(f); setDirty(true); }} />
          )}
        </section>
      )}

      <div className="editor-actions">
        <Link href={`/admin/content/${typeKey}`} className="btn btn-ghost">← {t("cms.backToList")}</Link>
        {msg && msg.at !== "translate" && <div className={`alert alert-${msg.tone} editor-msg`} role="status">{msg.text}</div>}
        <div className="row">
          {id && <ConfirmButton className="btn btn-ghost" onConfirm={onDelete} disabled={pending} style={{ color: "var(--color-danger)" }} message={t("cms.deleteConfirm")}>{t("cms.delete")}</ConfirmButton>}
          {id && hasDraft && <button type="button" className="btn" onClick={onDiscard} disabled={pending}>{t("cms.discardDraft")}</button>}
          {id && status === "published" && <button type="button" className="btn" onClick={onUnpublish} disabled={pending}>{t("cms.unpublish")}</button>}
          {uploading && <span className="small muted" role="status">{t("mediaHub.admin.waitUpload")}</span>}
          <button type="button" className="btn" onClick={onSave} disabled={pending || uploading}>{status === "published" ? t("cms.saveDraft") : t("cms.save")}</button>
          <button type="button" className="btn btn-primary" onClick={onPublish} disabled={pending || uploading}>
            {status === "published" ? t("cms.publishChanges") : t("cms.publish")}
          </button>
        </div>
      </div>
    </div>
  );
}
