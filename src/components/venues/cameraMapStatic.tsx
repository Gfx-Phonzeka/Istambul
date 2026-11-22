// Pure (no hooks) parts of the camera map: shared by the interactive map and the PDF export.
import { FieldDrawing, PRINT_PALETTE } from "@/components/fields";

export interface CameraPoint {
  id: string; number: string; type: string; level: string; is_special: boolean; x: number; y: number; angle: number | null;
}

export interface CameraPalette { l1: string; l2: string; l3: string; special: string; highlight: string; text: string }
export const SCREEN_CAMS: CameraPalette = {
  l1: "var(--cam-l1)", l2: "var(--cam-l2)", l3: "var(--cam-l3)", special: "var(--cam-special)", highlight: "var(--cam-highlight)", text: "#fff",
};
export const PRINT_CAMS: CameraPalette = { l1: "#16202e", l2: "#0a6b70", l3: "#a15c00", special: "#d7372a", highlight: "#f2b200", text: "#fff" };

export const W = 1000, H = 600, R = 13;

export function CameraMarker({ c, selected, pal, font = "Helvetica, Arial, sans-serif" }: { c: CameraPoint; selected: boolean; pal: CameraPalette; font?: string }) {
  const cx = c.x * W, cy = c.y * H;
  const color = c.level === "1" ? pal.l1 : c.level === "2" ? pal.l2 : pal.l3;
  const rad = c.angle != null ? (-c.angle * Math.PI) / 180 : null; // 0° = right, 90° = up
  return (
    <g>
      {rad != null && (
        <path d={`M ${cx + Math.cos(rad) * (R + 12)} ${cy + Math.sin(rad) * (R + 12)} L ${cx + Math.cos(rad + 0.35) * (R + 2)} ${cy + Math.sin(rad + 0.35) * (R + 2)} L ${cx + Math.cos(rad - 0.35) * (R + 2)} ${cy + Math.sin(rad - 0.35) * (R + 2)} Z`} fill={color} />
      )}
      {selected && <circle cx={cx} cy={cy} r={R + 7} fill="none" stroke={pal.highlight} strokeWidth={5} />}
      {c.is_special ? (
        <rect x={cx - R * 0.85} y={cy - R * 0.85} width={R * 1.7} height={R * 1.7} transform={`rotate(45 ${cx} ${cy})`} fill={color} stroke={pal.special} strokeWidth={3} />
      ) : (
        <circle cx={cx} cy={cy} r={R} fill={color} stroke="#fff" strokeWidth={2} />
      )}
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={c.number.length > 2 ? 9 : 12} fontWeight={700} fill={pal.text} fontFamily={font}>
        {c.number}
      </text>
    </g>
  );
}


/** Static SVG used in PDF exports. */
export function StaticCameraMap({ shape, cameras }: { shape: string; cameras: CameraPoint[] }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} xmlns="http://www.w3.org/2000/svg">
      <FieldDrawing shape={shape} palette={PRINT_PALETTE} />
      {cameras.map((c) => <CameraMarker key={c.id} c={c} selected={false} pal={PRINT_CAMS} font="Roboto" />)}
    </svg>
  );
}
