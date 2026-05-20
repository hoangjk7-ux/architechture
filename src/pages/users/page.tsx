import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated } from "convex/react";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { toast } from "sonner";
import { Users, ShieldAlert, UserPlus, Trash2, Mail, Crown } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user.ts";
import { cn } from "@/lib/utils.ts";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

const roleConfig = {
  cto:            { label: "CTO",            color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  it_manager:     { label: "IT Manager",     color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  business_owner: { label: "Business Owner", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  viewer:         { label: "Viewer",         color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
} as const;

const roleDesc: Record<keyof typeof roleConfig, string> = {
  cto:            "Toàn quyền truy cập tất cả module",
  it_manager:     "Đọc/ghi tất cả, ngoại trừ Users",
  business_owner: "Xem systems, vendors, roadmap",
  viewer:         "Chỉ đọc",
};

type Role = keyof typeof roleConfig;

function InviteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const inviteUser = useMutation(api.users.inviteUser);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!email.trim()) { toast.error("Email là bắt buộc"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { toast.error("Email không hợp lệ"); return; }
    setSaving(true);
    try {
      await inviteUser({ name: name.trim(), email: email.trim().toLowerCase(), role });
      toast.success("Đã thêm người dùng");
      setName(""); setEmail(""); setRole("viewer");
      onClose();
    } catch {
      toast.error("Không thể thêm người dùng");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="h-4 w-4" />Thêm người dùng</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Tên hiển thị</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" className="bg-input" />
          </div>
          <div className="space-y-1.5">
            <Label>Email <span className="text-destructive">*</span></Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@school.edu.vn" type="email" className="bg-input" />
          </div>
          <div className="space-y-1.5">
            <Label>Phân quyền</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger className="bg-input"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(roleConfig) as Role[]).map((r) => (
                  <SelectItem key={r} value={r}>
                    <span className="flex flex-col">
                      <span>{roleConfig[r].label}</span>
                      <span className="text-[10px] text-muted-foreground">{roleDesc[r]}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg bg-muted/40 border border-border p-3 text-xs text-muted-foreground">
            Người dùng sẽ được cấp quyền khi đăng nhập lần đầu bằng email này.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={saving}>Huỷ</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              <UserPlus className="h-3.5 w-3.5" />{saving ? "Đang lưu…" : "Thêm người dùng"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UsersContent() {
  const { user: me, isCTO } = useCurrentUser();
  const users = useQuery(api.users.listUsers);
  const updateRole = useMutation(api.users.updateUserRole);
  const removeUser = useMutation(api.users.removeUser);
  const [showInvite, setShowInvite] = useState(false);

  if (!isCTO) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center text-muted-foreground">
          <ShieldAlert className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Chỉ CTO mới có thể quản lý người dùng và phân quyền.</p>
        </div>
      </div>
    );
  }

  const handleRoleChange = async (userId: Id<"users">, role: Role) => {
    try {
      await updateRole({ userId, role });
      toast.success("Đã cập nhật phân quyền");
    } catch {
      toast.error("Không thể cập nhật phân quyền");
    }
  };

  const handleRemove = async (userId: Id<"users">) => {
    try {
      await removeUser({ userId });
      toast.success("Đã xoá người dùng");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Không thể xoá người dùng";
      toast.error(msg);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary" />Users & Roles</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Quản lý quyền truy cập cho từng thành viên</p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />Thêm người dùng
        </Button>
      </div>

      {/* Role Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.entries(roleConfig) as [Role, typeof roleConfig[Role]][]).map(([role, cfg]) => (
          <div key={role} className="bg-card border border-border rounded-lg p-3 space-y-1.5">
            <Badge className={cn("text-[10px]", cfg.color)}>{cfg.label}</Badge>
            <p className="text-xs text-muted-foreground">{roleDesc[role]}</p>
          </div>
        ))}
      </div>

      {users === undefined ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Chưa có người dùng nào</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Người dùng</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Quyền hiện tại</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Cập nhật quyền</th>
                <th className="p-3 font-medium text-muted-foreground w-12"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const role = (u.role ?? "viewer") as Role;
                const cfg = roleConfig[role];
                const isMe = u._id === me?._id;
                const isManual = (u as { isManuallyAdded?: boolean }).isManuallyAdded;
                return (
                  <tr key={u._id} className="border-b border-border/50 hover:bg-accent/30">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {role === "cto" ? <Crown className="h-3.5 w-3.5 text-purple-400 shrink-0" /> : null}
                        <span className="font-medium">{u.name ?? "Chưa đặt tên"}</span>
                        {isMe && <Badge variant="secondary" className="text-[10px]">Bạn</Badge>}
                        {isManual && (
                          <span className="flex items-center gap-1 text-[10px] text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20">
                            <Mail className="h-2.5 w-2.5" />Chờ đăng nhập
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{u.email ?? "—"}</td>
                    <td className="p-3">
                      <Badge className={cn("text-[10px]", cfg.color)}>{cfg.label}</Badge>
                    </td>
                    <td className="p-3">
                      {!isMe && (
                        <Select value={role} onValueChange={(v) => handleRoleChange(u._id, v as Role)}>
                          <SelectTrigger className="w-44 h-7 text-xs bg-input"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(Object.keys(roleConfig) as Role[]).map((r) => (
                              <SelectItem key={r} value={r}>{roleConfig[r].label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="p-3">
                      {!isMe && (
                        <button
                          onClick={() => handleRemove(u._id)}
                          className="p-1.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
                          title="Xoá người dùng"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <InviteDialog open={showInvite} onClose={() => setShowInvite(false)} />
    </div>
  );
}

export default function UsersPage() {
  return <Authenticated><UsersContent /></Authenticated>;
}
