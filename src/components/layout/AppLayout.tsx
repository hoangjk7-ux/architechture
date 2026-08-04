import { Outlet, NavLink } from "react-router-dom";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useSimpleAuth } from "@/components/providers/simple-auth.tsx";
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
  LogOut,
} from "lucide-react";
import { LanguageToggle } from "@/components/ui/language-toggle.tsx";

import { useState } from "react";
import { useLanguage } from "@/components/providers/language.tsx";
import { formatRole } from "@/lib/roles.ts";

const navItems = [
  { to: "/", icon: LayoutDashboard, labelKey: "nav.dashboard", roles: ["cto", "it_manager", "business_owner", "viewer"] },
  { to: "/systems", icon: Server, labelKey: "nav.systems", roles: ["cto", "it_manager", "business_owner", "viewer"] },
  { to: "/vendors", icon: Building2, labelKey: "nav.vendors", roles: ["cto", "it_manager", "viewer"] },
  { to: "/architecture", icon: Map, labelKey: "nav.architecture", roles: ["cto", "it_manager", "business_owner", "viewer"] },
  { to: "/integrations", icon: GitBranch, labelKey: "nav.integrations", roles: ["cto", "it_manager", "viewer"] },
  { to: "/roadmap", icon: ShieldCheck, labelKey: "nav.roadmap", roles: ["cto", "it_manager", "business_owner", "viewer"] },
  { to: "/users", icon: Users, labelKey: "nav.users", roles: ["cto"] },
  { to: "/settings", icon: Settings, labelKey: "nav.settings", roles: ["cto", "it_manager"] },
];



function AppLayoutInner() {
  const { user } = useCurrentUser();
  const { signOut } = useSimpleAuth();
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);

  const isAuthenticated = Boolean(user);
  const visibleNav = !isAuthenticated
    ? navItems
    : navItems.filter((item) =>
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
              {!collapsed && <span>{t(item.labelKey as any)}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + Collapse */}
        <div className="p-2 border-t border-sidebar-border space-y-1">
          <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-start px-1")}>
            {collapsed ? <LanguageToggle iconOnly /> : <LanguageToggle />}
          </div>
          {user && (
            <div className={cn("rounded-lg border border-border/60 bg-muted/20 p-2.5", collapsed ? "flex justify-center" : "flex items-center gap-2.5")}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold uppercase text-primary">
                {(user.name ?? user.email ?? "U").charAt(0)}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-sidebar-foreground">{user.name ?? user.email}</div>
                    <div className="mt-0.5 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      {formatRole(user.role)}
                  </div>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => void signOut()}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="text-xs">{t("auth.signOut")}</span>}
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
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Settings className="h-5 w-5 text-muted-foreground" />
          </div>
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
            <span className="truncate max-w-[60px] text-center">{t(item.labelKey as any).split(" ")[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useSimpleAuth();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background flex items-center justify-center p-4">
        <div className="pointer-events-none absolute -top-32 -left-32 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">{t("app.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("app.subtitle")}</p>
            </div>
          </div>
          <SignInButton />
        </div>
      </div>
    );
  }

  return <AppLayoutInner />;
}
