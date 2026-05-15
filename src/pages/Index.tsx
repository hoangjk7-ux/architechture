import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Server,
  GitBranch,
  Building2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  ShieldAlert,
} from "lucide-react";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
}: {
  title: string;
  value: number | string | undefined;
  icon: React.ElementType;
  description?: string;
  variant?: "default" | "warning" | "danger" | "success";
}) {
  const colors = {
    default: "text-foreground",
    warning: "text-yellow-600",
    danger: "text-red-600",
    success: "text-green-600",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colors[variant]}`} />
      </CardHeader>
      <CardContent>
        {value === undefined ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className={`text-2xl font-bold ${colors[variant]}`}>{value}</div>
        )}
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

export default function Index() {
  const systemStats = useQuery(api.software_systems.getStats);
  const integrationStats = useQuery(api.integrations.getStats);
  const roadmapStats = useQuery(api.roadmap.getStats);
  const vendors = useQuery(api.vendors.list);

  const highRiskVendors = vendors?.filter((v) => v.riskScore >= 70).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Technology governance overview</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Systems</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Systems" value={systemStats?.total} icon={Server} />
          <StatCard title="Active" value={systemStats?.active} icon={CheckCircle2} variant="success" />
          <StatCard title="High Risk" value={systemStats?.highRisk} icon={ShieldAlert} variant="danger" />
          <StatCard title="Legacy" value={systemStats?.legacy} icon={Clock} variant="warning" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            title="Avg Architecture Score"
            value={systemStats?.avgArchitectureScore !== undefined ? `${systemStats.avgArchitectureScore}%` : undefined}
            icon={TrendingUp}
            variant={
              systemStats?.avgArchitectureScore !== undefined
                ? systemStats.avgArchitectureScore >= 70
                  ? "success"
                  : systemStats.avgArchitectureScore >= 40
                  ? "warning"
                  : "danger"
                : "default"
            }
          />
          <StatCard
            title="Avg Technical Debt"
            value={systemStats?.avgTechnicalDebt !== undefined ? `${systemStats.avgTechnicalDebt}%` : undefined}
            icon={AlertTriangle}
            variant={
              systemStats?.avgTechnicalDebt !== undefined
                ? systemStats.avgTechnicalDebt <= 30
                  ? "success"
                  : systemStats.avgTechnicalDebt <= 60
                  ? "warning"
                  : "danger"
                : "default"
            }
          />
          <StatCard
            title="Expiring Contracts"
            value={systemStats?.expiringContracts}
            icon={Clock}
            description="Within 30 days"
            variant={systemStats?.expiringContracts ? "warning" : "default"}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Integrations</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total" value={integrationStats?.total} icon={GitBranch} />
          <StatCard title="Healthy" value={integrationStats?.healthy} icon={CheckCircle2} variant="success" />
          <StatCard title="Degraded" value={integrationStats?.degraded} icon={AlertTriangle} variant="warning" />
          <StatCard title="Down" value={integrationStats?.down} icon={ShieldAlert} variant="danger" />
        </div>
        {integrationStats?.nonCompliant !== undefined && integrationStats.nonCompliant > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900">
            <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
            <span className="text-sm text-yellow-800 dark:text-yellow-200">
              {integrationStats.nonCompliant} integration{integrationStats.nonCompliant > 1 ? "s" : ""} not architecture-compliant
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Roadmap</h2>
          <div className="grid grid-cols-2 gap-4">
            <StatCard title="In Progress" value={roadmapStats?.inProgress} icon={TrendingUp} />
            <StatCard title="Blocked" value={roadmapStats?.blocked} icon={AlertTriangle} variant="danger" />
            <StatCard
              title="Completion Rate"
              value={roadmapStats?.completionRate !== undefined ? `${roadmapStats.completionRate}%` : undefined}
              icon={CheckCircle2}
              variant="success"
            />
            <StatCard title="Overdue" value={roadmapStats?.overdue} icon={Clock} variant={roadmapStats?.overdue ? "warning" : "default"} />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Vendors</h2>
          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Total Vendors" value={vendors?.length} icon={Building2} />
            <StatCard
              title="High Risk"
              value={highRiskVendors}
              icon={ShieldAlert}
              variant={highRiskVendors ? "danger" : "default"}
              description="Risk score ≥ 70"
            />
          </div>
          {vendors === undefined ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : vendors.length === 0 ? (
            <p className="text-sm text-muted-foreground">No vendors yet.</p>
          ) : (
            <div className="space-y-2">
              {vendors.slice(0, 5).map((v) => (
                <div key={v._id} className="flex items-center justify-between p-2 rounded-md border border-border text-sm">
                  <span className="font-medium truncate">{v.name}</span>
                  <Badge
                    variant={v.riskScore >= 70 ? "destructive" : v.riskScore >= 40 ? "secondary" : "outline"}
                    className="text-xs shrink-0"
                  >
                    Risk {v.riskScore}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
