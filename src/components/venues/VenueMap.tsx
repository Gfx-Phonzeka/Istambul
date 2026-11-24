"use client";
// Schematic (not geographic) map of the clusters, with one pin per venue. Istanbul: three clusters around the Bosphorus.
// Lima: the coast of Lima Metropolitana and Callao, one zone per cluster and an inset for the venues outside Lima.
import { EVENT } from "@/lib/event";

export interface MapVenue { id: string; slug: string; title: string; cluster: string; x: number; y: number; n: number }

const W = 1000, H = 560;

type MapProps = {
  venues: MapVenue[]; clusters: { slug: string; title: string }[]; activeCluster: string; highlighted?: string | null;
  onHover?: (id: string | null) => void;
};

export function VenueMap(props: MapProps) {
  return EVENT.id === "lima" ? <LimaMap {...props} /> : <IstanbulMap {...props} />;
}

// Lima: zones placed roughly where each cluster is (sea to the south-west); pins laid out inside each zone.
const LIMA_ZONES: Record<string, { x: number; y: number; w: number; h: number; color: string }> = {
  h: { x: 300, y: 28, w: 190, h: 112, color: "#5b6676" },        // Otras sedes · Lima centro
  f: { x: 510, y: 28, w: 170, h: 112, color: "#0b84b5" },        // Circuito Ciudad
  a: { x: 150, y: 150, w: 170, h: 120, color: "#2f9e74" },       // Callao
  c: { x: 560, y: 160, w: 230, h: 150, color: "#7b3f98" },       // VIDENA (San Luis)
  b: { x: 335, y: 190, w: 205, h: 150, color: "#2d5196" },       // Costa Verde y San Borja
  e: { x: 470, y: 380, w: 190, h: 120, color: "#d63a6a" },       // Villa El Salvador
  d: { x: 690, y: 330, w: 250, h: 150, color: "#c7841a" },       // Villa María del Triunfo
};
const OUTSIDE = "g";

function LimaMap({ venues, clusters, activeCluster, highlighted, onHover }: MapProps) {
  const title = (slug: string) => clusters.find((c) => c.slug === slug)?.title ?? slug;
  const parts = (slug: string) => { const tt = title(slug); const i = tt.indexOf("·"); return i < 0 ? [tt, ""] : [tt.slice(0, i).trim(), tt.slice(i + 1).trim()]; };
  const dim = (slug: string) => (activeCluster !== "all" && activeCluster !== slug ? 0.3 : 1);
  const pin = (v: MapVenue, cx: number, cy: number, color: string) => {
    const on = highlighted === v.id;
    return (
      <a key={v.id} href={`/venues/${v.slug}`} onMouseEnter={() => onHover?.(v.id)} onMouseLeave={() => onHover?.(null)} onFocus={() => onHover?.(v.id)} onBlur={() => onHover?.(null)}>
        <title>{v.title}</title>
        <circle cx={cx} cy={cy} r={on ? 17 : 13} fill={on ? "var(--color-accent)" : color} stroke="#fff" strokeWidth={2.5} />
        <text x={cx} y={cy + 4.5} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff">{v.n}</text>
      </a>
    );
  };
  const layout = (list: MapVenue[], z: { x: number; y: number; w: number; h: number }, top: number) => {
    const cols = Math.max(1, Math.min(list.length, Math.floor((z.w - 20) / 34)));
    const rows = Math.ceil(list.length / cols);
    const gx = 34, gy = 32, x0 = z.x + z.w / 2 - ((Math.min(cols, list.length) - 1) * gx) / 2;
    const y0 = z.y + top + (z.h - top - (rows - 1) * gy) / 2;
    return list.map((v, i) => ({ v, cx: x0 + (i % cols) * gx, cy: y0 + Math.floor(i / cols) * gy }));
  };
  const outside = venues.filter((v) => v.cluster === OUTSIDE);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="venue-map" role="img" aria-label="Schematic map of the Lima 2027 venue clusters">
      <rect width={W} height={H} fill="var(--map-water)" />
      {/* Coast of Lima and Callao (land to the north-east) */}
      <path d="M210 0 C 200 60 150 120 140 160 C 128 205 175 230 230 250 C 290 275 320 320 360 360 C 410 410 450 450 520 500 C 580 540 640 552 700 560 H1000 V0 Z" fill="var(--map-europe)" />
      <path d="M140 160 C 118 150 96 152 84 162 C 100 172 124 170 140 160 Z" fill="var(--map-europe)" />
      <text x={36} y={365} fontSize={15} fontStyle="italic" fill="var(--color-text-muted)" transform="rotate(-38 36 365)">Océano Pacífico</text>
      <g transform="translate(955 36)" aria-hidden="true">
        <path d="M0 -16 L7 8 L0 3 L-7 8 Z" fill="var(--color-text)" />
        <text y={24} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--color-text)">N</text>
      </g>
      {Object.entries(LIMA_ZONES).map(([slug, z]) => {
        const list = venues.filter((v) => v.cluster === slug);
        const [l1, l2] = parts(slug);
        return (
          <g key={slug} opacity={dim(slug)}>
            <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={18} fill="#fff" fillOpacity={0.55} stroke={z.color} strokeWidth={2.5} strokeDasharray="8 6" />
            <text x={z.x + 14} y={z.y + 22} fontSize={13} fontWeight={700} fill={z.color}>{l1}</text>
            {l2 && <text x={z.x + 14} y={z.y + 38} fontSize={11.5} fill="var(--color-text)">{l2}</text>}
            {layout(list, z, l2 ? 44 : 30).map(({ v, cx, cy }) => pin(v, cx, cy, z.color))}
          </g>
        );
      })}
      {/* Venues outside Lima Metropolitana (not to scale) */}
      <g opacity={dim(OUTSIDE)}>
        <rect x={24} y={395} width={300} height={145} rx={14} fill="#fff" stroke="var(--color-text)" strokeWidth={1.5} />
        <rect x={24} y={395} width={300} height={30} rx={14} fill="var(--color-text)" />
        <rect x={24} y={410} width={300} height={15} fill="var(--color-text)" />
        <text x={40} y={415} fontSize={12} fontWeight={700} fill="#fff" letterSpacing="0.04em">{parts(OUTSIDE)[1] || parts(OUTSIDE)[0]}</text>
        {outside.map((v, i) => {
          const cx = 46 + (i % 2) * 145, cy = 448 + Math.floor(i / 2) * 32;
          return (
            <g key={v.id}>
              {pin(v, cx, cy, "#d63a6a")}
              <text x={cx + 20} y={cy + 4} fontSize={11} fill="var(--color-text)">{v.title.length > 20 ? `${v.title.slice(0, 19)}…` : v.title}</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function IstanbulMap({ venues, clusters, activeCluster, highlighted, onHover }: MapProps) {
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
