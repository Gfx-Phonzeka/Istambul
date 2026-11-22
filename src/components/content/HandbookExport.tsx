"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useI18n } from "@/lib/i18n/client";

interface Ch { id: string; title: string; sections: { id: string; title: string }[] }

export function HandbookExport({ chapters, defaultChapter }: { chapters: Ch[]; defaultChapter?: string }) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"all" | "chapter" | "sections">(defaultChapter ? "chapter" : "all");
  const [chapter, setChapter] = useState(defaultChapter ?? chapters[0]?.id ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [working, setWorking] = useState(false);

  const url =
    mode === "all"
      ? `/api/handbook/pdf?lang=${locale}`
      : mode === "chapter"
        ? `/api/handbook/pdf?lang=${locale}&scope=chapter&id=${chapter}`
        : `/api/handbook/pdf?lang=${locale}&scope=sections&ids=${[...selected].join(",")}`;

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>{t("handbook.exportPdf")}</button>
      {open && (
        <Modal
          title={t("handbook.exportTitle")}
          onClose={() => setOpen(false)}
          footer={
            <>
              <button className="btn" onClick={() => setOpen(false)}>{t("common.cancel")}</button>
              <a
                className="btn btn-primary"
                href={url}
                aria-disabled={mode === "sections" && selected.size === 0}
                onClick={(e) => {
                  if (mode === "sections" && selected.size === 0) { e.preventDefault(); return; }
                  setWorking(true);
                  setTimeout(() => setWorking(false), 6000);
                }}
              >
                {working ? t("handbook.exportWorking") : t("handbook.exportButton")}
              </a>
            </>
          }
        >
          <div className="stack">
            <span className="label">{t("handbook.exportWhat")}</span>
            <label className="checkbox"><input type="radio" name="m" checked={mode === "all"} onChange={() => setMode("all")} /> {t("handbook.exportAll")}</label>
            <label className="checkbox"><input type="radio" name="m" checked={mode === "chapter"} onChange={() => setMode("chapter")} /> {t("handbook.exportChapter")}</label>
            {mode === "chapter" && (
              <select className="select" value={chapter} onChange={(e) => setChapter(e.target.value)}>
                {chapters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            )}
            <label className="checkbox"><input type="radio" name="m" checked={mode === "sections"} onChange={() => setMode("sections")} /> {t("handbook.exportSections")}</label>
            {mode === "sections" && (
              <div className="stack-sm" style={{ maxHeight: 260, overflowY: "auto", paddingLeft: "var(--space-4)" }}>
                {chapters.map((c) => (
                  <div key={c.id} className="stack-sm">
                    <strong className="small">{c.title}</strong>
                    {c.sections.map((s) => (
                      <label key={s.id} className="checkbox"><input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} /> {s.title}</label>
                    ))}
                  </div>
                ))}
              </div>
            )}
            <p className="hint" style={{ margin: 0 }}>{t("handbook.exportLanguage", { lang: locale === "tr" ? "Türkçe" : "English" })}</p>
          </div>
        </Modal>
      )}
    </>
  );
}
