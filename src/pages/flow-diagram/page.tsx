import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import SystemFlowSVG from "./_components/SystemFlowSVG.tsx";
import GanttChart from "./_components/GanttChart.tsx";
import { Activity, GitBranch, CheckCircle, AlertTriangle, XCircle, HelpCircle, Layers } from "lucide-react";

const HEALTH_CONFIG = {
  healthy:  { label: "Healthy",  icon: CheckCircle,    color: "text-green-400",  bg: "bg-green-400/10",  dot: "#22c55e" },
  degraded: { label: "Degraded", icon: AlertTriangle,  color: "text-yellow-400", bg: "bg-yellow-400/10", dot: "#f59e0b" },
  down:     { label: "Down",     icon: XCircle,        color: "text-red-400",    bg: "bg-red-400/10",    dot: "#ef4444" },
  unknown:  { label: "Unknown",  icon: HelpCircle,     color: "text-gray-400",   bg: "bg-gray-400/10",   dot: "#6b7280" },
} as const;

function FlowDiagramContent() {
  const systems = useQuery(api.software_systems.list) ?? [];
  const integrations = useQuery(api.integrations.list) ?? [];
  const roadmapItems = useQuery(api.roadmap.list) ?? [];

  const [selectedId, setSelectedId] = useState<Id<"software_systems"> | null>(null);
  const [activeTab, setActiveTab] = useState<"flow" | "gantt">("flow");

  const selectedSystem = useMemo(() => systems.find((s) => s._id === selectedId), [systems, selectedId]);

  const connectedIntegrations = useMemo(() => {
    if (!selectedId) return [];
    return integrations.filter(
      (i) => i.sourceSystemId === selectedId || i.destinationSystemId === selectedId
    );
  }, [selectedId, integrations]);

  const healthCounts = useMemo(() => {
    const counts: Record<string, number> = { healthy: 0, degraded: 0, down: 0, unknown: 0 };
    integrations.forEach((i) => { counts[i.healthStatus] = (counts[i.healthStatus] ?? 0) + 1; });
    return counts;
  }, [integrations]);

  const isLoading = systems === undefined || integrations === undefined;

  if (isLoading) {
    return <div className="p-6"><Skeleton className="h-[600px] w-full" /></div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            System Flow Diagram
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Visualize integration flows, health status, and project timeline
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-muted rounded-lg p-1 gap-1">
          <button
            onClick={() => setActiveTab("flow")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "flow" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" />
            Integration Flow
          </button>
          <button
            onClick={() => setActiveTab("gantt")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "gantt" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Gantt Timeline
          </button>
        </div>
      </div>

      {activeTab === "flow" ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Main SVG canvas */}
          <div className="flex-1 p-4 overflow-hidden flex flex-col gap-3">
            {/* Health status bar */}
            <div className="flex flex-wrap gap-2 shrink-0">
              {(Object.entries(HEALTH_CONFIG) as [string, typeof HEALTH_CONFIG[keyof typeof HEALTH_CONFIG]][]).map(([key, cfg]) => {
                const Icon = cfg.icon;
                const count = healthCounts[key] ?? 0;
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
              <span className="border-l border-border pl-4">Dashed = non-compliant · Animated = realtime</span>
            </div>

            {/* SVG Canvas */}
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

          {/* Side panel — selected system details */}
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

                {/* Status badges */}
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

                {/* Scores */}
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Architecture Score</span>
                      <span className="font-mono text-green-400">{selectedSystem.architectureScore}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${selectedSystem.architectureScore}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Tech Debt</span>
                      <span className="font-mono text-red-400">{selectedSystem.technicalDebtScore}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${selectedSystem.technicalDebtScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Connected integrations */}
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
                        const hcfg = HEALTH_CONFIG[intg.healthStatus];
                        return (
                          <div key={intg._id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-xs">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: hcfg?.dot ?? "#6b7280" }}
                            />
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
      ) : (
        /* Gantt tab */
        <div className="flex-1 overflow-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-sm">Roadmap Timeline</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {roadmapItems.length} items · Gantt view by scheduled dates
              </p>
            </div>
            {/* Status legend */}
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
    </div>
  );
}

export default function FlowDiagramPage() {
  return <Authenticated><FlowDiagramContent /></Authenticated>;
}
