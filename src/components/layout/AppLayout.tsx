import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useCurrentUser } from "@/hooks/use-current-user.ts";
import { cn } from "@/lib/utils.ts";
import {
  LayoutDashboard,
  Server,
  GitBranch,
  Map,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Network,
  LogOut,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", roles: ["cto", "it_manager", "business_owner", "viewer"] },
  { to: "/systems", icon: Server, label: "System Inventory", roles: ["cto", "it_manager", "business_owner", "viewer"] },
  { to: "/vendors", icon: Building2, label: "Vendors", roles: ["cto", "it_manager", "viewer"] },
  { to: "/architecture", icon: Map, label: "Architecture Map", roles: ["cto", "it_manager", "viewer"] },
  { to: "/integrations", icon: GitBranch, label: "Integrations", roles: ["cto", "it_manager", "viewer"] },
  { to: "/roadmap", icon: ShieldCheck, label: "Roadmap", roles: ["cto", "it_manager", "business_owner", "viewer"] },
  { to: "/flow-diagram", icon: Network, label: "Flow Diagram", roles: ["cto", "it_manager", "business_owner", "viewer"] },
  { to: "/users", icon: Users, label: "Users & Roles", roles: ["cto"] },
];

function AppLayoutInner() {
  const { user } = useCurrentUser();
  const { signOut } = useAuthActions();
  const [collapsed, setCollapsed] = useState(false);
  const updateCurrentUser = useMutation(api.users.updateCurrentUser);

  useEffect(() => {
    if (user !== undefined && !user?.role) {
      void updateCurrentUser();
    }
  }, [user, updateCurrentUser]);

  const visibleNav = navItems.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-sidebar transition-all duration-300",
          collapsed ? "md:w-16" : "md:w-60"
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center gap-3 p-4 border-b border-sidebar-border", collapsed && "justify-center")}>
          {!collapsed && (
            <div>
              <div className="text-sm font-bold text-sidebar-foreground leading-tight">TechGov</div>
              <div className="text-[10px] text-muted-foreground leading-tight">CTO Platform</div>
            </div>
          )}
          {collapsed && <LayoutDashboard className="h-5 w-5 text-primary" />}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center px-2"
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + Collapse */}
        <div className="p-2 border-t border-sidebar-border space-y-1">
          {!collapsed && user && (
            <div className="px-3 py-2">
              <div className="text-xs font-medium text-sidebar-foreground truncate">{user.name ?? user.email}</div>
              <div className="text-[10px] text-muted-foreground capitalize">{user.role?.replace("_", " ")}</div>
            </div>
          )}
          <button
            onClick={() => void signOut()}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="text-xs">Sign out</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-sidebar">
          <span className="font-bold text-sm">TechGov</span>
          <Settings className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 flex justify-around border-t border-border bg-sidebar md:hidden pb-safe">
        {visibleNav.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-[10px] cursor-pointer",
                isActive ? "text-primary" : "text-muted-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="truncate max-w-[60px] text-center">{item.label.split(" ")[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function AppLayout() {
  return (
    <>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Skeleton className="h-8 w-48" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-8 p-4">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">TechGov Platform</h1>
            <p className="text-muted-foreground text-sm">Technology Governance for International School CTO</p>
          </div>
          <SignInButton />
        </div>
      </Unauthenticated>
      <Authenticated>
        <AppLayoutInner />
      </Authenticated>
    </>
  );
}
