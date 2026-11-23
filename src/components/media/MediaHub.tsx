"use client";
import { EVENT } from "@/lib/event";
import { useEffect, useMemo, useState } from "react";
import { downloadZip } from "client-zip";
import { useI18n } from "@/lib/i18n/client";
import { Badge, EmptyState, Icon } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { acceptMaterialTerms } from "@/lib/actions/media";
import { fmtBytes } from "@/lib/bytes";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useUrlState } from "@/lib/hooks/useUrlState";

export interface HubItem {
  id: string; category: string; subtype: string | null; title: string; description: string;
  previewUrl: string | null; previewKind: string | null; draft: boolean; visibility: string; badge: "new" | "updated" | null; favorite: boolean;
  version: null | {
    number: number; fileName: string; size: number | null; format: string | null; codec: string | null; resolution: string | null;
    frameRate: string | null; duration: string | null; date: string;
  };
}

const CATEGORIES = ["all", "graphics", "bumpers", "curtains", "promos", "music"];

type SavePicker = (o: { suggestedName: string; types?: unknown[] }) => Promise<{ createWritable(): Promise<WritableStream> }>;

export function MediaHub({ items, termsAccepted, termsTitle, termsHtml, focusItem, openTerms, initialCategory }: {
  items: HubItem[]; termsAccepted: boolean; termsTitle: string; termsHtml: string; focusItem: string | null; openTerms: boolean; initialCategory: string;
}) {
  const { t } = useI18n();
  const [categoryRaw, setCategory] = useUrlState("category", "all");
  const category = CATEGORIES.includes(categoryRaw) ? categoryRaw : (CATEGORIES.includes(initialCategory) ? initialCategory : "all");
  const [format, setFormat] = useUrlState("format", "all");
  const [q, setQ] = useUrlState("q", "");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [accepted, setAccepted] = useState(termsAccepted);
  const [termsOpen, setTermsOpen] = useState(openTerms && !termsAccepted);
  const [pendingAction, setPendingAction] = useState<null | (() => void)>(null);
  const [zip, setZip] = useState<{ done: number; total: number; error?: string } | null>(null);

  useEffect(() => {
    if (focusItem) document.getElementById(`item-${focusItem}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusItem]);

  const formats = useMemo(() => [...new Set(items.map((i) => i.version?.format).filter((f): f is string => Boolean(f)))].sort(), [items]);
  const term = q.trim().toLocaleLowerCase();
  const visible = items.filter((i) =>
    (category === "all" || i.category === category) &&
    (format === "all" || i.version?.format === format) &&
    (!term || `${i.title} ${i.description} ${i.subtype ?? ""} ${i.version?.fileName ?? ""}`.toLocaleLowerCase().includes(term)),
  );
  const selectable = visible.filter((i) => i.version);
  const selectedSize = items.filter((i) => selected.has(i.id)).reduce((s, i) => s + (i.version?.size ?? 0), 0);

  const requireTerms = (action: () => void) => {
    if (accepted) action();
    else { setPendingAction(() => action); setTermsOpen(true); }
  };

  const downloadOne = (id: string) => requireTerms(() => { window.location.href = `/api/media/${id}/download`; });

  const downloadSelection = () => requireTerms(async () => {
    const ids = [...selected];
    setZip({ done: 0, total: ids.length });
    try {
      const res = await fetch("/api/media/zip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
      if (!res.ok) throw new Error(String(res.status));
      const { files } = (await res.json()) as { files: { name: string; url: string }[] };
      let done = 0;
      async function* entries() {
        for (const f of files) {
          const r = await fetch(f.url);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          yield { name: f.name, input: r };
          done++;
          setZip({ done, total: files.length });
        }
      }
      const zipName = `${EVENT.slug}-media-${new Date().toISOString().slice(0, 10)}.zip`;
      const response = downloadZip(entries());
      const picker = (window as unknown as { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
      if (picker) {
        // Streams straight to disk: works for multi-GB selections.
        const handle = await picker({ suggestedName: zipName });
        await response.body!.pipeTo(await handle.createWritable());
      } else {
        const blob = await response.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = zipName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 60000);
      }
      setZip(null);
      setSelected(new Set());
    } catch (e) {
      if ((e as Error).name === "AbortError") { setZip(null); return; }
      setZip({ done: 0, total: 0, error: t("mediaHub.zipError") });
    }
  });

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="stack">
      <div className="chips" role="tablist">
        {CATEGORIES.map((c) => (
          <button key={c} type="button" className={`chip${category === c ? " is-active" : ""}`} aria-pressed={category === c} onClick={() => setCategory(c)}>
            {c === "all" ? t("mediaHub.allCategories") : t(`mediaHub.categories.${c}`)}
            <span className="chip-count">{c === "all" ? items.length : items.filter((i) => i.category === c).length}</span>
          </button>
        ))}
      </div>
      <div className="row">
        <input type="search" className="input" autoComplete="off" style={{ flex: 1, minWidth: 200 }} placeholder={t("mediaHub.searchPlaceholder")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("mediaHub.searchPlaceholder")} />
        <select className="select" style={{ width: "auto" }} value={format} onChange={(e) => setFormat(e.target.value)} aria-label={t("mediaHub.format")}>
          <option value="all">{t("mediaHub.allFormats")}</option>
          {formats.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        {selectable.length > 0 && (
          <button type="button" className="btn btn-sm" onClick={() => setSelected(selected.size === selectable.length ? new Set() : new Set(selectable.map((i) => i.id)))}>
            {selected.size === selectable.length ? t("mediaHub.clearSelection") : t("mediaHub.selectAll")}
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="card"><EmptyState icon="download" action={items.length ? { label: t("common.clearFilters"), onClick: () => { setCategory("all"); setFormat("all"); setQ(""); } } : { label: t("common.contactHost"), href: "/contacts" }}>{items.length ? t("mediaHub.noMatch") : t("mediaHub.empty")}</EmptyState></div>
      ) : (
        <div className="media-grid">
          {visible.map((i) => (
            <article key={i.id} id={`item-${i.id}`} className={`card media-card${selected.has(i.id) ? " is-selected" : ""}${focusItem === i.id ? " is-focused" : ""}`}>
              <div className="media-preview">
                {i.previewUrl ? (
                  i.previewKind === "video"
                    ? <video src={i.previewUrl} muted loop playsInline preload="metadata" aria-hidden="true" tabIndex={-1} onMouseEnter={(e) => { if (!matchMedia("(prefers-reduced-motion: reduce)").matches) void e.currentTarget.play(); }} onMouseLeave={(e) => e.currentTarget.pause()} />
                    : <img src={i.previewUrl} alt="" width={640} height={360} loading="lazy" decoding="async" />
                ) : <Icon name="file" size={40} />}
                <div className="media-badges">
                  {i.badge === "new" && <Badge tone="success">{t("mediaHub.badgeNew")}</Badge>}
                  {i.badge === "updated" && <Badge tone="info">{t("mediaHub.badgeUpdated")}</Badge>}
                  {i.draft && <Badge tone="warning">{t("cms.status.draft")}</Badge>}
                  {i.visibility === "partners" && <Badge tone="info">{t("dashboard.partnersOnly")}</Badge>}
                {i.visibility === "production" && <Badge tone="success">{t("dashboard.productionOnly")}</Badge>}
                </div>
                {i.version && (
                  <label className="media-check">
                    <input type="checkbox" checked={selected.has(i.id)} onChange={() => toggle(i.id)} aria-label={t("mediaHub.select")} />
                  </label>
                )}
              </div>
              <div className="stack-sm" style={{ flex: 1 }}>
                <div className="row-between">
                  <span className="muted small">{t(`mediaHub.categories.${i.category}`)}{i.subtype ? ` · ${i.subtype}` : ""}</span>
                  <FavoriteButton kind="media_asset" id={i.id} initial={i.favorite} compact label={i.title} />
                </div>
                <strong>{i.title}</strong>
                {i.description && <p className="small muted" style={{ margin: 0 }}>{i.description}</p>}
                {i.version ? (
                  <dl className="specs">
                    {i.version.format && <><dt>{t("mediaHub.specs.format")}</dt><dd>{i.version.format}</dd></>}
                    {i.version.codec && <><dt>{t("mediaHub.specs.codec")}</dt><dd>{i.version.codec}</dd></>}
                    {i.version.resolution && <><dt>{t("mediaHub.specs.resolution")}</dt><dd>{i.version.resolution}</dd></>}
                    {i.version.frameRate && <><dt>{t("mediaHub.specs.frame_rate")}</dt><dd>{i.version.frameRate}</dd></>}
                    {i.version.duration && <><dt>{t("mediaHub.specs.duration_seconds")}</dt><dd>{i.version.duration}</dd></>}
                    {i.version.size != null && <><dt>{t("mediaHub.specs.size")}</dt><dd>{fmtBytes(i.version.size)}</dd></>}
                    <dt>{t("mediaHub.specs.version")}</dt><dd>v{i.version.number} · {i.version.date}</dd>
                  </dl>
                ) : <p className="small muted" style={{ margin: 0 }}>{t("mediaHub.noFile")}</p>}
              </div>
              {i.version && (
                <button type="button" className="btn btn-primary btn-block" onClick={() => downloadOne(i.id)}>
                  <Icon name="download" size={18} /> {t("mediaHub.download")}
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      {selected.size > 0 && (
        <div className="selection-bar" role="region" aria-label={t("mediaHub.selection")}>
          <span>{t("mediaHub.selectedCount", { n: selected.size })} · {fmtBytes(selectedSize)}</span>
          <div className="row">
            <button type="button" className="btn btn-sm" onClick={() => setSelected(new Set())}>{t("mediaHub.clearSelection")}</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={downloadSelection} disabled={Boolean(zip && !zip.error)}>
              {zip && !zip.error ? t("mediaHub.zipProgress", { done: zip.done, total: zip.total }) : t("mediaHub.downloadZip")}
            </button>
          </div>
          {zip?.error && <div className="small" style={{ color: "var(--color-danger)", width: "100%" }}>{zip.error}</div>}
        </div>
      )}

      {termsOpen && (
        <Modal
          title={termsTitle}
          onClose={() => { setTermsOpen(false); setPendingAction(null); }}
          footer={
            <>
              <button className="btn" onClick={() => { setTermsOpen(false); setPendingAction(null); }}>{t("common.cancel")}</button>
              <button className="btn btn-primary" onClick={async () => {
                const r = await acceptMaterialTerms();
                if (!r.ok) return;
                setAccepted(true);
                setTermsOpen(false);
                const next = pendingAction;
                setPendingAction(null);
                next?.();
              }}>{t("mediaHub.acceptTerms")}</button>
            </>
          }
        >
          <p className="small">{t("mediaHub.termsIntro")}</p>
          <div className="prose small terms-box" dangerouslySetInnerHTML={{ __html: termsHtml }} />
        </Modal>
      )}
    </div>
  );
}
