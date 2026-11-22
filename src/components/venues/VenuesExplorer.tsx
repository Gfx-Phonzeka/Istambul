"use client";
import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";
import { Badge, EmptyState } from "@/components/ui";
import { VenueMap, type MapVenue } from "./VenueMap";
import { useUrlState } from "@/lib/hooks/useUrlState";

export interface VenueCard extends MapVenue {
  clusterTitle: string; address: string | null; level: string | null; capacity: number | null; photo: string | null;
  sports: { id: string; title: string; dates: string }[]; plans: number; draft: boolean;
}

export function VenuesExplorer({ venues, clusters, sports }: {
  venues: VenueCard[]; clusters: { slug: string; title: string }[]; sports: { id: string; title: string }[];
}) {
  const { t } = useI18n();
  const [cluster, setCluster] = useUrlState("cluster", "all");
  const [sport, setSport] = useUrlState("sport", "all");
  const [hover, setHover] = useState<string | null>(null);
  const shown = venues.filter((v) => (cluster === "all" || v.cluster === cluster) && (sport === "all" || v.sports.some((s) => s.id === sport)));
  return (
    <div className="stack">
      <div className="row">
        <div className="chips">
          <button type="button" className={`chip${cluster === "all" ? " is-active" : ""}`} onClick={() => setCluster("all")}>{t("venues.allClusters")}</button>
          {clusters.map((c) => (
            <button key={c.slug} type="button" className={`chip${cluster === c.slug ? " is-active" : ""}`} onClick={() => setCluster(c.slug)}>{c.title}</button>
          ))}
        </div>
        <select className="select" style={{ width: "auto", marginLeft: "auto" }} value={sport} onChange={(e) => setSport(e.target.value)} aria-label={t("venues.sport")}>
          <option value="all">{t("venues.allSports")}</option>
          {sports.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </div>
      <div className="card" style={{ padding: "var(--space-3)" }}>
        <VenueMap venues={shown} clusters={clusters} activeCluster={cluster} highlighted={hover} onHover={setHover} />
        <p className="hint" style={{ margin: "var(--space-2) 0 0" }}>{t("venues.mapNote")}</p>
      </div>
      {shown.length === 0 ? (
        <div className="card"><EmptyState icon="pin" action={{ label: t("common.clearFilters"), onClick: () => { setCluster("all"); setSport("all"); } }}>{t("venues.noMatch")}</EmptyState></div>
      ) : (
        <div className="media-grid">
          {shown.map((v) => (
            <Link key={v.id} href={`/venues/${v.slug}`} className={`card card-link media-card${hover === v.id ? " is-selected" : ""}`}
              onMouseEnter={() => setHover(v.id)} onMouseLeave={() => setHover(null)}>
              <div className="media-preview">
                {v.photo ? <img src={v.photo} alt="" width={640} height={360} loading="lazy" decoding="async" /> : <span className="venue-num">{v.n}</span>}
                <div className="media-badges">
                  <Badge tone="primary">{v.n}</Badge>
                  {v.level && <Badge>{t(`venues.levels.${v.level}`)}</Badge>}
                  {v.draft && <Badge tone="warning">{t("cms.status.draft")}</Badge>}
                </div>
              </div>
              <div className="muted small">{v.clusterTitle}</div>
              <strong>{v.title}</strong>
              {v.address && <span className="small muted">{v.address}</span>}
              <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
                {v.sports.map((s) => <li key={s.id}>{s.title}{s.dates ? <span className="muted"> · {s.dates}</span> : null}</li>)}
              </ul>
              {v.plans > 0 && <span className="small">📷 {t("venues.cameraMapsCount", { n: v.plans })}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
