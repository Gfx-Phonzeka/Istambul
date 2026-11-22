// Renders the sport-specific field-of-play drawings (see fopLayouts.ts) on the camera-map canvas.
// They use fixed, light colours on screen and in PDFs so the plans read the same way everywhere.
import { FOP_LAYOUTS, type FopItem } from "./fopLayouts";

const FONT = "Helvetica, Arial, sans-serif";
const dash = (d: unknown, w: number) => (d ? `${Math.max(6, w * 3)} ${Math.max(4, w * 2)}` : undefined);

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}

function Item({ it, font }: { it: FopItem; font: string }) {
  const [t, ...a] = it as [string, ...never[]];
  switch (t) {
    case "r": {
      const [x, y, w, h, fill, stroke, sw, d, rx] = a as unknown as [number, number, number, number, string, string, number, number, number];
      return <rect x={x} y={y} width={w} height={h} rx={rx || undefined} fill={fill} stroke={stroke} strokeWidth={stroke === "none" ? 0 : sw} strokeDasharray={dash(d, sw)} />;
    }
    case "l": {
      const [x1, y1, x2, y2, stroke, sw, d] = a as unknown as [number, number, number, number, string, number, number];
      return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={sw} strokeDasharray={dash(d, sw)} />;
    }
    case "c": {
      const [cx, cy, r, fill, stroke, sw, d] = a as unknown as [number, number, number, string, string, number, number];
      return <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray={dash(d, sw)} />;
    }
    case "a": {
      const [cx, cy, r, a0, a1, stroke, sw, d] = a as unknown as [number, number, number, number, number, string, number, number];
      return <path d={arcPath(cx, cy, r, a0, a1)} fill="none" stroke={stroke} strokeWidth={sw} strokeDasharray={dash(d, sw)} />;
    }
    case "p": {
      const [points, fill, stroke, sw] = a as unknown as [string, string, string, number];
      return <polygon points={points} fill={fill} stroke={stroke} strokeWidth={sw} />;
    }
    case "t": {
      const [x, y, label, size, color, weight, rot] = a as unknown as [number, number, string, number, string, number, number];
      return (
        <text x={x} y={y} dy="0.35em" textAnchor="middle" fontSize={size} fontWeight={weight} fill={color} fontFamily={font}
          letterSpacing="0.04em" transform={rot ? `rotate(${rot} ${x} ${y})` : undefined}>{label}</text>
      );
    }
    default:
      return null;
  }
}

export const FOP_KEYS = Object.keys(FOP_LAYOUTS);

/** `font` is "Roboto" in PDFs (the only font registered with pdfmake). */
export function FopDrawing({ shape, font = FONT }: { shape: string; font?: string }) {
  const items = FOP_LAYOUTS[shape] ?? [];
  return (
    <g aria-hidden="true">
      <rect x={0} y={0} width={1000} height={600} fill="#fbfcfd" />
      {items.map((it, i) => <Item key={i} it={it} font={font} />)}
    </g>
  );
}
