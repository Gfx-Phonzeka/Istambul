"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";

type PdfDoc = { numPages: number; getPage(n: number): Promise<PdfPage>; destroy(): Promise<void> };
type PdfPage = {
  getViewport(o: { scale: number }): { width: number; height: number };
  render(o: { canvasContext: CanvasRenderingContext2D; viewport: unknown }): { promise: Promise<void>; cancel(): void };
};

/** Shows a PDF (architecture drawing) with zoom; pages are rendered in the browser with pdf.js. */
export function PdfViewer({ url, downloadUrl }: { url: string; downloadUrl?: string }) {
  const { t } = useI18n();
  const wrap = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [zoom, setZoom] = useState(1); // 1 = fit width
  const [error, setError] = useState(false);
  const [baseWidth, setBaseWidth] = useState(800);

  useEffect(() => {
    let cancelled = false;
    let loaded: PdfDoc | null = null;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        loaded = (await pdfjs.getDocument({ url }).promise) as unknown as PdfDoc;
        if (!cancelled) setDoc(loaded);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; void loaded?.destroy(); };
  }, [url]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBaseWidth(Math.max(200, el.clientWidth - 16)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const renderPages = useCallback(async () => {
    const el = wrap.current;
    if (!doc || !el) return;
    const container = el.querySelector(".pdf-pages") as HTMLDivElement;
    container.innerHTML = "";
    const dpr = window.devicePixelRatio || 1;
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const unscaled = page.getViewport({ scale: 1 });
      const scale = (baseWidth / unscaled.width) * zoom;
      const vp = page.getViewport({ scale: scale * dpr });
      const canvas = document.createElement("canvas");
      canvas.width = vp.width;
      canvas.height = vp.height;
      canvas.style.width = `${vp.width / dpr}px`;
      canvas.style.height = `${vp.height / dpr}px`;
      container.appendChild(canvas);
      await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
    }
  }, [doc, zoom, baseWidth]);

  useEffect(() => { void renderPages(); }, [renderPages]);

  return (
    <div className="pdf-viewer">
      <div className="pdf-toolbar">
        <button type="button" className="btn btn-sm" onClick={() => setZoom((z) => Math.max(0.5, z / 1.25))} aria-label={t("cameraMaps.zoomOut")}>−</button>
        <span className="small" style={{ minWidth: 48, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
        <button type="button" className="btn btn-sm" onClick={() => setZoom((z) => Math.min(6, z * 1.25))} aria-label={t("cameraMaps.zoomIn")}>+</button>
        <button type="button" className="btn btn-sm" onClick={() => setZoom(1)}>{t("cameraMaps.fit")}</button>
        {downloadUrl && <a className="btn btn-sm" href={downloadUrl} style={{ marginLeft: "auto" }}>{t("mediaHub.download")}</a>}
      </div>
      <div ref={wrap} className="pdf-scroll">
        {error ? <p className="muted small" style={{ padding: 16 }}>{t("cameraMaps.pdfError")}</p> : !doc ? <p className="muted small" style={{ padding: 16 }}>{t("common.loading")}</p> : null}
        <div className="pdf-pages" />
      </div>
    </div>
  );
}
