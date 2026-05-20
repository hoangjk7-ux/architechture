import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated } from "convex/react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { toast } from "sonner";
import { Plus, GitBranch, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user.ts";
import { cn } from "@/lib/utils.ts";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

type HealthStatus = "healthy" | "degraded" | "down" | "unknown";
type IntegrationProtocol = "REST" | "GraphQL" | "SOAP" | "Webhook" | "DB" | "ETL" | "Queue" | "Other";
type IntegrationMethod = "realtime" | "batch" | "event_driven" | "manual";
type IntegrationCritical = "high" | "medium" | "low";

const healthConfig: Record<HealthStatus, { color: string; dot: string; label: string }> = {
  healthy: { color: "text-green-400", dot: "bg-green-400", label: "Healthy" },
  degraded: { color: "text-yellow-400", dot: "bg-yellow-400", label: "Degraded" },
  down: { color: "text-red-400", dot: "bg-red-400", label: "Down" },
  unknown: { color: "text-gray-400", dot: "bg-gray-400", label: "Unknown" },
};

type IntegrationFormData = {
  name: string;
  sourceSystemId: Id<"software_systems">;
  destinationSystemId: Id<"software_systems">;
  protocol: IntegrationProtocol;
  method: IntegrationMethod;
  healthStatus: HealthStatus;
  criticalLevel: IntegrationCritical;
  owner: string;
  errorRate: number | undefined;
  lastSync: string;
  description: string;
  isArchitectureCompliant: boolean;
};

const defaultForm: IntegrationFormData = {
  name: "",
  sourceSystemId: "" as Id<"software_systems">,
  destinationSystemId: "" as Id<"software_systems">,
  protocol: "REST",
  method: "realtime",
  healthStatus: "healthy",
  criticalLevel: "medium",
  owner: "",
  errorRate: undefined,
  lastSync: "",
  description: "",
  isArchitectureCompliant: true,
};

function IntegrationForm({ initial, onSave, onClose }: {
  initial?: Partial<IntegrationFormData> & { _id?: Id<"integrations"> };
  onSave: (data: IntegrationFormData) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, _creationTime, sourceSystem, destinationSystem, ...rest } = (initial ?? {}) as Record<string, unknown>;
    return { ...defaultForm, ...rest };
  });
  const [saving, setSaving] = useState(false);
  const systems = useQuery(api.software_systems.list) ?? [];

  const set = <K extends keyof typeof defaultForm>(k: K, v: (typeof defaultForm)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.sourceSystemId || !form.destinationSystemId) {
      toast.error("Name, source and destination are required"); return;
    }
    setSaving(true);
    try { await onSave(form); onClose(); } catch (err: unknown) { toast.error((err as { data?: { message?: string } })?.data?.message ?? (err instanceof Error ? err.message : "Failed to save")); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label>Integration Name *</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. CRM to ERP Sync" className="bg-input" />
        </div>
        <div className="space-y-1">
          <Label>Source System *</Label>
          <Select value={form.sourceSystemId} onValueChange={(v) => set("sourceSystemId", v as Id<"software_systems">)}>
            <SelectTrigger className="bg-input"><SelectValue placeholder="Select source" /></SelectTrigger>
            <SelectContent>
              {systems.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Destination System *</Label>
          <Select value={form.destinationSystemId} onValueChange={(v) => set("destinationSystemId", v as Id<"software_systems">)}>
            <SelectTrigger className="bg-input"><SelectValue placeholder="Select destination" /></SelectTrigger>
            <SelectContent>
              {systems.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Protocol</Label>
          <Select value={form.protocol} onValueChange={(v) => set("protocol", v as typeof form.protocol)}>
            <SelectTrigger className="bg-input"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["REST","GraphQL","SOAP","Webhook","DB","ETL","Queue","Other"].map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Method</Label>
          <Select value={form.method} onValueChange={(v) => set("method", v as typeof form.method)}>
            <SelectTrigger className="bg-input"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="realtime">Realtime</SelectItem>
              <SelectItem value="batch">Batch</SelectItem>
              <SelectItem value="event_driven">Event Driven</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Health Status</Label>
          <Select value={form.healthStatus} onValueChange={(v) => set("healthStatus", v as typeof form.healthStatus)}>
            <SelectTrigger className="bg-input"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="degraded">Degraded</SelectItem>
              <SelectItem value="down">Down</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Critical Level</Label>
          <Select value={form.criticalLevel} onValueChange={(v) => set("criticalLevel", v as typeof form.criticalLevel)}>
            <SelectTrigger className="bg-input"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Owner</Label>
          <Input value={form.owner} onChange={(e) => set("owner", e.target.value)} placeholder="e.g. IT Team" className="bg-input" />
        </div>
        <div className="space-y-1">
          <Label>Error Rate (%)</Label>
          <Input type="number" min={0} max={100} value={form.errorRate ?? ""} onChange={(e) => set("errorRate", e.target.value ? Number(e.target.value) : undefined)} placeholder="0" className="bg-input" />
        </div>
        <div className="space-y-1">
          <Label>Last Sync</Label>
          <Input type="datetime-local" value={form.lastSync} onChange={(e) => set("lastSync", e.target.value)} className="bg-input" />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Architecture Compliant</Label>
          <div className="flex gap-3">
            {([true, false] as const).map((val) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => set("isArchitectureCompliant", val)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded border text-sm cursor-pointer transition-colors",
                  form.isArchitectureCompliant === val
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-accent border-border text-muted-foreground"
                )}
              >
                {val ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {val ? "Compliant" : "Non-Compliant"}
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe this integration..." className="bg-input" rows={2} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
      </div>
    </div>
  );
}

function IntegrationsContent() {
  const { canWrite } = useCurrentUser();
  const integrations = useQuery(api.integrations.list) ?? [];
  const stats = useQuery(api.integrations.getStats);
  const createIntegration = useMutation(api.integrations.create);
  const updateIntegration = useMutation(api.integrations.update);
  const removeIntegration = useMutation(api.integrations.remove);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<(typeof integrations)[0] | null>(null);

  const handleCreate = async (data: IntegrationFormData) => { await createIntegration(data); toast.success("Integration added"); };
  const handleUpdate = async (data: IntegrationFormData) => {
    if (!editing) return;
    await updateIntegration({ id: editing._id, ...data });
    toast.success("Updated"); setEditing(null);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Integration Governance</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{integrations.length} integrations tracked</p>
        </div>
        {canWrite && (
          <Button onClick={() => setShowForm(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />Add Integration
          </Button>
        )}
      </div>

      {/* Health Summary */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(["healthy","degraded","down"] as const).map((s) => {
            const cfg = healthConfig[s];
            return (
              <div key={s} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                <span className={cn("w-3 h-3 rounded-full", cfg.dot)} />
                <div>
                  <div className="text-lg font-bold">{stats[s]}</div>
                  <div className="text-xs text-muted-foreground">{cfg.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {integrations.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <GitBranch className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No integrations tracked yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Integration</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Source → Destination</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Protocol</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Health</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Compliance</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {integrations.map((i) => {
                const health = healthConfig[i.healthStatus];
                return (
                  <tr key={i._id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="p-3 font-medium">{i.name}</td>
                    <td className="p-3 text-xs">
                      <span className="text-blue-400">{i.sourceSystem?.name ?? "?"}</span>
                      <span className="text-muted-foreground mx-1">→</span>
                      <span className="text-purple-400">{i.destinationSystem?.name ?? "?"}</span>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <Badge variant="secondary" className="text-[10px]">{i.protocol}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("w-2 h-2 rounded-full", health.dot)} />
                        <span className={cn("text-xs", health.color)}>{health.label}</span>
                      </div>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      {i.isArchitectureCompliant
                        ? <span className="text-green-400 text-xs flex items-center gap-1"><CheckCircle className="h-3 w-3" />Compliant</span>
                        : <span className="text-red-400 text-xs flex items-center gap-1"><XCircle className="h-3 w-3" />Non-Compliant</span>
                      }
                    </td>
                    <td className="p-3 text-right">
                      {canWrite && (
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => setEditing(i)}><Edit className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer text-destructive hover:text-destructive" onClick={() => { removeIntegration({ id: i._id }); toast.success("Removed"); }}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl bg-card border-border">
          <DialogHeader><DialogTitle>Add Integration</DialogTitle></DialogHeader>
          <IntegrationForm onSave={handleCreate} onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-xl bg-card border-border">
          <DialogHeader><DialogTitle>Edit Integration</DialogTitle></DialogHeader>
          {editing && <IntegrationForm initial={editing} onSave={handleUpdate} onClose={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function IntegrationsPage() {
  return <Authenticated><IntegrationsContent /></Authenticated>;
}