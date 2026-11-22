import Link from "next/link";
import { CameraMap, type CameraPoint } from "./CameraMap";
import { Badge } from "@/components/ui";
import type { PlanSummary } from "@/lib/venues";

export function PlanCard({ plan, cameras, labels, badge, showVenue = true, preview = false }: {
  plan: PlanSummary; cameras: CameraPoint[]; badge: "new" | "updated" | null; showVenue?: boolean; preview?: boolean;
  labels: { cameras: string; specials: string; isNew: string; isUpdated: string; draft: string; level: string };
}) {
  return (
    <Link href={`/camera-maps/${plan.id}${preview ? "?preview=1" : ""}`} className="card card-link media-card">
      <div className="plan-thumb">
        <CameraMap shape={plan.shape} cameras={cameras} title={plan.title} />
        <div className="media-badges">
          {badge === "new" && <Badge tone="success">{labels.isNew}</Badge>}
          {badge === "updated" && <Badge tone="info">{labels.isUpdated}</Badge>}
          {plan.draft && <Badge tone="warning">{labels.draft}</Badge>}
        </div>
      </div>
      {showVenue && <div className="muted small">{plan.clusterTitle} · {plan.venueTitle}</div>}
      <strong>{plan.sportTitle} · {plan.title}</strong>
      <div className="row small" style={{ gap: 6 }}>
        <Badge tone="primary">{plan.total} {labels.cameras}</Badge>
        <Badge tone="danger">{plan.specials} {labels.specials}</Badge>
        {plan.level && <Badge>{labels.level}</Badge>}
      </div>
    </Link>
  );
}
