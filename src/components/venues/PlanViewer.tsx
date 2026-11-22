"use client";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { Badge } from "@/components/ui";
import { CameraMap, type CameraPoint } from "./CameraMap";
import { PdfViewer } from "./PdfViewer";

export interface CameraRow extends CameraPoint { lens: string | null; function: string }

export function CameraLegend() {
  const { t } = useI18n();
  return (
    <div className="cam-legend small">
      <span><i className="dot-l1" /> {t("cameraMaps.level", { n: 1 })}</span>
      <span><i className="dot-l2" /> {t("cameraMaps.level", { n: 2 })}</span>
      <span><i className="dot-l3" /> {t("cameraMaps.level", { n: 3 })}</span>
      <span><i className="dot-special" /> {t("cameraMaps.special")}</span>
    </div>
  );
}

export function PlanViewer({ shape, cameras, drawing, title }: {
  shape: string; cameras: CameraRow[]; title: string;
  drawing: { url: string; downloadUrl: string; version: number; date: string } | null;
}) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<"map" | "drawing">("map");
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  useEffect(() => {
    if (selected) rowRefs.current[selected]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);
  const specials = cameras.filter((c) => c.is_special).length;
  return (
    <div className="stack">
      <div className="row">
        <Badge tone="primary">{t("cameraMaps.total", { n: cameras.length })}</Badge>
        <Badge tone="danger">{t("cameraMaps.specialsCount", { n: specials })}</Badge>
        {["1", "2", "3"].map((l) => <Badge key={l}>{t("cameraMaps.level", { n: l })}: {cameras.filter((c) => c.level === l).length}</Badge>)}
      </div>
      <div className="view-toggle" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "map"} className={tab === "map" ? "is-active" : ""} onClick={() => setTab("map")}>{t("cameraMaps.conceptual")}</button>
        <button type="button" role="tab" aria-selected={tab === "drawing"} className={tab === "drawing" ? "is-active" : ""} onClick={() => setTab("drawing")}>{t("cameraMaps.architecture")}</button>
      </div>
      <div className={`plan-views show-${tab}`}>
        <section className="card plan-view-map">
          <h2 className="card-title">{t("cameraMaps.conceptual")}</h2>
          <CameraMap shape={shape} cameras={cameras} selectedId={selected} onSelect={(id) => setSelected((s) => (s === id ? null : id))} title={title} />
          <CameraLegend />
        </section>
        <section className="card plan-view-drawing">
          <div className="row-between">
            <h2 className="card-title" style={{ margin: 0 }}>{t("cameraMaps.architecture")}</h2>
            {drawing && <span className="muted small">v{drawing.version} · {drawing.date}</span>}
          </div>
          {drawing ? <PdfViewer url={drawing.url} downloadUrl={drawing.downloadUrl} /> : <p className="muted small">{t("cameraMaps.noDrawing")}</p>}
        </section>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t("cameraMaps.cols.number")}</th><th>{t("cameraMaps.cols.type")}</th><th>{t("cameraMaps.cols.lens")}</th>
              <th>{t("cameraMaps.cols.function")}</th><th>{t("cameraMaps.cols.level")}</th><th>{t("cameraMaps.cols.special")}</th>
            </tr>
          </thead>
          <tbody>
            {cameras.map((c) => (
              <tr key={c.id} ref={(el) => { rowRefs.current[c.id] = el; }} className={selected === c.id ? "is-highlighted" : undefined}
                onClick={() => { setSelected((s) => (s === c.id ? null : c.id)); setTab("map"); }} style={{ cursor: "pointer" }}>
                <td><strong>{c.number}</strong></td>
                <td>{t(`cameraTypes.${c.type}`)}</td>
                <td>{c.lens ?? "—"}</td>
                <td>{c.function || "—"}</td>
                <td>{c.level}</td>
                <td>{c.is_special ? <Badge tone="danger">{t("cameraMaps.special")}</Badge> : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
