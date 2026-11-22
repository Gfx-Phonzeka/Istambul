"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { getPlanCameras, saveCameras, type CameraInput } from "@/lib/actions/venues";
import { CameraMap } from "./CameraMap";
import { CameraLegend } from "./PlanViewer";

export const CAMERA_TYPES = ["hard", "handheld", "rf", "crane", "polecam", "rail", "aerial", "beauty", "steadicam", "minicam", "underwater", "ptz", "other"];

type Cam = CameraInput & { key: string };

let seq = 0;
const newKey = () => `new-${Date.now()}-${seq++}`;

export function CameraEditor({ planId, shape, initial, otherPlans }: {
  planId: string; shape: string; initial: Cam[]; otherPlans: { id: string; label: string }[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [cams, setCams] = useState<Cam[]>(initial);
  const [selected, setSelected] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [copyFrom, setCopyFrom] = useState("");
  const [pending, start] = useTransition();

  const points = useMemo(() => cams.map((c) => ({
    id: c.key, number: c.number || "?", type: c.type, level: c.level, is_special: c.is_special, x: c.x, y: c.y,
    angle: c.angle === "" || Number.isNaN(Number(c.angle)) ? null : Number(c.angle),
  })), [cams]);

  const update = (key: string, patch: Partial<Cam>) => { setCams((list) => list.map((c) => (c.key === key ? { ...c, ...patch } : c))); setDirty(true); };
  const nextNumber = () => String(cams.reduce((m, c) => Math.max(m, Number.parseInt(c.number, 10) || 0), 0) + 1);
  const add = () => {
    const c: Cam = { key: newKey(), number: nextNumber(), type: "hard", lens: "", function_en: "", function_tr: "", level: "1", is_special: false, x: 0.5, y: 0.5, angle: "" };
    setCams((l) => [...l, c]); setSelected(c.key); setDirty(true);
  };
  const duplicate = (c: Cam) => {
    const d: Cam = { ...c, id: undefined, key: newKey(), number: nextNumber(), x: Math.min(1, c.x + 0.04), y: Math.min(1, c.y + 0.04) };
    setCams((l) => [...l, d]); setSelected(d.key); setDirty(true);
  };
  const remove = (key: string) => { setCams((l) => l.filter((c) => c.key !== key)); setDirty(true); };
  const move = (key: string, dir: -1 | 1) => {
    setCams((l) => { const i = l.findIndex((c) => c.key === key); const j = i + dir; if (j < 0 || j >= l.length) return l; const n = [...l]; [n[i], n[j]] = [n[j], n[i]]; return n; });
    setDirty(true);
  };

  const save = () => start(async () => {
    setMsg(null);
    const r = await saveCameras(planId, cams.map(({ key: _k, ...c }) => c));
    if (r.ok) {
      // Keep the editor in place and take the saved rows (with their new ids) from the server.
      setCams((r.cameras ?? []).map((c) => ({
        key: String(c.id), id: String(c.id), number: String(c.number), type: String(c.type), lens: (c.lens as string) ?? "",
        function_en: (c.function_en as string) ?? "", function_tr: (c.function_tr as string) ?? "", level: String(c.level),
        is_special: Boolean(c.is_special), x: Number(c.x), y: Number(c.y), angle: c.angle == null ? "" : String(c.angle),
      })));
      setDirty(false);
      setMsg({ tone: "success", text: t("cameraMaps.admin.saved") });
      router.refresh();
    }
    else setMsg({ tone: "danger", text: r.error === "duplicate_number" ? t("cameraMaps.admin.duplicateNumber") : r.error === "number_required" ? t("cameraMaps.admin.numberRequired") : `${t("common.error")} (${r.error})` });
  });

  const copy = () => start(async () => {
    if (!copyFrom) return;
    const list = await getPlanCameras(copyFrom);
    const used = new Set(cams.map((c) => c.number.trim().toLowerCase()));
    const copies: Cam[] = list.map((c) => {
      let number = String(c.number);
      while (used.has(number.toLowerCase())) number = `${number}b`;
      used.add(number.toLowerCase());
      return {
        key: newKey(), number, type: c.type, lens: c.lens ?? "", function_en: c.function_en ?? "", function_tr: c.function_tr ?? "",
        level: c.level, is_special: c.is_special, x: Number(c.x), y: Number(c.y), angle: c.angle == null ? "" : String(c.angle),
      };
    });
    setCams((l) => [...l, ...copies]); setDirty(true);
    setMsg({ tone: "success", text: t("cameraMaps.admin.copied", { n: copies.length }) });
  });

  return (
    <section className="card stack">
      <div className="row-between">
        <h2 className="card-title" style={{ margin: 0 }}>{t("cameraMaps.admin.cameras")} ({cams.length})</h2>
        <div className="row">
          <button type="button" className="btn btn-sm" onClick={add}>+ {t("cameraMaps.admin.addCamera")}</button>
          <button type="button" className="btn btn-sm btn-primary" onClick={save} disabled={pending || !dirty}>{t("cameraMaps.admin.saveCameras")}</button>
        </div>
      </div>
      <p className="hint" style={{ margin: 0 }}>{t("cameraMaps.admin.help")}</p>
      {dirty && <div className="alert alert-warning small">{t("cameraMaps.admin.unsaved")}</div>}
      {msg && <div className={`alert alert-${msg.tone} small`}>{msg.text}</div>}
      <div className="card" style={{ padding: 8 }}>
        <CameraMap shape={shape} cameras={points} selectedId={selected} onSelect={setSelected} onMove={(key, x, y) => update(key, { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 })} />
        <CameraLegend />
      </div>
      <div className="table-wrap">
        <table className="table cam-edit-table">
          <thead>
            <tr>
              <th>{t("cameraMaps.cols.number")}</th><th>{t("cameraMaps.cols.type")}</th><th>{t("cameraMaps.cols.lens")}</th>
              <th>{t("cameraMaps.cols.function")} (EN)</th><th>{t("cameraMaps.cols.function")} (TR)</th><th>{t("cameraMaps.cols.level")}</th>
              <th>{t("cameraMaps.cols.special")}</th><th>{t("cameraMaps.cols.angle")}</th><th />
            </tr>
          </thead>
          <tbody>
            {cams.map((c, i) => (
              <tr key={c.key} className={selected === c.key ? "is-highlighted" : undefined} onFocus={() => setSelected(c.key)} onClick={() => setSelected(c.key)}>
                <td><input className="input" style={{ width: 64 }} value={c.number} onChange={(e) => update(c.key, { number: e.target.value })} aria-label={t("cameraMaps.cols.number")} /></td>
                <td>
                  <select className="select" value={c.type} onChange={(e) => update(c.key, { type: e.target.value })} aria-label={t("cameraMaps.cols.type")}>
                    {CAMERA_TYPES.map((ty) => <option key={ty} value={ty}>{t(`cameraTypes.${ty}`)}</option>)}
                  </select>
                </td>
                <td><input className="input" style={{ width: 90 }} value={c.lens} onChange={(e) => update(c.key, { lens: e.target.value })} aria-label={t("cameraMaps.cols.lens")} /></td>
                <td><input className="input" value={c.function_en} onChange={(e) => update(c.key, { function_en: e.target.value })} aria-label={`${t("cameraMaps.cols.function")} EN`} /></td>
                <td><input className="input" value={c.function_tr} onChange={(e) => update(c.key, { function_tr: e.target.value })} aria-label={`${t("cameraMaps.cols.function")} TR`} /></td>
                <td>
                  <select className="select" style={{ width: 64 }} value={c.level} onChange={(e) => update(c.key, { level: e.target.value })} aria-label={t("cameraMaps.cols.level")}>
                    {["1", "2", "3"].map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </td>
                <td style={{ textAlign: "center" }}><input type="checkbox" checked={c.is_special} onChange={(e) => update(c.key, { is_special: e.target.checked })} aria-label={t("cameraMaps.cols.special")} style={{ width: 18, height: 18 }} /></td>
                <td><input className="input" style={{ width: 70 }} inputMode="numeric" value={c.angle} placeholder="—" onChange={(e) => update(c.key, { angle: e.target.value.replace(/[^0-9.-]/g, "") })} aria-label={t("cameraMaps.cols.angle")} /></td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(c.key, -1)} disabled={i === 0} aria-label="Up">↑</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(c.key, 1)} disabled={i === cams.length - 1} aria-label="Down">↓</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => duplicate(c)} title={t("cameraMaps.admin.duplicate")}>⧉</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(c.key)} title={t("cms.delete")} style={{ color: "var(--color-danger)" }}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint" style={{ margin: 0 }}>{t("cameraMaps.admin.angleHelp")}</p>
      {otherPlans.length > 0 && (
        <div className="row">
          <select className="select" style={{ width: "auto", maxWidth: "100%" }} value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)} aria-label={t("cameraMaps.admin.copyFrom")}>
            <option value="">{t("cameraMaps.admin.copyFrom")}</option>
            {otherPlans.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <button type="button" className="btn btn-sm" disabled={!copyFrom || pending} onClick={copy}>{t("cameraMaps.admin.copy")}</button>
        </div>
      )}
    </section>
  );
}
