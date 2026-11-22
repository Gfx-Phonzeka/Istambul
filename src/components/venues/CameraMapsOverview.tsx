"use client";
import { useState } from "react";
import Link from "next/link";
import { downloadZip } from "client-zip";
import { useI18n } from "@/lib/i18n/client";
import { Badge, EmptyState } from "@/components/ui";
import { CameraMap, type CameraPoint } from "./CameraMap";

export interface OverviewPlan {
  id: string; title: string; venueTitle: string; venueSlug: string; sportId: string; sportTitle: string; cluster: string; clusterTitle: string;
  level: string | null; shape: string; total: number; specials: number; badge: "new" | "updated" | null; draft: boolean; cameras: CameraPoint[];
}

type SavePicker = (o: { suggestedName: string }) => Promise<{ createWritable(): Promise<WritableStream> }>;

export function CameraMapsOverview({ plans, clusters, sports }: {
  plans: OverviewPlan[]; clusters: { slug: string; title: string }[]; sports: { id: string; title: string }[];
}) {
  const { t, locale } = useI18n();
  const [cluster, setCluster] = useState("all");
  const [sport, setSport] = useState("all");
  const [level, setLevel] = useState("all");
  const [pack, setPack] = useState<{ done: number; total: number } | null>(null);
  const [packError, setPackError] = useState(false);
  const shown = plans.filter((p) => (cluster === "all" || p.cluster === cluster) && (sport === "all" || p.sportId === sport) && (level === "all" || p.level === level));
  const total = shown.reduce((s, p) => s + p.total, 0);
  const specials = shown.reduce((s, p) => s + p.specials, 0);

  const downloadPack = async () => {
    setPackError(false);
    setPack({ done: 0, total: shown.length });
    try {
      let done = 0;
      async function* files() {
        for (const p of shown) {
          const r = await fetch(`/api/camera-plans/${p.id}/export?lang=${locale}&json=1`);
          if (!r.ok) throw new Error(String(r.status));
          const { url, name } = (await r.json()) as { url: string; name: string };
          yield { name, input: await fetch(url) };
          done++;
          setPack({ done, total: shown.length });
        }
      }
      const zipName = `istanbul2027-camera-maps-${locale}.zip`;
      const res = downloadZip(files());
      const picker = (window as unknown as { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
      if (picker) {
        const h = await picker({ suggestedName: zipName });
        await res.body!.pipeTo(await h.createWritable());
      } else {
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = zipName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 60000);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setPackError(true);
    } finally {
      setPack(null);
    }
  };

  return (
    <div className="stack">
      <div className="row">
        <div className="chips">
          <button type="button" className={`chip${cluster === "all" ? " is-active" : ""}`} onClick={() => setCluster("all")}>{t("venues.allClusters")}</button>
          {clusters.map((c) => <button key={c.slug} type="button" className={`chip${cluster === c.slug ? " is-active" : ""}`} onClick={() => setCluster(c.slug)}>{c.title}</button>)}
        </div>
        <select className="select" style={{ width: "auto" }} value={sport} onChange={(e) => setSport(e.target.value)} aria-label={t("venues.sport")}>
          <option value="all">{t("venues.allSports")}</option>
          {sports.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
        <select className="select" style={{ width: "auto" }} value={level} onChange={(e) => setLevel(e.target.value)} aria-label={t("cms.fields.productionLevel")}>
          <option value="all">{t("cameraMaps.allLevels")}</option>
          {["1", "2", "3"].map((l) => <option key={l} value={l}>{t(`venues.levels.${l}`)}</option>)}
        </select>
      </div>
      <div className="row-between card" style={{ padding: "var(--space-3) var(--space-4)" }}>
        <div className="row">
          <strong className="countdown-value" style={{ fontSize: "var(--text-2xl)" }}>{total}</strong>
          <span>{t("cameraMaps.totalCamerasIn", { n: shown.length })}</span>
          <Badge tone="danger">{t("cameraMaps.specialsCount", { n: specials })}</Badge>
        </div>
        {shown.length > 0 && (
          <button type="button" className="btn btn-primary" onClick={downloadPack} disabled={Boolean(pack)}>
            {pack ? t("cameraMaps.packProgress", { done: pack.done, total: pack.total }) : t("cameraMaps.downloadPack")}
          </button>
        )}
      </div>
      {packError && <div className="alert alert-danger">{t("mediaHub.zipError")}</div>}
      {shown.length === 0 ? (
        <div className="card"><EmptyState icon="camera">{t("cameraMaps.noMatch")}</EmptyState></div>
      ) : (
        <div className="media-grid">
          {shown.map((p) => (
            <Link key={p.id} href={`/camera-maps/${p.id}`} className="card card-link media-card">
              <div className="plan-thumb">
                <CameraMap shape={p.shape} cameras={p.cameras} title={p.title} />
                <div className="media-badges">
                  {p.badge === "new" && <Badge tone="success">{t("mediaHub.badgeNew")}</Badge>}
                  {p.badge === "updated" && <Badge tone="info">{t("mediaHub.badgeUpdated")}</Badge>}
                  {p.draft && <Badge tone="warning">{t("cms.status.draft")}</Badge>}
                </div>
              </div>
              <div className="muted small">{p.clusterTitle} · {p.venueTitle}</div>
              <strong>{p.sportTitle} · {p.title}</strong>
              <div className="row small" style={{ gap: 6 }}>
                <Badge tone="primary">{t("cameraMaps.total", { n: p.total })}</Badge>
                <Badge tone="danger">{t("cameraMaps.specialsCount", { n: p.specials })}</Badge>
                {p.level && <Badge>{t(`venues.levels.${p.level}`)}</Badge>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
