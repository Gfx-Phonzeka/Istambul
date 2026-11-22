"use client";
import { useRef } from "react";
import { FieldDrawing, PRINT_PALETTE, SCREEN_PALETTE, type FieldPalette } from "@/components/fields";
import { CameraMarker, PRINT_CAMS, SCREEN_CAMS, W, H, type CameraPoint } from "./cameraMapStatic";

export type { CameraPoint } from "./cameraMapStatic";

/** Conceptual camera map: schematic field + one icon per camera. Optional selection and drag & drop. */
export function CameraMap({
  shape, cameras, selectedId, onSelect, onMove, print = false, title,
}: {
  shape: string; cameras: CameraPoint[]; selectedId?: string | null; onSelect?: (id: string) => void;
  onMove?: (id: string, x: number, y: number) => void; print?: boolean; title?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<string | null>(null);
  const fieldPal: FieldPalette = print ? PRINT_PALETTE : SCREEN_PALETTE;
  const camPal = print ? PRINT_CAMS : SCREEN_CAMS;

  const toSvg = (e: React.PointerEvent) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: Math.min(1, Math.max(0, p.x / W)), y: Math.min(1, Math.max(0, p.y / H)) };
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={`camera-map${onMove ? " is-editable" : ""}`}
      onPointerMove={(e) => { if (dragging.current && onMove) { const p = toSvg(e); onMove(dragging.current, p.x, p.y); } }}
      onPointerUp={() => { dragging.current = null; }}
      onPointerLeave={() => { dragging.current = null; }}
    >
      <FieldDrawing shape={shape} palette={fieldPal} />
      {cameras.map((c) => (
        <g
          key={c.id}
          style={{ cursor: onMove ? "grab" : onSelect ? "pointer" : undefined, touchAction: onMove ? "none" : undefined }}
          onPointerDown={(e) => {
            onSelect?.(c.id);
            if (onMove) { dragging.current = c.id; (e.target as Element).setPointerCapture?.(e.pointerId); }
          }}
          tabIndex={onSelect ? 0 : undefined}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect?.(c.id); }}
          aria-label={`Camera ${c.number}`}
        >
          <CameraMarker c={c} selected={selectedId === c.id} pal={camPal} />
        </g>
      ))}
    </svg>
  );
}
