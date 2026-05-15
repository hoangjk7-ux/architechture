import { useMemo } from "react";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";

type RoadmapItem = Doc<"roadmap_items">;

const STATUS_COLORS: Record<string, { bar: string; text: string }> = {
  not_started: { bar: "#334155", text: "#94a3b8" },
  in_progress: { bar: "#3b82f6", text: "#bfdbfe" },
  blocked:     { bar: "#ef4444", text: "#fecaca" },
  done:        { bar: "#22c55e", text: "#bbf7d0" },
  cancelled:   { bar: "#475569", text: "#94a3b8" },
};

const LEVEL_INDENT: Record<string, number> = {
  initiative: 0,
  program: 14,
  project: 28,
  epic: 42,
};

const ROW_H = 32;
const LABEL_W = 200;
const CHART_PADDING = 12;

interface Props {
  items: RoadmapItem[];
}

function parseDate(s: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function formatMonth(date: Date) {
  return date.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

export default function GanttChart({ items }: Props) {
  const { rows, minDate, maxDate, totalDays } = useMemo(() => {
    // Filter items that have dates
    const validItems = items.filter((i) => i.startDate || i.dueDate);

    let minDate = new Date();
    let maxDate = new Date();
    let hasAny = false;

    validItems.forEach((item) => {
      const start = parseDate(item.startDate);
      const end = parseDate(item.dueDate);
      if (start) {
        if (!hasAny || start < minDate) minDate = start;
        hasAny = true;
      }
      if (end) {
        if (!hasAny || end > maxDate) maxDate = end;
        hasAny = true;
      }
    });

    if (!hasAny) {
      // Default range: today → 6 months
      minDate = new Date();
      maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 6);
    }

    // Extend range slightly
    minDate = new Date(minDate);
    minDate.setDate(1);
    maxDate = new Date(maxDate);
    maxDate.setMonth(maxDate.getMonth() + 1);
    maxDate.setDate(0);

    const totalDays = Math.max(1, Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));

    return { rows: validItems, minDate, maxDate, totalDays };
  }, [items]);

  // Month markers
  const months = useMemo(() => {
    const result: { label: string; x: number }[] = [];
    const d = new Date(minDate);
    d.setDate(1);
    while (d <= maxDate) {
      const dayOffset = Math.round((d.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
      result.push({ label: formatMonth(d), x: dayOffset });
      d.setMonth(d.getMonth() + 1);
    }
    return result;
  }, [minDate, maxDate]);

  const today = new Date();
  const todayX = Math.round((today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

  const svgWidth = 800; // base width, scales via viewBox
  const chartW = svgWidth - LABEL_W - CHART_PADDING * 2;
  const svgHeight = ROW_H * (rows.length + 1) + 40;

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No roadmap items with scheduled dates to display
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full"
        style={{ minHeight: svgHeight }}
      >
        <defs>
          <pattern id="gantt-grid" width={chartW / Math.max(1, months.length)} height={ROW_H} patternUnits="userSpaceOnUse" x={LABEL_W + CHART_PADDING}>
            <line x1="0" y1="0" x2="0" y2={ROW_H * 100} stroke="#1e293b" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Background */}
        <rect width={svgWidth} height={svgHeight} fill="#0a0f1e" />

        {/* Row stripes */}
        {rows.map((_, i) => (
          <rect
            key={i}
            x={0}
            y={40 + i * ROW_H}
            width={svgWidth}
            height={ROW_H}
            fill={i % 2 === 0 ? "#0d1526" : "#0a0f1e"}
          />
        ))}

        {/* Month headers */}
        {months.map((m, i) => {
          const xPos = LABEL_W + CHART_PADDING + (m.x / totalDays) * chartW;
          return (
            <g key={i}>
              <line x1={xPos} y1={0} x2={xPos} y2={svgHeight} stroke="#1e293b" strokeWidth="1" />
              <text x={xPos + 4} y={14} fill="#475569" fontSize="9" fontWeight="500">{m.label}</text>
            </g>
          );
        })}

        {/* Today marker */}
        {todayX >= 0 && todayX <= totalDays && (
          <g>
            <line
              x1={LABEL_W + CHART_PADDING + (todayX / totalDays) * chartW}
              y1={0}
              x2={LABEL_W + CHART_PADDING + (todayX / totalDays) * chartW}
              y2={svgHeight}
              stroke="#f59e0b"
              strokeWidth="1.5"
              strokeDasharray="4,3"
              opacity={0.8}
            />
            <text
              x={LABEL_W + CHART_PADDING + (todayX / totalDays) * chartW + 3}
              y={26}
              fill="#f59e0b"
              fontSize="8"
              fontWeight="600"
            >TODAY</text>
          </g>
        )}

        {/* Rows */}
        {rows.map((item, i) => {
          const yTop = 40 + i * ROW_H;
          const yMid = yTop + ROW_H / 2;
          const start = parseDate(item.startDate);
          const end = parseDate(item.dueDate);
          const indent = LEVEL_INDENT[item.level] ?? 0;
          const colors = STATUS_COLORS[item.status] ?? STATUS_COLORS.not_started;

          let barX = 0;
          let barW = 0;
          if (start && end) {
            const startDay = Math.max(0, Math.round((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
            const endDay = Math.min(totalDays, Math.round((end.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
            barX = LABEL_W + CHART_PADDING + (startDay / totalDays) * chartW;
            barW = Math.max(6, ((endDay - startDay) / totalDays) * chartW);
          } else if (start) {
            const startDay = Math.max(0, Math.round((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
            barX = LABEL_W + CHART_PADDING + (startDay / totalDays) * chartW;
            barW = Math.max(20, chartW * 0.05);
          } else if (end) {
            const endDay = Math.min(totalDays, Math.round((end.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
            barX = LABEL_W + CHART_PADDING + Math.max(0, (endDay / totalDays) * chartW - 30);
            barW = 30;
          }

          const barHeight = item.level === "initiative" ? 16 : item.level === "program" ? 14 : 12;
          const barY = yMid - barHeight / 2;

          return (
            <g key={item._id}>
              {/* Label */}
              <text
                x={8 + indent}
                y={yMid + 4}
                fill={colors.text}
                fontSize={item.level === "initiative" ? "10" : "9"}
                fontWeight={item.level === "initiative" ? "700" : "400"}
              >
                {item.title.length > 22 ? item.title.slice(0, 20) + "…" : item.title}
              </text>

              {/* Level dot */}
              <circle
                cx={indent > 0 ? indent - 4 : 0}
                cy={yMid}
                r={2}
                fill={colors.bar}
                opacity={indent > 0 ? 1 : 0}
              />

              {/* Bar background track */}
              <rect
                x={LABEL_W + CHART_PADDING}
                y={barY}
                width={chartW}
                height={barHeight}
                rx="3"
                fill="#1e293b"
                opacity={0.3}
              />

              {/* Bar */}
              {(barW > 0) && (
                <rect
                  x={barX}
                  y={barY}
                  width={barW}
                  height={barHeight}
                  rx="3"
                  fill={colors.bar}
                  opacity={0.85}
                />
              )}

              {/* Progress fill for in_progress */}
              {item.status === "in_progress" && barW > 0 && (
                <rect
                  x={barX}
                  y={barY}
                  width={barW * 0.4}
                  height={barHeight}
                  rx="3"
                  fill="#93c5fd"
                  opacity={0.5}
                />
              )}

              {/* Bar label */}
              {barW > 40 && (
                <text
                  x={barX + 6}
                  y={yMid + 3.5}
                  fill="white"
                  fontSize="7.5"
                  fontWeight="500"
                  opacity={0.9}
                >
                  {item.status.replace("_", " ")}
                </text>
              )}
            </g>
          );
        })}

        {/* Divider between label and chart */}
        <line x1={LABEL_W} y1={0} x2={LABEL_W} y2={svgHeight} stroke="#1e293b" strokeWidth="1.5" />

        {/* Header row */}
        <rect x={0} y={0} width={svgWidth} height={36} fill="#0d1a2e" />
        <text x={8} y={22} fill="#64748b" fontSize="9" fontWeight="600" letterSpacing="0.5">ROADMAP ITEM</text>
        <text x={LABEL_W + CHART_PADDING + 4} y={22} fill="#64748b" fontSize="9" fontWeight="600" letterSpacing="0.5">TIMELINE</text>
      </svg>
    </div>
  );
}
