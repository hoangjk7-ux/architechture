import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeProps,
  MarkerType,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import type { Doc, Id } from "@/convex/_generated/dataModel.d.ts";
import {
  Server, X, Database, HardDrive, Globe,
  Shield, TrendingUp, TrendingDown,
  ArrowRight, ArrowLeft, RefreshCw,
  Layers, CheckCircle2, Wrench, CalendarClock, Archive, CircleDot,
} from "lucide-react";

type System = Doc<"software_systems">;
type Integration = Doc<"integrations">;
type SystemModule = Doc<"system_modules">;

// ─── Metadata ───────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; bg: string; border: string; text: string; badge: string }> = {
  core:       { label: "Core",       bg: "#1a1f3e", border: "#6366f1", text: "#c7d2fe", badge: "#6366f1" },
  supporting: { label: "Supporting", bg: "#0f2318", border: "#22c55e", text: "#bbf7d0", badge: "#22c55e" },
  legacy:     { label: "Legacy",     bg: "#2a1a06", border: "#f59e0b", text: "#fde68a", badge: "#f59e0b" },
  pilot:      { label: "Pilot",      bg: "#0a1a35", border: "#3b82f6", text: "#bfdbfe", badge: "#3b82f6" },
};

const STATUS_META: Record<string, { color: string; icon: string }> = {
  active:   { color: "#22c55e", icon: "●" },
  sunset:   { color: "#ef4444", icon: "●" },
  pilot:    { color: "#f59e0b", icon: "◑" },
  inactive: { color: "#6b7280", icon: "○" },
};

const HEALTH_META: Record<string, { color: string; label: string }> = {
  healthy:  { color: "#22c55e", label: "Healthy" },
  degraded: { color: "#f59e0b", label: "Degraded" },
  down:     { color: "#ef4444", label: "Down" },
  unknown:  { color: "#6b7280", label: "Unknown" },
};

const METHOD_META: Record<string, { label: string; color: string }> = {
  realtime:     { label: "Realtime", color: "#6366f1" },
  batch:        { label: "Batch",    color: "#64748b" },
  event_driven: { label: "Event",    color: "#8b5cf6" },
  manual:       { label: "Manual",   color: "#94a3b8" },
};

const LIFECYCLE_META: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType; order: number }> = {
  in_use:         { label: "Đang dùng",      color: "#22c55e", bg: "#14532d33", Icon: CheckCircle2,  order: 1 },
  in_development: { label: "Đang phát triển", color: "#3b82f6", bg: "#1e3a5f33", Icon: Wrench,        order: 2 },
  planned:        { label: "Kế hoạch",        color: "#a855f7", bg: "#3b0764aa", Icon: CalendarClock, order: 3 },
  deprecated:     { label: "Sắp bỏ",         color: "#f59e0b", bg: "#78350f33", Icon: Archive,       order: 4 },
  retired:        { label: "Đã bỏ",           color: "#6b7280", bg: "#1e293b",   Icon: CircleDot,     order: 5 },
};

// ─── Custom Node ─────────────────────────────────────────────────────────────
interface NodeData {
  system: System;
  inCount: number;
  outCount: number;
  worstHealth: string;
  isSelected: boolean;
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height: 4, background: "#1e293b", borderRadius: 4 }}>
      <div style={{ height: 4, borderRadius: 4, width: `${value}%`, background: color, transition: "width 0.3s" }} />
    </div>
  );
}

function SystemNode({ data }: NodeProps<NodeData>) {
  const { system: s, inCount, outCount, worstHealth, isSelected } = data;
  const meta = TYPE_META[s.type] ?? TYPE_META.core;
  const statusMeta = STATUS_META[s.status] ?? STATUS_META.inactive;
  const healthColor = HEALTH_META[worstHealth]?.color ?? "#6b7280";
  return (
    <div
      style={{
        background: meta.bg, borderRadius: 10, width: 190, cursor: "pointer",
        border: `${isSelected ? "2.5px" : "1.5px"} solid ${isSelected ? "#fff" : meta.border}`,
        boxShadow: isSelected ? `0 0 0 3px ${meta.border}55, 0 4px 24px #0008` : "0 2px 12px #0006",
        transition: "all 0.15s",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: healthColor, width: 8, height: 8, border: "2px solid #0f172a" }} />
      <Handle type="source" position={Position.Right} style={{ background: healthColor, width: 8, height: 8, border: "2px solid #0f172a" }} />
      <div style={{ background: meta.badge, borderRadius: "8px 8px 0 0", padding: "3px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "#fff", fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>{meta.label}</span>
        <span style={{ color: "#fff", fontSize: 10, opacity: 0.9 }}>
          <span style={{ color: statusMeta.color }}>{statusMeta.icon}</span> {s.status}
        </span>
      </div>
      <div style={{ padding: "8px 10px" }}>
        <div style={{ color: meta.text, fontWeight: 700, fontSize: 12, lineHeight: 1.3, marginBottom: 2 }}>{s.name}</div>
        <div style={{ color: meta.text, fontSize: 9, opacity: 0.6, marginBottom: 7 }}>
          {s.category}{s.criticality === "high" ? " · 🔴 Critical" : ""}
        </div>
        {s.technology && (
          <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
            <span style={{ fontSize: 8, color: "#64748b", background: "#1e293b", borderRadius: 4, padding: "1px 5px" }}>{s.technology}</span>
            {s.hosting && <span style={{ fontSize: 8, color: "#64748b", background: "#1e293b", borderRadius: 4, padding: "1px 5px" }}>
              {s.hosting.includes("AWS") ? "☁ AWS" : s.hosting.includes("GCP") ? "☁ GCP" : s.hosting.includes("Azure") ? "☁ Azure" : s.hosting.includes("On-Premise") ? "🖥 On-Prem" : `☁ ${s.hosting}`}
            </span>}
          </div>
        )}
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#64748b", marginBottom: 2 }}>
            <span>Arch Score</span><span style={{ color: "#22c55e", fontWeight: 600 }}>{s.architectureScore}</span>
          </div>
          <ScoreBar value={s.architectureScore} color="#22c55e" />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#64748b", marginTop: 4, marginBottom: 2 }}>
            <span>Tech Debt</span>
            <span style={{ color: s.technicalDebtScore > 60 ? "#ef4444" : s.technicalDebtScore > 30 ? "#f59e0b" : "#22c55e", fontWeight: 600 }}>{s.technicalDebtScore}</span>
          </div>
          <ScoreBar value={s.technicalDebtScore} color={s.technicalDebtScore > 60 ? "#ef4444" : s.technicalDebtScore > 30 ? "#f59e0b" : "#22c55e"} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #1e293b", paddingTop: 5 }}>
          <span style={{ fontSize: 8, color: "#64748b" }}>← {inCount} in</span>
          <span style={{ fontSize: 8, color: healthColor, background: `${healthColor}22`, borderRadius: 4, padding: "1px 5px", fontWeight: 600 }}>
            {HEALTH_META[worstHealth]?.label ?? "?"}
          </span>
          <span style={{ fontSize: 8, color: "#64748b" }}>{outCount} out →</span>
        </div>
      </div>
    </div>
  );
}
const nodeTypes = { system: SystemNode };

// ─── Helpers ─────────────────────────────────────────────────────────────────
function healthPriority(h: string) { return h === "down" ? 3 : h === "degraded" ? 2 : h === "unknown" ? 1 : 0; }
function worstHealthFor(sysId: string, integrations: Integration[]): string {
  const connected = integrations.filter((i) => i.sourceSystemId === sysId || i.destinationSystemId === sysId);
  if (!connected.length) return "unknown";
  return connected.reduce((worst, i) => healthPriority(i.healthStatus) > healthPriority(worst) ? i.healthStatus : worst, "healthy");
}
function layoutNodes(systems: System[]): Record<string, { x: number; y: number }> {
  const groups: Record<string, System[]> = { core: [], supporting: [], legacy: [], pilot: [] };
  systems.forEach((s) => { (groups[s.type] ?? groups.core).push(s); });
  const positions: Record<string, { x: number; y: number }> = {};
  const COL_W = 220, ROW_H = 200;
  const coreStart = Math.max(0, 1 - Math.floor(groups.core.length / 2));
  groups.core.forEach((s, i) => { positions[s._id] = { x: (coreStart + i) * COL_W + 60, y: 40 }; });
  const supStart = Math.max(0, 1 - Math.floor(groups.supporting.length / 2));
  groups.supporting.forEach((s, i) => { positions[s._id] = { x: (supStart + i) * COL_W + 60, y: 40 + ROW_H }; });
  groups.pilot.forEach((s, i) => { positions[s._id] = { x: 60 + (groups.supporting.length + i) * COL_W, y: 40 + ROW_H }; });
  const legStart = Math.max(0, 1 - Math.floor(groups.legacy.length / 2));
  groups.legacy.forEach((s, i) => { positions[s._id] = { x: (legStart + i) * COL_W + 60, y: 40 + ROW_H * 2 }; });
  return positions;
}

// ─── Module section ───────────────────────────────────────────────────────────
function ModuleRow({ mod }: { mod: SystemModule }) {
  const lm = LIFECYCLE_META[mod.lifecycle] ?? LIFECYCLE_META.in_use;
  const hm = HEALTH_META[mod.health] ?? HEALTH_META.unknown;
  const Icon = lm.Icon;
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-lg border cursor-pointer transition-all"
      style={{ borderColor: expanded ? lm.color + "55" : "#1e293b", background: expanded ? lm.bg : "#0d1526" }}
      onClick={() => setExpanded((v) => !v)}
    >
      {/* Collapsed header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: lm.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold truncate">{mod.name}</span>
            {mod.version && (
              <span className="text-[9px] text-muted-foreground font-mono bg-muted px-1 py-0.5 rounded shrink-0">{mod.version}</span>
            )}
          </div>
        </div>
        {/* Health dot only for in_use/deprecated */}
        {(mod.lifecycle === "in_use" || mod.lifecycle === "deprecated") && (
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: hm.color }} />
        )}
        {/* Planned date for non-in_use */}
        {mod.plannedDate && mod.lifecycle !== "in_use" && (
          <span className="text-[9px] shrink-0" style={{ color: lm.color }}>{mod.plannedDate.slice(0, 7)}</span>
        )}
        <span className="text-muted-foreground text-xs ml-0.5">{expanded ? "▲" : "▼"}</span>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t" style={{ borderColor: lm.color + "33" }}>
          {/* Lifecycle + health badges */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: lm.bg, color: lm.color, border: `1px solid ${lm.color}44` }}>
              <Icon className="h-2.5 w-2.5" />{lm.label}
            </span>
            {(mod.lifecycle === "in_use" || mod.lifecycle === "deprecated") && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: hm.color + "22", color: hm.color, border: `1px solid ${hm.color}44` }}>
                {hm.label}
              </span>
            )}
          </div>
          {mod.description && <p className="text-[10px] text-muted-foreground leading-relaxed">{mod.description}</p>}
          {mod.notes && (
            <div className="rounded px-2.5 py-1.5 text-[10px] leading-relaxed" style={{ background: lm.color + "15", color: lm.color, border: `1px solid ${lm.color}33` }}>
              📌 {mod.notes}
            </div>
          )}
          {mod.usedBy.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {mod.usedBy.map((u) => (
                <span key={u} className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{u}</span>
              ))}
            </div>
          )}
          {mod.plannedDate && (
            <div className="text-[10px] text-muted-foreground">
              Target: <span className="font-medium" style={{ color: lm.color }}>{mod.plannedDate}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ModulesTab({ modules }: { modules: SystemModule[] }) {
  const [filter, setFilter] = useState<string>("all");

  const lifecycles = useMemo(() => {
    const seen = new Set(modules.map((m) => m.lifecycle));
    return (Object.keys(LIFECYCLE_META) as (keyof typeof LIFECYCLE_META)[]).filter((k) => seen.has(k as SystemModule["lifecycle"]));
  }, [modules]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    modules.forEach((m) => { c[m.lifecycle] = (c[m.lifecycle] ?? 0) + 1; });
    return c;
  }, [modules]);

  const filtered = useMemo(() => {
    const sorted = [...modules].sort((a, b) => {
      const oa = LIFECYCLE_META[a.lifecycle]?.order ?? 99;
      const ob = LIFECYCLE_META[b.lifecycle]?.order ?? 99;
      return oa !== ob ? oa - ob : a.sortOrder - b.sortOrder;
    });
    if (filter === "all") return sorted;
    return sorted.filter((m) => m.lifecycle === filter);
  }, [modules, filter]);

  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
        <Layers className="h-8 w-8 opacity-30" />
        <p className="text-sm">No modules recorded</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter("all")}
          className="text-[10px] px-2.5 py-1 rounded-full font-medium cursor-pointer transition-all border"
          style={{ background: filter === "all" ? "#ffffff22" : "transparent", borderColor: filter === "all" ? "#ffffff44" : "#1e293b", color: filter === "all" ? "#fff" : "#64748b" }}
        >
          All {modules.length}
        </button>
        {lifecycles.map((lc) => {
          const lm = LIFECYCLE_META[lc];
          const Icon = lm.Icon;
          return (
            <button
              key={lc}
              onClick={() => setFilter(filter === lc ? "all" : lc)}
              className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-medium cursor-pointer transition-all border"
              style={{ background: filter === lc ? lm.bg : "transparent", borderColor: filter === lc ? lm.color + "88" : "#1e293b", color: filter === lc ? lm.color : "#64748b" }}
            >
              <Icon className="h-2.5 w-2.5" />{lm.label} {counts[lc] ?? 0}
            </button>
          );
        })}
      </div>

      {/* Module rows grouped by lifecycle */}
      <div className="space-y-1.5">
        {filtered.map((mod) => <ModuleRow key={mod._id} mod={mod} />)}
      </div>
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
type PanelTab = "overview" | "modules" | "integrations";

function DetailPanel({
  system, integrations, systems, modules, onClose,
}: {
  system: System; integrations: Integration[]; systems: System[];
  modules: SystemModule[]; onClose: () => void;
}) {
  const meta = TYPE_META[system.type] ?? TYPE_META.core;
  const outbound = integrations.filter((i) => i.sourceSystemId === system._id);
  const inbound = integrations.filter((i) => i.destinationSystemId === system._id);
  const [activeTab, setActiveTab] = useState<PanelTab>("modules");

  const moduleCount = modules.length;
  const inUseCnt = modules.filter((m) => m.lifecycle === "in_use").length;
  const plannedCnt = modules.filter((m) => m.lifecycle === "planned" || m.lifecycle === "in_development").length;
  const depCnt = modules.filter((m) => m.lifecycle === "deprecated" || m.lifecycle === "retired").length;

  const TABS: { id: PanelTab; label: string; count?: number }[] = [
    { id: "modules", label: "Modules", count: moduleCount },
    { id: "integrations", label: "Integrations", count: outbound.length + inbound.length },
    { id: "overview", label: "Overview" },
  ];

  return (
    <div className="w-[340px] border-l border-border bg-background flex flex-col overflow-hidden shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0" style={{ background: meta.bg }}>
        <div className="flex items-center gap-2 min-w-0">
          <Server className="h-4 w-4 shrink-0" style={{ color: meta.badge }} />
          <div className="min-w-0">
            <div className="font-bold text-sm truncate" style={{ color: meta.text }}>{system.name}</div>
            <div className="text-[10px] opacity-60" style={{ color: meta.text }}>{system.category} · {meta.label}</div>
          </div>
        </div>
        <button onClick={onClose} className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Module summary bar */}
      {moduleCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/10 shrink-0">
          <span className="text-[10px] text-muted-foreground">{moduleCount} modules</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] text-green-400">{inUseCnt} active</span>
          </div>
          {plannedCnt > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] text-blue-400">{plannedCnt} upcoming</span>
            </div>
          )}
          {depCnt > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-[10px] text-yellow-400">{depCnt} deprecated</span>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border shrink-0 bg-muted/10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium cursor-pointer transition-colors border-b-2"
            style={{
              borderBottomColor: activeTab === tab.id ? meta.badge : "transparent",
              color: activeTab === tab.id ? "#fff" : "#64748b",
              background: activeTab === tab.id ? meta.bg + "88" : "transparent",
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="text-[9px] rounded-full px-1.5 py-0.5 font-mono" style={{ background: activeTab === tab.id ? meta.badge + "55" : "#1e293b", color: activeTab === tab.id ? meta.text : "#64748b" }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* ── MODULES TAB ── */}
        {activeTab === "modules" && <ModulesTab modules={modules} />}

        {/* ── INTEGRATIONS TAB ── */}
        {activeTab === "integrations" && (
          <div className="space-y-4">
            {outbound.length > 0 && (
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-2 flex items-center gap-1.5">
                  <ArrowRight className="h-3 w-3" /> Outbound ({outbound.length})
                </div>
                <div className="space-y-1.5">
                  {outbound.map((intg) => {
                    const dest = systems.find((s) => s._id === intg.destinationSystemId);
                    const hc = HEALTH_META[intg.healthStatus] ?? HEALTH_META.unknown;
                    const mc = METHOD_META[intg.method] ?? METHOD_META.manual;
                    return (
                      <div key={intg._id} className="bg-muted/30 rounded-lg p-2.5 space-y-1.5 border" style={{ borderColor: hc.color + "33" }}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold truncate">{dest?.name ?? "Unknown"}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0" style={{ background: hc.color + "22", color: hc.color }}>{hc.label}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">{intg.name}</div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{intg.protocol}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: mc.color + "22", color: mc.color }}>{mc.label}</span>
                          {!intg.isArchitectureCompliant && <span className="text-[9px] text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded">Non-compliant</span>}
                          {intg.errorRate !== undefined && intg.errorRate > 0 && <span className="text-[9px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">Err {intg.errorRate}%</span>}
                        </div>
                        {intg.lastSync && <div className="text-[9px] text-muted-foreground">Last sync: {intg.lastSync.slice(0, 16).replace("T", " ")}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {inbound.length > 0 && (
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mb-2 flex items-center gap-1.5">
                  <ArrowLeft className="h-3 w-3" /> Inbound ({inbound.length})
                </div>
                <div className="space-y-1.5">
                  {inbound.map((intg) => {
                    const src = systems.find((s) => s._id === intg.sourceSystemId);
                    const hc = HEALTH_META[intg.healthStatus] ?? HEALTH_META.unknown;
                    const mc = METHOD_META[intg.method] ?? METHOD_META.manual;
                    return (
                      <div key={intg._id} className="bg-muted/30 rounded-lg p-2.5 space-y-1.5 border" style={{ borderColor: hc.color + "33" }}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold truncate">{src?.name ?? "Unknown"}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0" style={{ background: hc.color + "22", color: hc.color }}>{hc.label}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">{intg.name}</div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-mono">{intg.protocol}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: mc.color + "22", color: mc.color }}>{mc.label}</span>
                          {!intg.isArchitectureCompliant && <span className="text-[9px] text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded">Non-compliant</span>}
                          {intg.errorRate !== undefined && intg.errorRate > 0 && <span className="text-[9px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">Err {intg.errorRate}%</span>}
                        </div>
                        {intg.lastSync && <div className="text-[9px] text-muted-foreground">Last sync: {intg.lastSync.slice(0, 16).replace("T", " ")}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {outbound.length === 0 && inbound.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No integrations recorded</p>
            )}
          </div>
        )}

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Status",      value: system.status,      color: STATUS_META[system.status]?.color ?? "#6b7280" },
                { label: "Criticality", value: system.criticality, color: system.criticality === "high" ? "#ef4444" : system.criticality === "medium" ? "#f59e0b" : "#22c55e" },
                { label: "Risk Level",  value: system.riskLevel,   color: system.riskLevel === "high" ? "#ef4444" : system.riskLevel === "medium" ? "#f59e0b" : "#22c55e" },
                { label: "Hosting",     value: system.hosting ?? "—", color: "#64748b" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-muted/40 rounded-lg p-2">
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</div>
                  <div className="text-xs font-semibold capitalize" style={{ color }}>{value}</div>
                </div>
              ))}
            </div>
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="h-2.5 w-2.5" /> Architecture Score</span>
                  <span className="font-mono font-bold" style={{ color: system.architectureScore >= 70 ? "#22c55e" : system.architectureScore >= 50 ? "#f59e0b" : "#ef4444" }}>{system.architectureScore}/100</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-2 rounded-full" style={{ width: `${system.architectureScore}%`, background: system.architectureScore >= 70 ? "#22c55e" : system.architectureScore >= 50 ? "#f59e0b" : "#ef4444" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground flex items-center gap-1"><TrendingDown className="h-2.5 w-2.5" /> Technical Debt</span>
                  <span className="font-mono font-bold" style={{ color: system.technicalDebtScore > 60 ? "#ef4444" : system.technicalDebtScore > 30 ? "#f59e0b" : "#22c55e" }}>{system.technicalDebtScore}/100</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-2 rounded-full" style={{ width: `${system.technicalDebtScore}%`, background: system.technicalDebtScore > 60 ? "#ef4444" : system.technicalDebtScore > 30 ? "#f59e0b" : "#22c55e" }} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {system.technology && <span className="flex items-center gap-1 text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground"><Database className="h-2.5 w-2.5" />{system.technology}</span>}
              {system.database && <span className="flex items-center gap-1 text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground"><HardDrive className="h-2.5 w-2.5" />{system.database}</span>}
              {system.sla && <span className="flex items-center gap-1 text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground"><Shield className="h-2.5 w-2.5" />{system.sla}</span>}
            </div>
            <div className="space-y-1.5 text-xs">
              {system.owner && <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span className="font-medium">{system.owner}</span></div>}
              {system.licenseType && <div className="flex justify-between"><span className="text-muted-foreground">License</span><span className="font-medium">{system.licenseType}</span></div>}
              {system.costPerYear && <div className="flex justify-between"><span className="text-muted-foreground">Annual Cost</span><span className="font-medium">${system.costPerYear.toLocaleString()}</span></div>}
              {system.contractEndDate && <div className="flex justify-between"><span className="text-muted-foreground">Contract Ends</span><span className="font-medium">{system.contractEndDate}</span></div>}
              {system.departments.length > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Departments</span><span className="font-medium text-right max-w-[55%]">{system.departments.join(", ")}</span></div>}
              {system.campuses.length > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Campuses</span><span className="font-medium text-right max-w-[55%]">{system.campuses.join(", ")}</span></div>}
              {system.description && <p className="text-muted-foreground leading-relaxed pt-1">{system.description}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function ArchitectureContent() {
  const systems      = useQuery(api.software_systems.list) ?? [];
  const integrations = useQuery(api.integrations.list) ?? [];
  const allModules   = useQuery(api.system_modules.list) ?? [];

  const [selectedId,   setSelectedId]   = useState<Id<"software_systems"> | null>(null);
  const [filterType,   setFilterType]   = useState<string>("all");
  const [filterHealth, setFilterHealth] = useState<string>("all");

  const selectedSystem  = useMemo(() => systems.find((s) => s._id === selectedId) ?? null, [systems, selectedId]);
  const selectedModules = useMemo(() => allModules.filter((m) => m.systemId === selectedId), [allModules, selectedId]);
  const positions       = useMemo(() => layoutNodes(systems), [systems]);

  const filteredSystems = useMemo(() => systems.filter((s) => {
    if (filterType !== "all" && s.type !== filterType) return false;
    if (filterHealth !== "all" && worstHealthFor(s._id, integrations) !== filterHealth) return false;
    return true;
  }), [systems, integrations, filterType, filterHealth]);

  const filteredIds = useMemo(() => new Set(filteredSystems.map((s) => s._id)), [filteredSystems]);

  const nodes: Node<NodeData>[] = useMemo(() => systems.map((s) => ({
    id: s._id,
    type: "system",
    position: positions[s._id] ?? { x: 0, y: 0 },
    data: {
      system: s,
      inCount: integrations.filter((i) => i.destinationSystemId === s._id).length,
      outCount: integrations.filter((i) => i.sourceSystemId === s._id).length,
      worstHealth: worstHealthFor(s._id, integrations),
      isSelected: selectedId === s._id,
    },
    style: { opacity: filteredIds.has(s._id) ? 1 : 0.2 },
  })), [systems, integrations, positions, selectedId, filteredIds]);

  const edges: Edge[] = useMemo(() => integrations.map((intg) => {
    const hc = HEALTH_META[intg.healthStatus] ?? HEALTH_META.unknown;
    const isFocused = selectedId === intg.sourceSystemId || selectedId === intg.destinationSystemId;
    const isFiltered = filteredIds.has(intg.sourceSystemId) && filteredIds.has(intg.destinationSystemId);
    return {
      id: intg._id,
      source: intg.sourceSystemId,
      target: intg.destinationSystemId,
      label: `${intg.protocol} · ${METHOD_META[intg.method]?.label ?? intg.method}${intg.errorRate ? ` · ${intg.errorRate}% err` : ""}`,
      labelStyle: { fill: hc.color, fontSize: 8, fontWeight: 500 },
      labelBgStyle: { fill: "#0f172a", fillOpacity: 0.85 },
      labelBgPadding: [4, 3] as [number, number],
      labelBgBorderRadius: 4,
      style: {
        stroke: hc.color,
        strokeWidth: intg.criticalLevel === "high" ? 2.5 : intg.criticalLevel === "medium" ? 1.8 : 1.2,
        strokeDasharray: !intg.isArchitectureCompliant ? "6,4" : undefined,
        opacity: selectedId ? (isFocused ? 1 : 0.15) : isFiltered ? 0.9 : 0.15,
      },
      animated: intg.method === "realtime",
      markerEnd: { type: MarkerType.ArrowClosed, color: hc.color, width: 16, height: 16 },
    };
  }), [integrations, selectedId, filteredIds]);

  const healthSummary = useMemo(() => {
    const c: Record<string, number> = { healthy: 0, degraded: 0, down: 0, unknown: 0 };
    integrations.forEach((i) => { c[i.healthStatus] = (c[i.healthStatus] ?? 0) + 1; });
    return c;
  }, [integrations]);

  if (systems === undefined || integrations === undefined) {
    return <div className="p-6"><Skeleton className="h-[600px] w-full" /></div>;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 px-5 py-3 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2"><Globe className="h-5 w-5 text-primary" />Architecture Map</h1>
          <p className="text-xs text-muted-foreground">{systems.length} systems · {integrations.length} integrations · {allModules.length} modules · Click a node for details</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["healthy", "degraded", "down", "unknown"] as const).map((h) => {
            const hc = HEALTH_META[h];
            return (
              <button key={h} onClick={() => setFilterHealth(filterHealth === h ? "all" : h)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer border transition-all"
                style={{ background: filterHealth === h ? `${hc.color}22` : "transparent", borderColor: filterHealth === h ? hc.color : "#1e293b", color: hc.color }}>
                <span className="w-2 h-2 rounded-full" style={{ background: hc.color }} />{hc.label} {healthSummary[h] ?? 0}
              </button>
            );
          })}
          <div className="w-px h-5 bg-border" />
          {(["all", "core", "supporting", "legacy", "pilot"] as const).map((t) => (
            <button key={t} onClick={() => setFilterType(t)} className="px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer border capitalize transition-all"
              style={{ background: filterType === t ? "#6366f133" : "transparent", borderColor: filterType === t ? "#6366f1" : "#1e293b", color: filterType === t ? "#c7d2fe" : "#64748b" }}>
              {t === "all" ? "All Types" : t}
            </button>
          ))}
          {selectedId && (
            <button onClick={() => setSelectedId(null)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border border-border text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="shrink-0 px-5 py-1.5 border-b border-border flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground bg-muted/20">
        <span className="font-semibold text-foreground">Edge:</span>
        {(Object.entries(HEALTH_META) as [string, { color: string; label: string }][]).map(([, v]) => (
          <span key={v.label} className="flex items-center gap-1"><span className="inline-block w-5 h-0.5 rounded" style={{ background: v.color }} />{v.label}</span>
        ))}
        <span className="flex items-center gap-1"><span className="inline-block w-5 border-t-2 border-dashed border-orange-400" /> Non-compliant</span>
        <span className="flex items-center gap-1"><RefreshCw className="h-2.5 w-2.5 text-indigo-400" /> Realtime</span>
        <span className="font-semibold text-foreground ml-2">Module icons:</span>
        {(Object.entries(LIFECYCLE_META) as [string, (typeof LIFECYCLE_META)[keyof typeof LIFECYCLE_META]][]).map(([, lm]) => {
          const Icon = lm.Icon;
          return <span key={lm.label} className="flex items-center gap-1" style={{ color: lm.color }}><Icon className="h-2.5 w-2.5" />{lm.label}</span>;
        })}
      </div>

      {/* Canvas + Panel */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden" style={{ background: "#060d1f" }}>
          {systems.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2"><Server className="h-12 w-12 mx-auto opacity-20" /><p className="font-medium">No systems to display</p></div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes} edges={edges} nodeTypes={nodeTypes}
              fitView fitViewOptions={{ padding: 0.15 }}
              attributionPosition="bottom-right" proOptions={{ hideAttribution: true }}
              onNodeClick={(_evt, node) => {
                setSelectedId(node.id as Id<"software_systems">);
              }}
              onPaneClick={() => setSelectedId(null)}
            >
              <Background color="#1e293b" gap={28} size={1} />
              <Controls style={{ background: "#0f172a", border: "1px solid #1e293b" }} />
              <MiniMap
                nodeColor={(node) => TYPE_META[systems.find((s) => s._id === node.id)?.type ?? "core"]?.badge ?? "#6366f1"}
                style={{ background: "#0a1628", border: "1px solid #1e293b" }}
                maskColor="#06101e99"
              />
            </ReactFlow>
          )}
        </div>
        {selectedSystem && (
          <DetailPanel
            system={selectedSystem} integrations={integrations}
            systems={systems} modules={selectedModules}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
}

export default function ArchitecturePage() {
  return <Authenticated><ArchitectureContent /></Authenticated>;
}
