"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CONTENT_TYPES, type ContentTypeKey, type Field } from "@/lib/content/registry";
import { deleteContent, discardDraft, publishContent, saveContent, unpublishContent } from "@/lib/actions/content";
import { useI18n } from "@/lib/i18n/client";
import { Badge } from "@/components/ui";

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
  const type = CONTENT_TYPES[typeKey];
  const [values, setValues] = useState<Values>(initial);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "danger" | "info"; text: string } | null>(null);
  const [errField, setErrField] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<Record<string, "en" | "tr">>({});

  const set = (col: string, v: string) => {
    setValues((s) => ({ ...s, [col]: v }));
    setDirty(true);
  };

  const run = (fn: () => Promise<void>) => start(async () => { setMsg(null); setErrField(null); await fn(); });

  const save = async (): Promise<string | null> => {
    const res = await saveContent(typeKey, id, values);
    if (!res.ok) {
      setMsg({ tone: "danger", text: t(res.error) });
      setErrField(res.field ?? null);
      if (res.field) document.getElementById(`f-${res.field}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return null;
    }
    setDirty(false);
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
    if (!confirm(t("cms.deleteConfirm"))) return;
    run(async () => {
      const res = await deleteContent(typeKey, id!);
      if (res.ok) router.replace(`/admin/content/${typeKey}`);
      else setMsg({ tone: "danger", text: t(res.error) });
    });
  };

  const input = (f: Field, col: string, lang?: "en" | "tr") => {
    const v = values[col] ?? "";
    const invalid = errField === col;
    const common = { id: `f-${col}`, "aria-invalid": invalid || undefined };
    switch (f.kind) {
      case "richtext":
        return <RichTextEditor id={`f-${col}`} value={v} onChange={(h) => set(col, h)} />;
      case "textarea":
        return <textarea {...common} className="textarea" value={v} onChange={(e) => set(col, e.target.value)} rows={4} />;
      case "select":
        return (
          <select {...common} className="select" value={v} onChange={(e) => set(col, e.target.value)}>
            {f.options!.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
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
      case "date":
        return <input {...common} className="input" type="date" value={v} onChange={(e) => set(col, e.target.value)} style={{ maxWidth: 200 }} />;
      case "email":
        return <input {...common} className="input" type="email" value={v} onChange={(e) => set(col, e.target.value)} />;
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
      {msg && <div className={`alert alert-${msg.tone}`} role="status">{msg.text}</div>}

      <div className="card stack">
        {type.fields.map((f) => {
          if (!f.bilingual) {
            return (
              <div key={f.name} className="field">
                <label htmlFor={`f-${f.name}`}>{t(f.label)}{f.required ? " *" : ""}</label>
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
                {lang === "tr" && <span className="hint">{t("cms.trFallback")}</span>}
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
                  {l === "tr" && <span className="hint">{t("cms.trFallback")}</span>}
                  {errField === `${f.name}_${l}` && <span className="field-error">{msg?.text}</span>}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="editor-actions">
        <Link href={`/admin/content/${typeKey}`} className="btn btn-ghost">← {t("cms.backToList")}</Link>
        <div className="row">
          {id && <button type="button" className="btn btn-ghost" onClick={onDelete} disabled={pending} style={{ color: "var(--color-danger)" }}>{t("cms.delete")}</button>}
          {id && hasDraft && <button type="button" className="btn" onClick={onDiscard} disabled={pending}>{t("cms.discardDraft")}</button>}
          {id && status === "published" && <button type="button" className="btn" onClick={onUnpublish} disabled={pending}>{t("cms.unpublish")}</button>}
          <button type="button" className="btn" onClick={onSave} disabled={pending}>{status === "published" ? t("cms.saveDraft") : t("cms.save")}</button>
          <button type="button" className="btn btn-primary" onClick={onPublish} disabled={pending}>
            {status === "published" ? t("cms.publishChanges") : t("cms.publish")}
          </button>
        </div>
      </div>
    </div>
  );
}
