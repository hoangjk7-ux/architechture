import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated } from "convex/react";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { toast } from "sonner";
import { Users, ShieldAlert } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user.ts";
import { cn } from "@/lib/utils.ts";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

const roleConfig = {
  cto: { label: "CTO", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  it_manager: { label: "IT Manager", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  business_owner: { label: "Business Owner", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  viewer: { label: "Viewer", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
} as const;

type Role = keyof typeof roleConfig;

function UsersContent() {
  const { user: me, isCTO } = useCurrentUser();
  const users = useQuery(api.users.listUsers);
  const updateRole = useMutation(api.users.updateUserRole);

  if (!isCTO) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center text-muted-foreground">
          <ShieldAlert className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Only CTO can manage users and roles.</p>
        </div>
      </div>
    );
  }

  const handleRoleChange = async (userId: Id<"users">, role: Role) => {
    try {
      await updateRole({ userId, role });
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Users & Roles</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage team access and permissions</p>
      </div>

      {/* Role Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.entries(roleConfig) as [Role, typeof roleConfig[Role]][]).map(([role, cfg]) => {
          const desc = {
            cto: "Full access to all modules",
            it_manager: "Read/write all except Users",
            business_owner: "Read systems, vendors, roadmap",
            viewer: "Read-only access",
          }[role];
          return (
            <div key={role} className="bg-card border border-border rounded-lg p-3">
              <Badge className={cn("text-[10px] mb-2", cfg.color)}>{cfg.label}</Badge>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          );
        })}
      </div>

      {users === undefined ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No users yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Current Role</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Change Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const role = u.role ?? "viewer";
                const cfg = roleConfig[role];
                const isMe = u._id === me?._id;
                return (
                  <tr key={u._id} className="border-b border-border/50 hover:bg-accent/30">
                    <td className="p-3">
                      <span className="font-medium">{u.name ?? "Unknown"}</span>
                      {isMe && <Badge variant="secondary" className="ml-2 text-[10px]">You</Badge>}
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{u.email}</td>
                    <td className="p-3">
                      <Badge className={cn("text-[10px]", cfg.color)}>{cfg.label}</Badge>
                    </td>
                    <td className="p-3">
                      {!isMe && (
                        <Select value={role} onValueChange={(v) => handleRoleChange(u._id, v as Role)}>
                          <SelectTrigger className="w-40 h-7 text-xs bg-input"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(Object.keys(roleConfig) as Role[]).map((r) => (
                              <SelectItem key={r} value={r}>{roleConfig[r].label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  return <Authenticated><UsersContent /></Authenticated>;
}
