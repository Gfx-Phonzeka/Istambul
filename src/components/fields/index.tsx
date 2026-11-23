// Schematic field drawings for the conceptual camera maps.
// Each drawing is an independent component on a 1000 × 600 canvas, so it can be redesigned in phase 2
// without touching the camera logic. Colours come from a palette (CSS variables on screen, fixed colours in PDFs).

import { FOP_LAYOUTS } from "./fopLayouts";
import { FopDrawing } from "./fop";

export interface FieldPalette { bg: string; fill: string; line: string; water: string }

export const SCREEN_PALETTE: FieldPalette = {
  bg: "var(--field-bg)", fill: "var(--field-fill)", line: "var(--field-line)", water: "var(--field-water)",
};
export const PRINT_PALETTE: FieldPalette = { bg: "#f2f5f3", fill: "#dde9e2", line: "#6a8075", water: "#d3e8ee" };

type P = { p: FieldPalette };
const stroke = (p: FieldPalette, w = 4) => ({ stroke: p.line, strokeWidth: w, fill: "none" });

function Generic({ p }: P) {
  return <rect x={150} y={130} width={700} height={340} rx={8} fill={p.fill} {...{ stroke: p.line, strokeWidth: 4 }} />;
}

function Track({ p }: P) {
  // Athletics stadium: oval track with an inner field.
  return (
    <g>
      <rect x={120} y={110} width={760} height={380} rx={190} fill={p.fill} stroke={p.line} strokeWidth={4} />
      <rect x={200} y={180} width={600} height={240} rx={120} fill={p.bg} stroke={p.line} strokeWidth={3} />
      {[1, 2, 3].map((i) => <rect key={i} x={120 + i * 20} y={110 + i * 17} width={760 - i * 40} height={380 - i * 34} rx={190 - i * 17} fill="none" stroke={p.line} strokeWidth={1} opacity={0.5} />)}
      <line x1={500} y1={420} x2={500} y2={490} {...stroke(p, 3)} />
    </g>
  );
}

function Pool({ p }: P) {
  const lanes = 8;
  return (
    <g>
      <rect x={180} y={160} width={640} height={280} fill={p.water} stroke={p.line} strokeWidth={4} />
      {Array.from({ length: lanes - 1 }, (_, i) => (
        <line key={i} x1={180} x2={820} y1={160 + ((i + 1) * 280) / lanes} y2={160 + ((i + 1) * 280) / lanes} stroke={p.line} strokeWidth={1.5} strokeDasharray="10 6" />
      ))}
      <line x1={500} y1={160} x2={500} y2={440} {...stroke(p, 1)} opacity={0.5} />
    </g>
  );
}

function Pitch({ p }: P) {
  return (
    <g>
      <rect x={120} y={120} width={760} height={360} fill={p.fill} stroke={p.line} strokeWidth={4} />
      <line x1={500} y1={120} x2={500} y2={480} {...stroke(p)} />
      <circle cx={500} cy={300} r={60} {...stroke(p)} />
      <rect x={120} y={210} width={110} height={180} {...stroke(p)} />
      <rect x={770} y={210} width={110} height={180} {...stroke(p)} />
    </g>
  );
}

function Court({ p }: P) {
  return (
    <g>
      <rect x={260} y={190} width={480} height={220} fill={p.fill} stroke={p.line} strokeWidth={4} />
      <line x1={500} y1={190} x2={500} y2={410} {...stroke(p)} />
      <circle cx={500} cy={300} r={36} {...stroke(p, 3)} />
    </g>
  );
}

function Ring({ p }: P) {
  return (
    <g>
      <rect x={370} y={170} width={260} height={260} fill={p.fill} stroke={p.line} strokeWidth={4} />
      <rect x={385} y={185} width={230} height={230} {...stroke(p, 2)} />
      {[[370, 170], [630, 170], [370, 430], [630, 430]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={9} fill={p.line} />)}
    </g>
  );
}

function Mat({ p }: P) {
  return (
    <g>
      <rect x={330} y={130} width={340} height={340} fill={p.fill} stroke={p.line} strokeWidth={4} />
      <rect x={380} y={180} width={240} height={240} {...stroke(p, 3)} />
    </g>
  );
}

function Piste({ p }: P) {
  return (
    <g>
      <rect x={140} y={270} width={720} height={60} fill={p.fill} stroke={p.line} strokeWidth={4} />
      <line x1={500} y1={270} x2={500} y2={330} {...stroke(p, 3)} />
    </g>
  );
}

function Circle({ p }: P) {
  return <circle cx={500} cy={300} r={210} fill={p.fill} stroke={p.line} strokeWidth={4} />;
}

export const FIELD_DRAWINGS: Record<string, (props: P) => React.JSX.Element> = {
  generic: Generic, track: Track, pool: Pool, pitch: Pitch, court: Court, ring: Ring, mat: Mat, piste: Piste, circle: Circle,
};

/**
 * Imported drawing (Lima plans): "svg:<width>x<height>:<svg markup>". The drawing is fitted into the 1000 × 600 canvas,
 * centred; camera positions are stored in canvas coordinates. The markup is written by the import script or staff only.
 */
export function parseCustomShape(shape: string): { w: number; h: number; markup: string } | null {
  const m = /^svg:(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?):([\s\S]*)$/.exec(shape);
  return m ? { w: Number(m[1]), h: Number(m[2]), markup: m[3].replace(/<script[\s\S]*?<\/script>/gi, "").replace(/\son\w+="[^"]*"/gi, "") } : null;
}

export function FieldDrawing({ shape, palette = SCREEN_PALETTE }: { shape: string; palette?: FieldPalette }) {
  const custom = shape.startsWith("svg:") ? parseCustomShape(shape) : null;
  if (custom) {
    const s = Math.min(1000 / custom.w, 600 / custom.h);
    const tx = (1000 - custom.w * s) / 2, ty = (600 - custom.h * s) / 2;
    return (
      <g>
        <rect x={0} y={0} width={1000} height={600} fill="#ffffff" />
        <g transform={`translate(${tx} ${ty}) scale(${s})`} dangerouslySetInnerHTML={{ __html: custom.markup }} />
      </g>
    );
  }
  if (FOP_LAYOUTS[shape]) return <FopDrawing shape={shape} font={palette === PRINT_PALETTE ? "Roboto" : undefined} />;
  const Drawing = FIELD_DRAWINGS[shape] ?? Generic;
  return (
    <g>
      <rect x={0} y={0} width={1000} height={600} fill={palette.bg} />
      <Drawing p={palette} />
    </g>
  );
}
