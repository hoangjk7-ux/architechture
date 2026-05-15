import { useState, useMemo } from "react";
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
import {
  Plus, Building2, Edit, Trash2, AlertTriangle, X,
  DollarSign, CalendarClock, Shield, Phone, Mail, Server,
  TrendingUp, Search, Filter, CheckCircle2, Clock, XCircle,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user.ts";
import { cn } from "@/lib/utils.ts";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";

type Vendor = Doc<"vendors">;
type SoftwareSystem = Doc<"software_systems">;
type VendorSupportLevel = "24/7" | "business_hours" | "email_only";

// ─── Helpers ───────────────────────────────────────────────────────────────────
function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400e3);
}

function riskColor(score: number) {
  return score >= 70 ? "#ef4444" : score >= 40 ? "#f59e0b" : "#22c55e";
}

function RiskBadge({ score }: { score: number }) {
  const color = riskColor(score);
  const label = score >= 70 ? "High" : score >= 40 ? "Medium" : "Low";
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border" style={{ background: `${color}15`, color, borderColor: `${color}44` }}>
      <TrendingUp className="h-2.5 w-2.5" />{label} Risk {score}
    </span>
  );
}

function SupportBadge({ level }: { level: string }) {
  const map: Record<string, { label: string; color: string }> = {
    "24/7":           { label: "24/7 Support",    color: "#22c55e" },
    "business_hours": { label: "Business Hours",  color: "#3b82f6" },
    "email_only":     { label: "Email Only",      color: "#94a3b8" },
  };
  const m = map[level] ?? map["email_only"];
  return <span className="text-[10px] font-medium" style={{ color: m.color }}>{m.label}</span>;
}

function ContractStatus({ dateStr }: { dateStr: string }) {
  const days = daysUntil(dateStr);
  if (days < 0) return <span className="flex items-center gap-1 text-[10px] text-red-400"><XCircle className="h-3 w-3" />Expired {Math.abs(days)}d ago</span>;
  if (days <= 30) return <span className="flex items-center gap-1 text-[10px] text-red-400 font-semibold"><AlertTriangle className="h-3 w-3" />{days}d left</span>;
  if (days <= 90) return <span className="flex items-center gap-1 text-[10px] text-yellow-400"><Clock className="h-3 w-3" />{days}d left</span>;
  return <span className="flex items-center gap-1 text-[10px] text-green-400"><CheckCircle2 className="h-3 w-3" />{days}d left</span>;
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, onClick, active }: {
  icon: React.ElementType; label: string; value: number; sub?: string;
  color: string; onClick?: () => void; active?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={cn("flex-1 min-w-[130px] rounded-xl border p-4 text-left transition-all cursor-pointer", active ? "ring-1" : "hover:border-border/80")}
      style={{ background: active ? `${color}12` : "#0d1526", borderColor: active ? color : "#1e293b", ...(active ? { boxShadow: `0 0 0 1px ${color}44` } : {}) }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </button>
  );
}

// ─── Detail side panel ─────────────────────────────────────────────────────────
function VendorDetailPanel({ vendor, systems, onClose, onEdit, canWrite }: {
  vendor: Vendor; systems: SoftwareSystem[]; onClose: () => void;
  onEdit: (v: Vendor) => void; canWrite: boolean;
}) {
  const linked = useMemo(() => systems.filter((s) => s.vendorId === vendor._id), [systems, vendor._id]);
  const totalCost = linked.reduce((sum, s) => sum + (s.costPerYear ?? 0), 0);

  const contractDays = vendor.contractEndDate ? daysUntil(vendor.contractEndDate) : null;
  const isUrgent = contractDays !== null && contractDays <= 30;
  const isWarning = contractDays !== null && contractDays > 30 && contractDays <= 90;

  return (
    <div className="w-[320px] shrink-0 border-l border-border bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-start justify-between gap-2"
        style={{ background: isUrgent ? "#2a0a0a" : isWarning ? "#2a1a00" : "#0d1526" }}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0" style={{ color: isUrgent ? "#ef4444" : isWarning ? "#f59e0b" : "#6366f1" }} />
            <span className="font-bold text-sm truncate">{vendor.name}</span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{linked.length} linked system{linked.length !== 1 ? "s" : ""}</div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canWrite && (
            <button onClick={() => onEdit(vendor)} className="cursor-pointer p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
              <Edit className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={onClose} className="cursor-pointer p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
        {/* Contract alert */}
        {contractDays !== null && contractDays <= 90 && (
          <div className={cn("flex items-start gap-2 rounded-lg p-3 border text-xs", isUrgent ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400")}>
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">{isUrgent ? "Contract expiring soon!" : "Contract renewal needed"}</div>
              <div className="opacity-80">{contractDays <= 0 ? "Already expired" : `${contractDays} days remaining`} · ends {vendor.contractEndDate}</div>
            </div>
          </div>
        )}

        {/* Risk + Support */}
        <div className="flex flex-wrap gap-2">
          <RiskBadge score={vendor.riskScore} />
          <SupportBadge level={vendor.supportLevel} />
        </div>

        {/* Key info grid */}
        <div className="grid grid-cols-2 gap-2">
          {vendor.sla && (
            <div className="bg-muted/30 rounded-lg p-2.5 col-span-1">
              <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">SLA</div>
              <div className="text-xs font-semibold flex items-center gap-1"><Shield className="h-3 w-3 text-blue-400" />{vendor.sla}</div>
            </div>
          )}
          {vendor.costPerYear !== undefined && (
            <div className="bg-muted/30 rounded-lg p-2.5">
              <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Annual Cost</div>
              <div className="text-xs font-semibold text-green-400 flex items-center gap-1"><DollarSign className="h-3 w-3" />${vendor.costPerYear.toLocaleString()}</div>
            </div>
          )}
          {vendor.contractEndDate && (
            <div className="bg-muted/30 rounded-lg p-2.5 col-span-2">
              <div className="text-[9px] text-muted-foreground uppercase tracking-wide mb-0.5">Contract End Date</div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1"><CalendarClock className="h-3 w-3 text-muted-foreground" />{vendor.contractEndDate}</span>
                <ContractStatus dateStr={vendor.contractEndDate} />
              </div>
            </div>
          )}
        </div>

        {/* Contact */}
        {(vendor.contactName || vendor.contactEmail) && (
          <div className="rounded-lg border border-border p-3 space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Contact</div>
            {vendor.contactName && <div className="flex items-center gap-2 text-xs"><Phone className="h-3 w-3 text-muted-foreground" />{vendor.contactName}</div>}
            {vendor.contactEmail && <div className="flex items-center gap-2 text-xs"><Mail className="h-3 w-3 text-muted-foreground" /><a href={`mailto:${vendor.contactEmail}`} className="text-blue-400 hover:underline">{vendor.contactEmail}</a></div>}
          </div>
        )}

        {/* Linked systems */}
        <div className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Linked Systems ({linked.length})</div>
            {totalCost > 0 && <span className="text-[10px] text-green-400 font-mono">Σ ${totalCost.toLocaleString()}/yr</span>}
          </div>
          {linked.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">No systems linked to this vendor.</p>
          ) : (
            <div className="space-y-1.5">
              {linked.map((s) => (
                <div key={s._id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Server className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[11px] truncate">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded capitalize">{s.type}</span>
                    <span className={cn("w-1.5 h-1.5 rounded-full", { active: "bg-green-400", sunset: "bg-yellow-400", pilot: "bg-blue-400", inactive: "bg-gray-500" }[s.status] ?? "bg-gray-500")} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        {vendor.notes && (
          <div className="text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-3">{vendor.notes}</div>
        )}
      </div>
    </div>
  );
}

// ─── Vendor Card ───────────────────────────────────────────────────────────────
function VendorCard({ vendor, systems, isSelected, onClick, onEdit, onDelete, canWrite }: {
  vendor: Vendor; systems: SoftwareSystem[]; isSelected: boolean;
  onClick: () => void; onEdit: (v: Vendor) => void; onDelete: (id: Id<"vendors">) => void; canWrite: boolean;
}) {
  const linked = useMemo(() => systems.filter((s) => s.vendorId === vendor._id), [systems, vendor._id]);
  const contractDays = vendor.contractEndDate ? daysUntil(vendor.contractEndDate) : null;
  const isUrgent = contractDays !== null && contractDays <= 30;
  const isWarning = contractDays !== null && contractDays > 30 && contractDays <= 90;
  const rc = riskColor(vendor.riskScore);

  return (
    <div
      onClick={onClick}
      className={cn("relative rounded-xl border p-4 cursor-pointer transition-all space-y-3",
        isSelected ? "ring-1 ring-primary/60" : "hover:border-border/80"
      )}
      style={{
        background: isSelected ? "#6366f115" : "#0d1526",
        borderColor: isUrgent ? "#ef4444" : isWarning ? "#f59e0b" : isSelected ? "#6366f1" : "#1e293b",
      }}
    >
      {/* Urgent banner */}
      {isUrgent && (
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl bg-red-500" />
      )}
      {isWarning && (
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl bg-yellow-500" />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm truncate">{vendor.name}</h3>
          {vendor.contactName && <p className="text-[11px] text-muted-foreground">{vendor.contactName}</p>}
        </div>
        {canWrite && (
          <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={() => onEdit(vendor)}><Edit className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer text-destructive hover:text-destructive" onClick={() => onDelete(vendor._id)}><Trash2 className="h-3 w-3" /></Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div>
          <span className="text-muted-foreground text-[9px] uppercase tracking-wide">Systems</span>
          <p className="font-bold text-sm">{linked.length}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-[9px] uppercase tracking-wide">Risk</span>
          <p className="font-bold text-sm" style={{ color: rc }}>{vendor.riskScore}</p>
        </div>
        <div>
          <span className="text-muted-foreground text-[9px] uppercase tracking-wide">Support</span>
          <p className="font-medium text-[10px]">{vendor.supportLevel === "24/7" ? "24/7" : vendor.supportLevel === "business_hours" ? "Biz Hrs" : "Email"}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {vendor.sla && <Badge variant="secondary" className="text-[9px]"><Shield className="h-2.5 w-2.5 mr-1" />{vendor.sla}</Badge>}
        {vendor.costPerYear !== undefined && <Badge variant="secondary" className="text-[9px] text-green-400"><DollarSign className="h-2.5 w-2.5 mr-0.5" />${(vendor.costPerYear / 1000).toFixed(0)}k/yr</Badge>}
      </div>

      {vendor.contractEndDate && (
        <div className="flex items-center justify-between border-t border-border/50 pt-2">
          <span className="text-[10px] text-muted-foreground">{vendor.contractEndDate}</span>
          <ContractStatus dateStr={vendor.contractEndDate} />
        </div>
      )}
    </div>
  );
}

// ─── Form ──────────────────────────────────────────────────────────────────────
type VendorFormData = {
  name: string; contactEmail: string; contactName: string;
  supportLevel: VendorSupportLevel; sla: string;
  costPerYear: number | undefined; contractEndDate: string;
  riskScore: number; notes: string;
};

const defaultForm: VendorFormData = {
  name: "", contactEmail: "", contactName: "", supportLevel: "business_hours",
  sla: "", costPerYear: undefined, contractEndDate: "", riskScore: 20, notes: "",
};

function VendorForm({ initial, onSave, onClose }: {
  initial?: Partial<VendorFormData> & { _id?: Id<"vendors"> };
  onSave: (data: VendorFormData) => Promise<void>; onClose: () => void;
}) {
  const [form, setForm] = useState<VendorFormData>({ ...defaultForm, ...initial });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof VendorFormData>(k: K, v: VendorFormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try { await onSave(form); onClose(); } catch { toast.error("Failed to save"); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label>Vendor Name *</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. OpenEdu Solutions" className="bg-input" />
        </div>
        <div className="space-y-1">
          <Label>Contact Name</Label>
          <Input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="John Smith" className="bg-input" />
        </div>
        <div className="space-y-1">
          <Label>Contact Email</Label>
          <Input type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} placeholder="support@vendor.com" className="bg-input" />
        </div>
        <div className="space-y-1">
          <Label>Support Level</Label>
          <Select value={form.supportLevel} onValueChange={(v) => set("supportLevel", v as VendorSupportLevel)}>
            <SelectTrigger className="bg-input"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="24/7">24/7</SelectItem>
              <SelectItem value="business_hours">Business Hours</SelectItem>
              <SelectItem value="email_only">Email Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>SLA</Label>
          <Input value={form.sla} onChange={(e) => set("sla", e.target.value)} placeholder="e.g. 99.9%" className="bg-input" />
        </div>
        <div className="space-y-1">
          <Label>Cost / Year (USD)</Label>
          <Input type="number" value={form.costPerYear ?? ""} onChange={(e) => set("costPerYear", e.target.value ? Number(e.target.value) : undefined)} placeholder="0" className="bg-input" />
        </div>
        <div className="space-y-1">
          <Label>Contract End Date</Label>
          <Input type="date" value={form.contractEndDate} onChange={(e) => set("contractEndDate", e.target.value)} className="bg-input" />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Risk Score (0–100) — higher = riskier</Label>
          <div className="flex items-center gap-3">
            <input type="range" min={0} max={100} value={form.riskScore}
              onChange={(e) => set("riskScore", Number(e.target.value))}
              className="flex-1 accent-indigo-500 cursor-pointer" />
            <span className="font-bold text-sm w-8 text-right" style={{ color: riskColor(form.riskScore) }}>{form.riskScore}</span>
          </div>
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Notes</Label>
          <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Additional notes..." className="bg-input" rows={2} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Vendor"}</Button>
      </div>
    </div>
  );
}

// ─── Main content ──────────────────────────────────────────────────────────────
function VendorsContent() {
  const { canWrite } = useCurrentUser();
  const vendors = useQuery(api.vendors.list) ?? [];
  const systems = useQuery(api.software_systems.list) ?? [];
  const createVendor = useMutation(api.vendors.create);
  const updateVendor = useMutation(api.vendors.update);
  const removeVendor = useMutation(api.vendors.remove);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [selectedId, setSelectedId] = useState<Id<"vendors"> | null>(null);
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterContract, setFilterContract] = useState("all");
  const [statFilter, setStatFilter] = useState<string | null>(null);

  const now = Date.now();

  const stats = useMemo(() => ({
    total:    vendors.length,
    urgent:   vendors.filter((v) => v.contractEndDate && daysUntil(v.contractEndDate) <= 30).length,
    expiring: vendors.filter((v) => v.contractEndDate && daysUntil(v.contractEndDate) > 30 && daysUntil(v.contractEndDate) <= 90).length,
    highRisk: vendors.filter((v) => v.riskScore >= 70).length,
    totalCost: vendors.reduce((sum, v) => sum + (v.costPerYear ?? 0), 0),
  }), [vendors]);

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterRisk === "high" && v.riskScore < 70) return false;
      if (filterRisk === "medium" && (v.riskScore < 40 || v.riskScore >= 70)) return false;
      if (filterRisk === "low" && v.riskScore >= 40) return false;
      if (filterContract === "urgent" && !(v.contractEndDate && daysUntil(v.contractEndDate) <= 30)) return false;
      if (filterContract === "warning" && !(v.contractEndDate && daysUntil(v.contractEndDate) > 30 && daysUntil(v.contractEndDate) <= 90)) return false;
      if (filterContract === "ok" && v.contractEndDate && daysUntil(v.contractEndDate) <= 90) return false;
      if (statFilter === "urgent" && !(v.contractEndDate && daysUntil(v.contractEndDate) <= 30)) return false;
      if (statFilter === "expiring" && !(v.contractEndDate && daysUntil(v.contractEndDate) > 30 && daysUntil(v.contractEndDate) <= 90)) return false;
      if (statFilter === "highRisk" && v.riskScore < 70) return false;
      return true;
    }).sort((a, b) => {
      // Sort: urgent first, then warning, then by risk score
      const da = a.contractEndDate ? daysUntil(a.contractEndDate) : 9999;
      const db = b.contractEndDate ? daysUntil(b.contractEndDate) : 9999;
      if (da <= 90 || db <= 90) return da - db;
      return b.riskScore - a.riskScore;
    });
  }, [vendors, search, filterRisk, filterContract, statFilter, now]);

  const selectedVendor = useMemo(() => vendors.find((v) => v._id === selectedId) ?? null, [vendors, selectedId]);

  const handleCreate = async (data: VendorFormData) => { await createVendor(data); toast.success("Vendor added"); };
  const handleUpdate = async (data: VendorFormData) => {
    if (!editing) return;
    await updateVendor({ id: editing._id, ...data });
    toast.success("Vendor updated");
    setEditing(null);
  };
  const handleDelete = async (id: Id<"vendors">) => {
    if (selectedId === id) setSelectedId(null);
    await removeVendor({ id });
    toast.success("Vendor removed");
  };

  const toggleStat = (key: string) => setStatFilter((prev) => prev === key ? null : key);
  const hasFilters = search || filterRisk !== "all" || filterContract !== "all" || statFilter;

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="h-6 w-6 text-primary" />Vendor & Contract Management</h1>
                <p className="text-muted-foreground text-sm mt-0.5">{vendors.length} vendors · total spend ${stats.totalCost.toLocaleString()}/yr</p>
              </div>
              {canWrite && (
                <Button onClick={() => setShowForm(true)} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />Add Vendor
                </Button>
              )}
            </div>

            {/* Stat cards */}
            <div className="flex flex-wrap gap-3">
              <StatCard icon={Building2}     label="Total Vendors"    value={stats.total}    color="#6366f1" onClick={() => setStatFilter(null)} active={statFilter === null} />
              <StatCard icon={AlertTriangle} label="Expiring ≤30d"    value={stats.urgent}   color="#ef4444" sub="urgent renewal" onClick={() => toggleStat("urgent")}   active={statFilter === "urgent"} />
              <StatCard icon={Clock}         label="Expiring ≤90d"    value={stats.expiring} color="#f59e0b" sub="plan renewal"   onClick={() => toggleStat("expiring")} active={statFilter === "expiring"} />
              <StatCard icon={TrendingUp}    label="High Risk"        value={stats.highRisk} color="#f97316" sub="score ≥ 70"     onClick={() => toggleStat("highRisk")} active={statFilter === "highRisk"} />
              <button className="flex-1 min-w-[130px] rounded-xl border p-4 text-left" style={{ background: "#0d1526", borderColor: "#1e293b" }}>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Total Spend</span>
                <span className="text-2xl font-bold text-green-400">${(stats.totalCost / 1000).toFixed(0)}k</span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">per year</span>
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vendors…" className="pl-9 bg-input h-9" />
              </div>
              <Select value={filterRisk} onValueChange={setFilterRisk}>
                <SelectTrigger className="w-36 bg-input h-9 text-xs"><Filter className="h-3 w-3 mr-1 opacity-50 shrink-0" /><SelectValue placeholder="All Risk" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk</SelectItem>
                  <SelectItem value="high">High Risk (≥70)</SelectItem>
                  <SelectItem value="medium">Medium (40–69)</SelectItem>
                  <SelectItem value="low">Low (&lt;40)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterContract} onValueChange={setFilterContract}>
                <SelectTrigger className="w-40 bg-input h-9 text-xs"><Filter className="h-3 w-3 mr-1 opacity-50 shrink-0" /><SelectValue placeholder="All Contracts" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contracts</SelectItem>
                  <SelectItem value="urgent">Expiring ≤30d</SelectItem>
                  <SelectItem value="warning">Expiring ≤90d</SelectItem>
                  <SelectItem value="ok">Active &gt;90d</SelectItem>
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground gap-1 cursor-pointer" onClick={() => { setSearch(""); setFilterRisk("all"); setFilterContract("all"); setStatFilter(null); }}>
                  <X className="h-3 w-3" />Clear
                </Button>
              )}
              <span className="text-xs text-muted-foreground ml-auto">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Grid */}
            {vendors === undefined ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
                <Building2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No vendors found</p>
                {canWrite && <Button variant="ghost" size="sm" onClick={() => setShowForm(true)} className="mt-2 cursor-pointer">Add your first vendor</Button>}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((v) => (
                  <VendorCard key={v._id} vendor={v} systems={systems}
                    isSelected={selectedId === v._id}
                    onClick={() => setSelectedId(selectedId === v._id ? null : v._id)}
                    onEdit={setEditing} onDelete={handleDelete} canWrite={canWrite}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Side panel */}
      {selectedVendor && (
        <VendorDetailPanel
          vendor={selectedVendor} systems={systems}
          onClose={() => setSelectedId(null)}
          onEdit={(v) => { setEditing(v); setSelectedId(null); }}
          canWrite={canWrite}
        />
      )}

      {/* Dialogs */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader><DialogTitle>Add Vendor</DialogTitle></DialogHeader>
          <VendorForm onSave={handleCreate} onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader><DialogTitle>Edit Vendor</DialogTitle></DialogHeader>
          {editing && <VendorForm initial={editing} onSave={handleUpdate} onClose={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function VendorsPage() {
  return <Authenticated><VendorsContent /></Authenticated>;
}
