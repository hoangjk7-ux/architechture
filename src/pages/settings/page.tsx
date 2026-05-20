import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated } from "convex/react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { Settings, Tag, Building2, MapPin, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user.ts";
import type { Id, Doc } from "@/convex/_generated/dataModel.d.ts";

type ConfigItem = Doc<"config_items">;
type ConfigType = "category" | "department" | "campus";

const CARD_CONFIG: Record<ConfigType, { label: string; icon: React.ElementType; color: string; placeholder: string; description: string }> = {
  category: {
    label: "Category",
    icon: Tag,
    color: "text-indigo-400",
    placeholder: "VD: CRM, ERP, SIS…",
    description: "Phân loại chức năng của hệ thống phần mềm",
  },
  department: {
    label: "Department",
    icon: Building2,
    color: "text-blue-400",
    placeholder: "VD: Finance, HR, Admissions…",
    description: "Các phòng ban sử dụng hệ thống",
  },
  campus: {
    label: "Campus",
    icon: MapPin,
    color: "text-green-400",
    placeholder: "VD: Hà Nội, TP.HCM, Đà Nẵng…",
    description: "Cơ sở / chi nhánh áp dụng hệ thống",
  },
};

function ConfigCard({ type, items, canWrite }: { type: ConfigType; items: ConfigItem[]; canWrite: boolean }) {
  const addItem = useMutation(api.config.add);
  const updateItem = useMutation(api.config.update);
  const removeItem = useMutation(api.config.remove);

  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<Id<"config_items"> | null>(null);
  const [editName, setEditName] = useState("");

  const cfg = CARD_CONFIG[type];
  const Icon = cfg.icon;

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await addItem({ type, name: newName.trim() });
      setNewName("");
      toast.success(`Đã thêm ${cfg.label}`);
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? "Không thể thêm");
    } finally {
      setAdding(false);
    }
  };

  const handleEdit = async (id: Id<"config_items">) => {
    if (!editName.trim()) return;
    try {
      await updateItem({ id, name: editName.trim() });
      setEditingId(null);
      toast.success("Đã cập nhật");
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? "Không thể cập nhật");
    }
  };

  const handleRemove = async (id: Id<"config_items">, name: string) => {
    try {
      await removeItem({ id });
      toast.success(`Đã xoá "${name}"`);
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } })?.data?.message ?? "Không thể xoá");
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/20">
        <div className={`p-2 rounded-lg bg-muted ${cfg.color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{cfg.label}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{cfg.description}</p>
        </div>
        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
          {items.length}
        </span>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/50" style={{ maxHeight: 280 }}>
        {items.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Chưa có dữ liệu. Thêm mới bên dưới.
          </div>
        ) : (
          items.map((item) => (
            <div key={item._id} className="flex items-center gap-2 px-4 py-2.5 hover:bg-accent/30 group">
              {editingId === item._id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleEdit(item._id); if (e.key === "Escape") setEditingId(null); }}
                    className="h-7 text-xs flex-1 bg-input"
                    autoFocus
                  />
                  <button onClick={() => handleEdit(item._id)} className="p-1 rounded hover:bg-green-500/20 text-green-400 cursor-pointer">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-1 rounded hover:bg-muted text-muted-foreground cursor-pointer">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm">{item.name}</span>
                  {canWrite && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingId(item._id); setEditName(item.name); }}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleRemove(item._id, item.name)}
                        className="p-1 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add new */}
      {canWrite && (
        <div className="flex gap-2 p-3 border-t border-border bg-muted/10">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={cfg.placeholder}
            className="h-8 text-xs flex-1 bg-input"
          />
          <Button size="sm" onClick={handleAdd} disabled={adding || !newName.trim()} className="gap-1 h-8 px-3">
            <Plus className="h-3.5 w-3.5" />
            Thêm
          </Button>
        </div>
      )}
    </div>
  );
}

function SettingsContent() {
  const { canWrite } = useCurrentUser();
  const config = useQuery(api.config.listAll);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />Cấu hình hệ thống
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Quản lý danh sách Category, Department và Campus dùng cho toàn bộ hệ thống
        </p>
      </div>

      {config === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {(["category", "department", "campus"] as ConfigType[]).map((type) => (
            <ConfigCard key={type} type={type} items={config[type]} canWrite={canWrite} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return <Authenticated><SettingsContent /></Authenticated>;
}
