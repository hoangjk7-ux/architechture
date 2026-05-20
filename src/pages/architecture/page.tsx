import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user.ts";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Node,
  type Edge,
  type EdgeProps,
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
  Plus, Edit, Trash2,
  Map, GitBranch, Activity, Users,
  CheckCircle, AlertTriangle, XCircle, HelpCircle,
} from "lucide-react";
import SystemFlowSVG from "../flow-diagram/_components/SystemFlowSVG.tsx";
import GanttChart from "../flow-diagram/_components/GanttChart.tsx";

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

const HEALTH_CONFIG = {
  healthy:  { label: "Healthy",  icon: CheckCircle,    color: "text-green-400",  bg: "bg-green-400/10",  dot: "#22c55e" },
  degraded: { label: "Degraded", icon: AlertTriangle,  color: "text-yellow-400", bg: "bg-yellow-400/10", dot: "#f59e0b" },
  down:     { label: "Down",     icon: XCircle,        color: "text-red-400",    bg: "bg-red-400/10",    dot: "#ef4444" },
  unknown:  { label: "Unknown",  icon: HelpCircle,     color: "text-gray-400",   bg: "bg-gray-400/10",   dot: "#6b7280" },
} as const;

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

// ─── Glow Edge ────────────────────────────────────────────────────────────────
function GlowEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  style, markerEnd, label, data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });
  const strokeColor = (style?.stroke as string) ?? "#6b7280";
  const strokeWidth = Number(style?.strokeWidth ?? 1.5);
  const edgeOpacity = Number(style?.opacity ?? 1);

  return (
    <>
      {data?.isHighCritical && (
        <path d={edgePath} fill="none" stroke={strokeColor} strokeWidth={strokeWidth + 6} opacity={edgeOpacity * 0.12} />
      )}
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: "#0f172a",
              color: strokeColor,
              fontSize: 8,
              fontWeight: 500,
              borderRadius: 4,
              padding: "2px 5px",
              opacity: edgeOpacity > 0.5 ? 0.85 : 0.25,
              pointerEvents: "none",
            }}
          >
            {label as string}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
const edgeTypes = { glow: GlowEdge };

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

// ─── Module Form ─────────────────────────────────────────────────────────────
type ModuleFormData = {
  name: string; lifecycle: SystemModule["lifecycle"]; health: SystemModule["health"];
  version: string; description: string; notes: string; plannedDate: string; usedBy: string;
};
const defaultModuleForm: ModuleFormData = {
  name: "", lifecycle: "in_use", health: "healthy",
  version: "", description: "", notes: "", plannedDate: "", usedBy: "",
};

function ModuleForm({ initial, onSave, onClose }: {
  initial?: Partial<ModuleFormData>;
  onSave: (d: ModuleFormData) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ModuleFormData>(() => {
    const src = (initial ?? {}) as Record<string, unknown>;
    return Object.keys(defaultModuleForm).reduce<ModuleFormData>(
      (acc, k) => ({ ...acc, [k]: k in src ? src[k] : defaultModuleForm[k as keyof ModuleFormData] }),
      { ...defaultModuleForm }
    );
  });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof ModuleFormData>(k: K, v: ModuleFormData[K]) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try { await onSave(form); onClose(); } catch (err: unknown) { toast.error((err as { data?: { message?: string } })?.data?.message ?? (err instanceof Error ? err.message : "Failed to save")); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Name *</Label>
        <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Student Portal" className="bg-input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Lifecycle</Label>
          <Select value={form.lifecycle} onValueChange={(v) => set("lifecycle", v as ModuleFormData["lifecycle"])}>
            <SelectTrigger className="bg-input"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(LIFECYCLE_META) as (keyof typeof LIFECYCLE_META)[]).map((lc) => (
                <SelectItem key={lc} value={lc}>{LIFECYCLE_META[lc].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Health</Label>
          <Select value={form.health} onValueChange={(v) => set("health", v as ModuleFormData["health"])}>
            <SelectTrigger className="bg-input"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(HEALTH_META) as (keyof typeof HEALTH_META)[]).map((h) => (
                <SelectItem key={h} value={h} className="capitalize">{HEALTH_META[h].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Version</Label>
          <Input value={form.version} onChange={(e) => set("version", e.target.value)} placeholder="e.g. 2.1.0" className="bg-input" />
        </div>
        <div className="space-y-1">
          <Label>Target Date</Label>
          <Input type="date" value={form.plannedDate} onChange={(e) => set("plannedDate", e.target.value)} className="bg-input" />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Used By <span className="text-muted-foreground text-[10px]">(comma separated)</span></Label>
        <Input value={form.usedBy} onChange={(e) => set("usedBy", e.target.value)} placeholder="e.g. Admissions, Finance" className="bg-input" />
      </div>
      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className="bg-input" />
      </div>
      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="bg-input" />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Module"}</Button>
      </div>
    </div>
  );
}

// ─── Module section ───────────────────────────────────────────────────────────
function ModuleRow({ mod, canWrite, onEdit, onDelete }: {
  mod: SystemModule; canWrite: boolean;
  onEdit: (m: SystemModule) => void; onDelete: (id: SystemModule["_id"]) => void;
}) {
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
        {(mod.lifecycle === "in_use" || mod.lifecycle === "deprecated") && (
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: hm.color }} />
        )}
        {mod.plannedDate && mod.lifecycle !== "in_use" && (
          <span className="text-[9px] shrink-0" style={{ color: lm.color }}>{mod.plannedDate.slice(0, 7)}</span>
        )}
        {canWrite && (
          <div className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => onEdit(mod)} className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors cursor-pointer">
              <Edit className="h-3 w-3" />
            </button>
            <button onClick={() => onDelete(mod._id)} className="p-1 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors cursor-pointer">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
        <span className="text-muted-foreground text-xs ml-0.5">{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t" style={{ borderColor: lm.color + "33" }}>
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

function ModulesTab({ modules, canWrite, onAdd, onEdit, onDelete }: {
  modules: SystemModule[]; canWrite: boolean;
  onAdd: () => void; onEdit: (m: SystemModule) => void; onDelete: (id: SystemModule["_id"]) => void;
}) {
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
        {canWrite && (
          <Button size="sm" variant="ghost" onClick={onAdd} className="gap-1.5 mt-1">
            <Plus className="h-3.5 w-3.5" />Add Module
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {canWrite && (
        <Button size="sm" variant="outline" onClick={onAdd} className="gap-1.5 w-full">
          <Plus className="h-3.5 w-3.5" />Add Module
        </Button>
      )}
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
      <div className="space-y-1.5">
        {filtered.map((mod) => <ModuleRow key={mod._id} mod={mod} canWrite={canWrite} onEdit={onEdit} onDelete={onDelete} />)}
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
  const { canWrite } = useCurrentUser();
  const createModule = useMutation(api.system_modules.create);
  const updateModule = useMutation(api.system_modules.update);
  const removeModule = useMutation(api.system_modules.remove);

  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState<SystemModule | null>(null);

  const meta = TYPE_META[system.type] ?? TYPE_META.core;
  const outbound = integrations.filter((i) => i.sourceSystemId === system._id);
  const inbound = integrations.filter((i) => i.destinationSystemId === system._id);
  const [activeTab, setActiveTab] = useState<PanelTab>("modules");

  const handleCreateModule = async (data: ModuleFormData) => {
    await createModule({
      systemId: system._id,
      name: data.name,
      lifecycle: data.lifecycle,
      health: data.health,
      version: data.version || undefined,
      description: data.description || undefined,
      notes: data.notes || undefined,
      plannedDate: data.plannedDate || undefined,
      usedBy: data.usedBy ? data.usedBy.split(",").map((s) => s.trim()).filter(Boolean) : [],
      sortOrder: modules.length,
    });
    toast.success("Module added");
  };

  const handleUpdateModule = async (data: ModuleFormData) => {
    if (!editingModule) return;
    await updateModule({
      id: editingModule._id,
      name: data.name,
      lifecycle: data.lifecycle,
      health: data.health,
      version: data.version || undefined,
      description: data.description || undefined,
      notes: data.notes || undefined,
      plannedDate: data.plannedDate || undefined,
      usedBy: data.usedBy ? data.usedBy.split(",").map((s) => s.trim()).filter(Boolean) : [],
    });
    toast.success("Module updated");
  };

  const handleDeleteModule = async (id: SystemModule["_id"]) => {
    await removeModule({ id });
    toast.success("Module deleted");
  };

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

      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === "modules" && (
          <ModulesTab
            modules={modules} canWrite={canWrite}
            onAdd={() => setShowModuleForm(true)}
            onEdit={(m) => setEditingModule(m)}
            onDelete={handleDeleteModule}
          />
        )}

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
              {system.costPerYear && <div className="flex justify-between"><span className="text-muted-foreground">Chi phí / Năm</span><span className="font-medium">{system.costPerYear.toLocaleString("vi-VN")} ₫</span></div>}
              {system.contractEndDate && <div className="flex justify-between"><span className="text-muted-foreground">Contract Ends</span><span className="font-medium">{system.contractEndDate}</span></div>}
              {system.departments.length > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Departments</span><span className="font-medium text-right max-w-[55%]">{system.departments.join(", ")}</span></div>}
              {system.campuses.length > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Campuses</span><span className="font-medium text-right max-w-[55%]">{system.campuses.join(", ")}</span></div>}
              {system.description && <p className="text-muted-foreground leading-relaxed pt-1">{system.description}</p>}
            </div>
          </div>
        )}
      </div>

      <Dialog open={showModuleForm} onOpenChange={setShowModuleForm}>
        <DialogContent><DialogHeader><DialogTitle>Add Module</DialogTitle></DialogHeader>
          <ModuleForm onSave={handleCreateModule} onClose={() => setShowModuleForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingModule} onOpenChange={(open) => !open && setEditingModule(null)}>
        <DialogContent><DialogHeader><DialogTitle>Edit Module</DialogTitle></DialogHeader>
          {editingModule && (
            <ModuleForm
              initial={{
                name: editingModule.name, lifecycle: editingModule.lifecycle, health: editingModule.health,
                version: editingModule.version ?? "", description: editingModule.description ?? "",
                notes: editingModule.notes ?? "", plannedDate: editingModule.plannedDate ?? "",
                usedBy: editingModule.usedBy.join(", "),
              }}
              onSave={handleUpdateModule}
              onClose={() => setEditingModule(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Phòng Ban ───────────────────────────────────────────────────────────────
type ConfigResult = { department: { name: string; color?: string; order: number }[] } | undefined | null;

function DeptSummaryCard({ name, color, systems, integrations, onClick }: {
  name: string; color: string; systems: System[]; integrations: Integration[]; onClick: () => void;
}) {
  const typeCounts: Record<string, number> = {};
  systems.forEach((s) => { typeCounts[s.type] = (typeCounts[s.type] ?? 0) + 1; });

  const healthCounts: Record<string, number> = { healthy: 0, degraded: 0, down: 0, unknown: 0 };
  systems.forEach((s) => { const h = worstHealthFor(s._id, integrations); healthCounts[h] = (healthCounts[h] ?? 0) + 1; });

  const totalCost = systems.reduce((sum, s) => sum + (s.costPerYear ?? 0), 0);
  const criticalCount = systems.filter((s) => s.criticality === "high").length;

  return (
    <button
      onClick={onClick}
      className="text-left rounded-xl border p-4 hover:bg-muted/20 transition-all cursor-pointer w-full"
      style={{ borderColor: color + "55", background: color + "08" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
        <span className="font-semibold text-sm flex-1 truncate">{name}</span>
        <span className="text-[10px] font-mono text-muted-foreground shrink-0">{systems.length} hệ thống</span>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {(Object.entries(typeCounts) as [string, number][]).map(([type, count]) => {
          const m = TYPE_META[type] ?? TYPE_META.core;
          return (
            <span key={type} className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: m.badge + "22", color: m.badge }}>
              {m.label} {count}
            </span>
          );
        })}
        {criticalCount > 0 && (
          <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-red-500/15 text-red-400">🔴 Critical {criticalCount}</span>
        )}
      </div>

      <div className="flex items-center gap-3 mb-3">
        {(Object.entries(healthCounts) as [string, number][]).filter(([, c]) => c > 0).map(([h, c]) => {
          const hm = HEALTH_META[h] ?? HEALTH_META.unknown;
          return (
            <div key={h} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: hm.color }} />
              <span className="text-[10px]" style={{ color: hm.color }}>{c}</span>
            </div>
          );
        })}
      </div>

      {totalCost > 0 && (
        <div className="text-[10px] text-green-400 font-mono border-t pt-2" style={{ borderColor: color + "33" }}>
          {totalCost.toLocaleString("vi-VN")} ₫/năm
        </div>
      )}
    </button>
  );
}

function DeptView({ systems, integrations, config }: {
  systems: System[]; integrations: Integration[]; config: ConfigResult;
}) {
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const departments = config?.department ?? [];

  const byDept = useMemo(() => {
    const map: Record<string, System[]> = {};
    for (const sys of systems) {
      const depts = sys.departments.length > 0 ? sys.departments : ["__none__"];
      for (const d of depts) { (map[d] ??= []).push(sys); }
    }
    return map;
  }, [systems]);

  const noDepSystems = byDept["__none__"] ?? [];

  const deptColor = (name: string) =>
    departments.find((d) => d.name === name)?.color ?? "#6366f1";

  const activeSystems = selectedDept === "__none__"
    ? noDepSystems
    : selectedDept
      ? (byDept[selectedDept] ?? [])
      : systems;

  // Stats for selected dept
  const totalCost = activeSystems.reduce((sum, s) => sum + (s.costPerYear ?? 0), 0);
  const criticalCount = activeSystems.filter((s) => s.criticality === "high").length;
  const healthCounts = activeSystems.reduce<Record<string, number>>((acc, s) => {
    const h = worstHealthFor(s._id, integrations);
    acc[h] = (acc[h] ?? 0) + 1;
    return acc;
  }, { healthy: 0, degraded: 0, down: 0, unknown: 0 });

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Sidebar ── */}
      <div className="w-52 shrink-0 border-r border-border overflow-y-auto py-3 px-2 space-y-0.5 bg-muted/10">
        <button
          onClick={() => setSelectedDept(null)}
          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
            selectedDept === null ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <span>Tất cả phòng ban</span>
          <span className="font-mono text-[10px]">{systems.length}</span>
        </button>

        <div className="px-3 pt-2 pb-1">
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Phòng ban</div>
        </div>

        {departments.map((dept) => {
          const count = (byDept[dept.name] ?? []).length;
          const color = dept.color ?? "#6366f1";
          return (
            <button
              key={dept.name}
              onClick={() => setSelectedDept(dept.name)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 cursor-pointer ${
                selectedDept === dept.name ? "font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              style={selectedDept === dept.name ? { background: color + "18", color } : {}}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              <span className="flex-1 truncate">{dept.name}</span>
              <span className="font-mono text-[10px] shrink-0">{count}</span>
            </button>
          );
        })}

        {noDepSystems.length > 0 && (
          <>
            <div className="px-3 pt-2 pb-1">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Khác</div>
            </div>
            <button
              onClick={() => setSelectedDept("__none__")}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 cursor-pointer ${
                selectedDept === "__none__" ? "bg-muted text-foreground font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
              <span className="flex-1">Chưa phân loại</span>
              <span className="font-mono text-[10px]">{noDepSystems.length}</span>
            </button>
          </>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Stats bar */}
        <div className="shrink-0 px-5 py-2.5 border-b border-border bg-muted/10 flex flex-wrap items-center gap-4 text-[10px]">
          <span className="font-semibold text-foreground">
            {selectedDept === null ? "Tất cả phòng ban" : selectedDept === "__none__" ? "Chưa phân loại" : selectedDept}
          </span>
          <span className="text-muted-foreground">{activeSystems.length} hệ thống</span>
          {criticalCount > 0 && <span className="text-red-400 font-medium">🔴 {criticalCount} critical</span>}
          {(Object.entries(healthCounts) as [string, number][]).filter(([, c]) => c > 0).map(([h, c]) => {
            const hm = HEALTH_META[h] ?? HEALTH_META.unknown;
            return (
              <span key={h} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: hm.color }} />
                <span style={{ color: hm.color }}>{hm.label} {c}</span>
              </span>
            );
          })}
          {totalCost > 0 && (
            <span className="ml-auto text-green-400 font-mono">{totalCost.toLocaleString("vi-VN")} ₫/năm</span>
          )}
        </div>

        {/* Overview grid (all depts) */}
        {selectedDept === null && (
          <div className="flex-1 overflow-y-auto p-5">
            {departments.length === 0 && noDepSystems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <Users className="h-10 w-10 opacity-20" />
                <p className="text-sm">Chưa có dữ liệu phòng ban</p>
                <p className="text-xs">Thêm phòng ban trong trang Cấu hình</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {departments.map((dept) => (
                  <DeptSummaryCard
                    key={dept.name}
                    name={dept.name}
                    color={dept.color ?? "#6366f1"}
                    systems={byDept[dept.name] ?? []}
                    integrations={integrations}
                    onClick={() => setSelectedDept(dept.name)}
                  />
                ))}
                {noDepSystems.length > 0 && (
                  <DeptSummaryCard
                    name="Chưa phân loại"
                    color="#64748b"
                    systems={noDepSystems}
                    integrations={integrations}
                    onClick={() => setSelectedDept("__none__")}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* System list for selected dept */}
        {selectedDept !== null && (
          <div className="flex-1 overflow-y-auto">
            {activeSystems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <Server className="h-8 w-8 opacity-20" />
                <p className="text-sm">Không có hệ thống nào trong phòng ban này</p>
              </div>
            ) : (
              <>
                {/* Table header */}
                <div className="sticky top-0 z-10 grid grid-cols-[1fr_120px_90px_90px_80px_100px_110px] gap-3 px-5 py-2 border-b border-border bg-muted/30 text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                  <span>Hệ thống</span>
                  <span>Loại · Trạng thái</span>
                  <span>Sức khỏe</span>
                  <span>Arch Score</span>
                  <span className="text-center">Tích hợp</span>
                  <span className="text-right">Chi phí / Năm</span>
                  <span>Người quản lý</span>
                </div>
                {activeSystems.map((sys) => {
                  const meta = TYPE_META[sys.type] ?? TYPE_META.core;
                  const statusMeta = STATUS_META[sys.status] ?? STATUS_META.inactive;
                  const worst = worstHealthFor(sys._id, integrations);
                  const hm = HEALTH_META[worst] ?? HEALTH_META.unknown;
                  const outCount = integrations.filter((i) => i.sourceSystemId === sys._id).length;
                  const inCount = integrations.filter((i) => i.destinationSystemId === sys._id).length;
                  return (
                    <div
                      key={sys._id}
                      className="grid grid-cols-[1fr_120px_90px_90px_80px_100px_110px] gap-3 px-5 py-3 border-b border-border hover:bg-muted/20 transition-colors items-center"
                    >
                      {/* Name + category */}
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{sys.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {sys.category}{sys.technology ? ` · ${sys.technology}` : ""}
                        </div>
                      </div>

                      {/* Type + status */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-medium w-fit" style={{ background: meta.badge + "22", color: meta.badge }}>{meta.label}</span>
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: statusMeta.color }}>
                          {statusMeta.icon} <span className="capitalize">{sys.status}</span>
                        </span>
                      </div>

                      {/* Health */}
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: hm.color }} />
                        <span className="text-[10px]" style={{ color: hm.color }}>{hm.label}</span>
                      </div>

                      {/* Arch score */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[9px] text-muted-foreground">
                          <span>Arch</span>
                          <span style={{ color: sys.architectureScore >= 70 ? "#22c55e" : sys.architectureScore >= 50 ? "#f59e0b" : "#ef4444" }}>
                            {sys.architectureScore}
                          </span>
                        </div>
                        <ScoreBar value={sys.architectureScore} color={sys.architectureScore >= 70 ? "#22c55e" : sys.architectureScore >= 50 ? "#f59e0b" : "#ef4444"} />
                        <div className="flex justify-between text-[9px] text-muted-foreground">
                          <span>Debt</span>
                          <span style={{ color: sys.technicalDebtScore > 60 ? "#ef4444" : sys.technicalDebtScore > 30 ? "#f59e0b" : "#22c55e" }}>
                            {sys.technicalDebtScore}
                          </span>
                        </div>
                        <ScoreBar value={sys.technicalDebtScore} color={sys.technicalDebtScore > 60 ? "#ef4444" : sys.technicalDebtScore > 30 ? "#f59e0b" : "#22c55e"} />
                      </div>

                      {/* Integrations */}
                      <div className="text-[10px] text-muted-foreground text-center">
                        <div>↑ {outCount}</div>
                        <div>↓ {inCount}</div>
                      </div>

                      {/* Cost */}
                      <div className="text-[10px] text-green-400 font-mono text-right">
                        {sys.costPerYear ? `${sys.costPerYear.toLocaleString("vi-VN")} ₫` : "—"}
                      </div>

                      {/* Owner */}
                      <div className="text-[10px] text-muted-foreground truncate">
                        {sys.owner ?? "—"}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
type ViewTab = "map" | "flow" | "gantt" | "dept";

function ArchitectureContent() {
  const rawSystems      = useQuery(api.software_systems.list);
  const rawIntegrations = useQuery(api.integrations.list);
  const rawModules      = useQuery(api.system_modules.list);
  const roadmapItems    = useQuery(api.roadmap.list) ?? [];
  const config          = useQuery(api.config.listAll);
  const systems         = rawSystems ?? [];
  const integrations    = rawIntegrations ?? [];
  const allModules      = rawModules ?? [];

  const [viewTab,      setViewTab]      = useState<ViewTab>("map");
  const [selectedId,   setSelectedId]   = useState<Id<"software_systems"> | null>(null);
  const [filterType,   setFilterType]   = useState<string>("all");
  const [filterHealth, setFilterHealth] = useState<string>("all");

  const selectedSystem  = useMemo(() => systems.find((s) => s._id === selectedId) ?? null, [systems, selectedId]);
  const selectedModules = useMemo(() => allModules.filter((m) => m.systemId === selectedId), [allModules, selectedId]);
  const positions       = useMemo(() => layoutNodes(systems), [systems]);

  const connectedIntegrations = useMemo(() => {
    if (!selectedId) return [];
    return integrations.filter((i) => i.sourceSystemId === selectedId || i.destinationSystemId === selectedId);
  }, [selectedId, integrations]);

  const filteredSystems = useMemo(() => systems.filter((s) => {
    if (filterType !== "all" && s.type !== filterType) return false;
    if (filterHealth !== "all" && worstHealthFor(s._id, integrations) !== filterHealth) return false;
    return true;
  }), [systems, integrations, filterType, filterHealth]);

  const filteredIds = useMemo(() => new Set(filteredSystems.map((s) => s._id)), [filteredSystems]);

  const connectedNodeIds = useMemo(() => {
    if (!selectedId) return null;
    const ids = new Set<string>([selectedId]);
    integrations.forEach((i) => {
      if (i.sourceSystemId === selectedId) ids.add(i.destinationSystemId);
      if (i.destinationSystemId === selectedId) ids.add(i.sourceSystemId);
    });
    return ids;
  }, [selectedId, integrations]);

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
    style: {
      opacity: selectedId
        ? (connectedNodeIds!.has(s._id) ? 1 : 0.2)
        : (filteredIds.has(s._id) ? 1 : 0.2),
    },
  })), [systems, integrations, positions, selectedId, filteredIds, connectedNodeIds]);

  const edges: Edge[] = useMemo(() => integrations.map((intg) => {
    const hc = HEALTH_META[intg.healthStatus] ?? HEALTH_META.unknown;
    const isFocused = selectedId === intg.sourceSystemId || selectedId === intg.destinationSystemId;
    const isFiltered = filteredIds.has(intg.sourceSystemId) && filteredIds.has(intg.destinationSystemId);
    return {
      id: intg._id,
      source: intg.sourceSystemId,
      target: intg.destinationSystemId,
      type: "glow",
      label: `${intg.protocol} · ${METHOD_META[intg.method]?.label ?? intg.method}${intg.errorRate ? ` · ${intg.errorRate}% err` : ""}`,
      data: { isHighCritical: intg.criticalLevel === "high" },
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

  const handleSetViewTab = (tab: ViewTab) => {
    setViewTab(tab);
    setSelectedId(null);
  };

  if (rawSystems === undefined || rawIntegrations === undefined) {
    return <div className="p-6"><Skeleton className="h-[600px] w-full" /></div>;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 px-5 py-3 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => handleSetViewTab("map")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              viewTab === "map" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Map className="h-3.5 w-3.5" />
            Architecture Map
          </button>
          <button
            onClick={() => handleSetViewTab("flow")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              viewTab === "flow" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" />
            Integration Flow
          </button>
          <button
            onClick={() => handleSetViewTab("gantt")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              viewTab === "gantt" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Gantt Timeline
          </button>
          <button
            onClick={() => handleSetViewTab("dept")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              viewTab === "dept" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Phòng Ban
          </button>
        </div>

        {/* Architecture Map filters */}
        {viewTab === "map" && (
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
        )}

        {/* Integration Flow stats */}
        {viewTab === "flow" && (
          <div className="flex flex-wrap gap-2">
            {(Object.entries(HEALTH_CONFIG) as [string, typeof HEALTH_CONFIG[keyof typeof HEALTH_CONFIG]][]).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const count = healthSummary[key] ?? 0;
              return (
                <div key={key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${cfg.bg} text-xs`}>
                  <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                  <span className={cfg.color}>{cfg.label}</span>
                  <span className="text-muted-foreground font-mono">{count}</span>
                </div>
              );
            })}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs text-muted-foreground">
              <GitBranch className="h-3.5 w-3.5" />
              {integrations.length} integrations · {systems.length} systems
            </div>
          </div>
        )}
      </div>

      {/* ── Architecture Map View ── */}
      {viewTab === "map" && (
        <>
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

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-hidden" style={{ background: "#060d1f" }}>
              {systems.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center space-y-2"><Server className="h-12 w-12 mx-auto opacity-20" /><p className="font-medium">No systems to display</p></div>
                </div>
              ) : (
                <ReactFlow
                  nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
                  fitView fitViewOptions={{ padding: 0.15 }}
                  attributionPosition="bottom-right" proOptions={{ hideAttribution: true }}
                  onNodeClick={(_evt, node) => { setSelectedId(node.id as Id<"software_systems">); }}
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
            <div
              className={`shrink-0 transition-all duration-300 overflow-hidden ${
                selectedSystem ? "w-[340px]" : "w-0"
              }`}
            >
              {selectedSystem && (
                <DetailPanel
                  key={selectedSystem._id}
                  system={selectedSystem} integrations={integrations}
                  systems={systems} modules={selectedModules}
                  onClose={() => setSelectedId(null)}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Integration Flow View ── */}
      {viewTab === "flow" && (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 p-4 overflow-hidden flex flex-col gap-3">
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground shrink-0">
              <span className="font-medium text-foreground">System type:</span>
              {[
                { label: "Core", color: "#6366f1" },
                { label: "Supporting", color: "#22c55e" },
                { label: "Legacy", color: "#f59e0b" },
                { label: "Pilot", color: "#3b82f6" },
              ].map((t) => (
                <span key={t.label} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: t.color }} />
                  {t.label}
                </span>
              ))}
              <span className="border-l border-border pl-4">Edge health:</span>
              {Object.entries(HEALTH_CONFIG).map(([, cfg]) => (
                <span key={cfg.label} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: cfg.dot }} />
                  {cfg.label}
                </span>
              ))}
              <span className="border-l border-border pl-4">굵기 = mức độ quan trọng · Mũi tên = hướng luồng</span>
            </div>

            {systems.length === 0 ? (
              <div className="flex-1 flex items-center justify-center bg-[#050d1a] rounded-lg border border-border text-muted-foreground">
                <div className="text-center space-y-2">
                  <GitBranch className="h-10 w-10 mx-auto opacity-30" />
                  <p className="text-sm font-medium">No systems to display</p>
                  <p className="text-xs">Add systems in System Inventory first</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-[400px]">
                <SystemFlowSVG
                  systems={systems}
                  integrations={integrations}
                  selectedId={selectedId}
                  onSelectSystem={setSelectedId}
                />
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center shrink-0">
              Click a system to highlight connections · Scroll to zoom · Drag to pan
            </p>
          </div>

          {/* Side panel */}
          <div
            className={`shrink-0 border-l border-border overflow-y-auto transition-all duration-300 ${
              selectedSystem ? "w-72 p-4" : "w-0 p-0 overflow-hidden"
            }`}
          >
            {selectedSystem && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-bold text-sm">{selectedSystem.name}</h2>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">
                      {selectedSystem.category} · {selectedSystem.type}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="text-muted-foreground hover:text-foreground text-lg leading-none cursor-pointer"
                  >
                    ×
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${
                    selectedSystem.status === "active" ? "bg-green-500/20 text-green-400" :
                    selectedSystem.status === "sunset" ? "bg-red-500/20 text-red-400" :
                    "bg-yellow-500/20 text-yellow-400"
                  }`}>{selectedSystem.status}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${
                    selectedSystem.criticality === "high" ? "bg-red-500/20 text-red-400" :
                    selectedSystem.criticality === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-gray-500/20 text-gray-400"
                  }`}>{selectedSystem.criticality} criticality</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    selectedSystem.riskLevel === "high" ? "bg-red-500/20 text-red-400" :
                    selectedSystem.riskLevel === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-gray-500/20 text-gray-400"
                  }`}>Risk: {selectedSystem.riskLevel}</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Architecture Score</span>
                      <span className="font-mono text-green-400">{selectedSystem.architectureScore}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${selectedSystem.architectureScore}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Tech Debt</span>
                      <span className="font-mono text-red-400">{selectedSystem.technicalDebtScore}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${selectedSystem.technicalDebtScore}%` }} />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                    Connections ({connectedIntegrations.length})
                  </h3>
                  <div className="space-y-1.5">
                    {connectedIntegrations.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No integrations</p>
                    ) : (
                      connectedIntegrations.map((intg) => {
                        const isSrc = intg.sourceSystemId === selectedId;
                        const otherId = isSrc ? intg.destinationSystemId : intg.sourceSystemId;
                        const otherSys = systems.find((s) => s._id === otherId);
                        const hcfg = HEALTH_CONFIG[intg.healthStatus as keyof typeof HEALTH_CONFIG];
                        return (
                          <div key={intg._id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-xs">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: hcfg?.dot ?? "#6b7280" }} />
                            <span className="text-muted-foreground">{isSrc ? "→" : "←"}</span>
                            <span className="font-medium truncate flex-1">{otherSys?.name ?? "Unknown"}</span>
                            <span className="text-[10px] text-muted-foreground font-mono shrink-0">{intg.protocol}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {selectedSystem.description && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Description</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{selectedSystem.description}</p>
                  </div>
                )}

                {selectedSystem.technology && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Tech</span>
                      <p className="font-medium mt-0.5">{selectedSystem.technology}</p>
                    </div>
                    {selectedSystem.hosting && (
                      <div>
                        <span className="text-muted-foreground">Hosting</span>
                        <p className="font-medium mt-0.5">{selectedSystem.hosting}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Gantt Timeline View ── */}
      {viewTab === "gantt" && (
        <div className="flex-1 overflow-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-sm">Roadmap Timeline</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {roadmapItems.length} items · Gantt view by scheduled dates
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              {[
                { label: "Not Started", color: "#334155" },
                { label: "In Progress", color: "#3b82f6" },
                { label: "Blocked",     color: "#ef4444" },
                { label: "Done",        color: "#22c55e" },
                { label: "Cancelled",   color: "#475569" },
              ].map((s) => (
                <span key={s.label} className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ background: s.color }} />
                  {s.label}
                </span>
              ))}
              <span className="flex items-center gap-1 text-yellow-400">
                <span className="inline-block border-l-2 border-dashed border-yellow-400 h-3" />
                Today
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <GanttChart items={roadmapItems} />
          </div>
        </div>
      )}

      {/* ── Phòng Ban View ── */}
      {viewTab === "dept" && (
        <DeptView systems={systems} integrations={integrations} config={config} />
      )}
    </div>
  );
}

export default function ArchitecturePage() {
  return <Authenticated><ArchitectureContent /></Authenticated>;
}
