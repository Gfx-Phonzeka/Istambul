"use client";
// Schematic (not geographic) map of the three clusters, with one pin per venue.

export interface MapVenue { id: string; slug: string; title: string; cluster: string; x: number; y: number; n: number }

const W = 1000, H = 560;

export function VenueMap({ venues, clusters, activeCluster, highlighted, onHover }: {
  venues: MapVenue[]; clusters: { slug: string; title: string }[]; activeCluster: string; highlighted?: string | null;
  onHover?: (id: string | null) => void;
}) {
  const label = (slug: string) => clusters.find((c) => c.slug === slug)?.title ?? slug;
  const dim = (slug: string) => (activeCluster !== "all" && activeCluster !== slug ? 0.35 : 1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="venue-map" role="img" aria-label="Schematic map of the venue clusters">
      <rect width={W} height={H} fill="var(--map-water)" />
      {/* European side */}
      <path d="M0 0 H560 C540 120 600 200 560 280 C520 360 590 440 560 560 H0 Z" fill="var(--map-europe)" />
      {/* Anatolian side */}
      <path d="M640 0 H1000 V560 H650 C680 440 610 360 650 280 C690 200 620 120 640 0 Z" fill="var(--map-anatolia)" />
      {/* Cluster zones */}
      <g opacity={dim("europe-north")}>
        <rect x={40} y={30} width={480} height={230} rx={24} fill="none" stroke="var(--color-primary)" strokeWidth={3} strokeDasharray="10 8" />
        <text x={60} y={66} fontSize={24} fontWeight={700} fill="var(--color-primary)">{label("europe-north")}</text>
      </g>
      <g opacity={dim("europe-south")}>
        <rect x={40} y={290} width={480} height={240} rx={24} fill="none" stroke="var(--color-success)" strokeWidth={3} strokeDasharray="10 8" />
        <text x={60} y={326} fontSize={24} fontWeight={700} fill="var(--color-success)">{label("europe-south")}</text>
      </g>
      <g opacity={dim("anatolian")}>
        <rect x={680} y={60} width={290} height={460} rx={24} fill="none" stroke="var(--color-warning)" strokeWidth={3} strokeDasharray="10 8" />
        <text x={700} y={96} fontSize={24} fontWeight={700} fill="var(--color-warning)">{label("anatolian")}</text>
      </g>
      <text x={600} y={H / 2} fontSize={16} fill="var(--color-text-muted)" textAnchor="middle" transform={`rotate(-90 600 ${H / 2})`}>Bosphorus</text>
      {venues.map((v) => {
        const cx = (v.x / 100) * W, cy = (v.y / 100) * H;
        const on = highlighted === v.id;
        return (
          <a key={v.id} href={`/venues/${v.slug}`} onMouseEnter={() => onHover?.(v.id)} onMouseLeave={() => onHover?.(null)} style={{ opacity: dim(v.cluster) }}>
            <title>{v.title}</title>
            <circle cx={cx} cy={cy} r={on ? 22 : 17} fill={on ? "var(--color-accent)" : "var(--color-text)"} stroke="#fff" strokeWidth={3} />
            <text x={cx} y={cy + 6} textAnchor="middle" fontSize={16} fontWeight={700} fill="#fff">{v.n}</text>
          </a>
        );
      })}
    </svg>
  );
}
