import { useMemo, useState, useRef, useCallback } from "react";
import type { Doc, Id } from "@/convex/_generated/dataModel.d.ts";

type System = Doc<"software_systems">;
type Integration = Doc<"integrations">;

const TYPE_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  core:       { fill: "#312e81", stroke: "#6366f1", text: "#c7d2fe" },
  supporting: { fill: "#14532d", stroke: "#22c55e", text: "#bbf7d0" },
  legacy:     { fill: "#78350f", stroke: "#f59e0b", text: "#fde68a" },
  pilot:      { fill: "#1e3a5f", stroke: "#3b82f6", text: "#bfdbfe" },
};

const HEALTH_COLORS: Record<string, string> = {
  healthy:  "#22c55e",
  degraded: "#f59e0b",
  down:     "#ef4444",
  unknown:  "#6b7280",
};

const NODE_W = 150;
const NODE_H = 64;
const COLS = 4;
const COL_GAP = 220;
const ROW_GAP = 130;
const PADDING = 60;

interface Props {
  systems: System[];
  integrations: Integration[];
  selectedId: Id<"software_systems"> | null;
  onSelectSystem: (id: Id<"software_systems"> | null) => void;
}

interface NodePos {
  id: string;
  cx: number;
  cy: number;
}

function getCurvedPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = (x2 - x1) * 0.5;
  return `M ${x1},${y1} C ${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
}

export default function SystemFlowSVG({ systems, integrations, selectedId, onSelectSystem }: Props) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const lastMouse = useRef<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Compute positions
  const nodePositions: NodePos[] = useMemo(() => {
    return systems.map((s, i) => ({
      id: s._id,
      cx: PADDING + (i % COLS) * COL_GAP + NODE_W / 2,
      cy: PADDING + Math.floor(i / COLS) * ROW_GAP + NODE_H / 2,
    }));
  }, [systems]);

  const posMap = useMemo(() => {
    const m: Record<string, NodePos> = {};
    nodePositions.forEach((n) => { m[n.id] = n; });
    return m;
  }, [nodePositions]);

  const totalWidth = PADDING * 2 + COLS * COL_GAP;
  const totalHeight = PADDING * 2 + Math.ceil(systems.length / COLS) * ROW_GAP;

  // Filtered integrations based on selected
  const visibleIntegrations = useMemo(() => {
    if (!selectedId) return integrations;
    return integrations.filter(
      (i) => i.sourceSystemId === selectedId || i.destinationSystemId === selectedId
    );
  }, [integrations, selectedId]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).closest(".sys-node")) return;
    setDragging(true);
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !lastMouse.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    lastMouse.current = null;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.min(2, Math.max(0.3, z * delta)));
  }, []);

  return (
    <div className="relative w-full h-full bg-[#050d1a] rounded-lg overflow-hidden border border-border">
      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        <button
          onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
          className="w-7 h-7 rounded bg-white/10 text-white text-sm hover:bg-white/20 cursor-pointer flex items-center justify-center font-mono leading-none"
        >+</button>
        <button
          onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
          className="w-7 h-7 rounded bg-white/10 text-white text-sm hover:bg-white/20 cursor-pointer flex items-center justify-center font-mono leading-none"
        >−</button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="w-7 h-7 rounded bg-white/10 text-white text-xs hover:bg-white/20 cursor-pointer flex items-center justify-center"
          title="Reset view"
        >⊙</button>
      </div>

      <svg
        ref={svgRef}
        className={`w-full h-full select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          {/* Arrow markers for each health color */}
          {Object.entries(HEALTH_COLORS).map(([health, color]) => (
            <marker
              key={health}
              id={`arrow-${health}`}
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L8,3 z" fill={color} />
            </marker>
          ))}
          {/* Glow filter */}
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Selected glow */}
          <filter id="selected-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Grid pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
          </pattern>
        </defs>

        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          {/* Background grid */}
          <rect width={totalWidth} height={totalHeight} fill="url(#grid)" />

          {/* Edges */}
          {visibleIntegrations.map((intg) => {
            const src = posMap[intg.sourceSystemId];
            const dst = posMap[intg.destinationSystemId];
            if (!src || !dst) return null;
            const color = HEALTH_COLORS[intg.healthStatus] ?? "#6b7280";
            const strokeW = intg.criticalLevel === "high" ? 2.5 : intg.criticalLevel === "medium" ? 1.8 : 1.2;
            const isAnimated = intg.method === "realtime";
            const path = getCurvedPath(src.cx + NODE_W / 2, src.cy, dst.cx - NODE_W / 2, dst.cy);

            return (
              <g key={intg._id}>
                {/* Glow background for important integrations */}
                {intg.criticalLevel === "high" && (
                  <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeW + 4}
                    opacity={0.15}
                  />
                )}
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeW}
                  markerEnd={`url(#arrow-${intg.healthStatus})`}
                  opacity={selectedId && intg.sourceSystemId !== selectedId && intg.destinationSystemId !== selectedId ? 0.25 : 0.9}
                >
                  {isAnimated && (
                    <animate
                      attributeName="stroke-dashoffset"
                      from="0"
                      to="-20"
                      dur="0.8s"
                      repeatCount="indefinite"
                    />
                  )}
                </path>

                {/* Protocol label at midpoint */}
                {(() => {
                  const mx = (src.cx + NODE_W / 2 + dst.cx - NODE_W / 2) / 2;
                  const my = (src.cy + dst.cy) / 2 - 10;
                  return (
                    <text
                      x={mx}
                      y={my}
                      textAnchor="middle"
                      fill={color}
                      fontSize="9"
                      opacity={selectedId && intg.sourceSystemId !== selectedId && intg.destinationSystemId !== selectedId ? 0.2 : 0.8}
                    >
                      {intg.protocol}
                    </text>
                  );
                })()}
              </g>
            );
          })}

          {/* Nodes */}
          {systems.map((sys) => {
            const pos = posMap[sys._id];
            if (!pos) return null;
            const colors = TYPE_COLORS[sys.type] ?? TYPE_COLORS.core;
            const isSelected = selectedId === sys._id;
            const isConnected =
              selectedId &&
              integrations.some(
                (i) =>
                  (i.sourceSystemId === selectedId && i.destinationSystemId === sys._id) ||
                  (i.destinationSystemId === selectedId && i.sourceSystemId === sys._id)
              );
            const dimmed = selectedId && !isSelected && !isConnected;

            return (
              <g
                key={sys._id}
                className="sys-node"
                transform={`translate(${pos.cx - NODE_W / 2},${pos.cy - NODE_H / 2})`}
                style={{ cursor: "pointer", opacity: dimmed ? 0.15 : 1, transition: "opacity 0.2s", pointerEvents: "all" }}
                onClick={(e) => { e.stopPropagation(); onSelectSystem(isSelected ? null : sys._id); }}
                onMouseDown={(e) => e.stopPropagation()}
                filter={isSelected ? "url(#selected-glow)" : undefined}
              >
                {/* Node background */}
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx="8"
                  fill={colors.fill}
                  stroke={isSelected ? "#fff" : colors.stroke}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />

                {/* Top accent bar */}
                <rect
                  width={NODE_W}
                  height="4"
                  rx="8"
                  fill={colors.stroke}
                  opacity={0.8}
                />

                {/* System name */}
                <text
                  x={NODE_W / 2}
                  y={26}
                  textAnchor="middle"
                  fill={colors.text}
                  fontSize="11"
                  fontWeight="600"
                >
                  {sys.name.length > 16 ? sys.name.slice(0, 14) + "…" : sys.name}
                </text>

                {/* Category + type */}
                <text
                  x={NODE_W / 2}
                  y={41}
                  textAnchor="middle"
                  fill={colors.text}
                  fontSize="8.5"
                  opacity={0.7}
                >
                  {sys.category} · {sys.type}
                </text>

                {/* Health / status indicator */}
                <circle
                  cx={NODE_W - 10}
                  cy={10}
                  r="4"
                  fill={sys.status === "active" ? "#22c55e" : sys.status === "sunset" ? "#ef4444" : "#f59e0b"}
                />

                {/* Criticality badge */}
                {sys.criticality === "high" && (
                  <rect x={6} y={50} width={34} height={10} rx="3" fill="#ef4444" opacity={0.8} />
                )}
                {sys.criticality === "high" && (
                  <text x={23} y={58} textAnchor="middle" fill="white" fontSize="7" fontWeight="600">CRITICAL</text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
