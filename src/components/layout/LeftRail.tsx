import { useMemo } from "react";
import { BookOpen, Compass, Flame, LayoutDashboard, LineChart, Settings, Shield, Wallet2 } from "lucide-react";
import { SidebarNav } from "@/components/navigation/SidebarNav";
import { useAuthStore } from "@/lib/store";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";

const baseNavItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Contributes", href: "/contributes", icon: LineChart },
  { label: "Wallet", href: "/wallet", icon: Wallet2 },
  { label: "Burn", href: "/burn", icon: Flame },
  { label: "Docs", href: "/docs", icon: BookOpen },
  { label: "Settings", href: "/settings", icon: Settings },
];

const snapshotStats = [
  { label: "NOP price", value: "$0.12" },
  { label: "Open positions", value: "312" },
  { label: "Reputation leaders", value: "28" },
  { label: "7d burn", value: "38.2K NOP" },
];

export const LeftRail = () => {
  const { isAdmin } = useAuthStore();
  const navItems = useMemo(
    () =>
      [
        ...baseNavItems,
        ...(isAdmin ? [{ label: "Admin Panel", href: "/admin", icon: Shield, isAdmin: true }] : []),
      ] as const,
    [isAdmin],
  );

  return (
    <div className="space-y-4">
        <DashboardCard>
        <DashboardSectionTitle label="Navigation" title="Intelligence views" />
        <SidebarNav items={navItems} />
      </DashboardCard>

        <DashboardCard>
        <DashboardSectionTitle label="Overview" title="Protocol snapshot" />
        <div className="space-y-2">
          {snapshotStats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-between text-xs-2">
                <span className="text-text-secondary">{stat.label}</span>
                <span className="font-semibold tabular-nums text-text-primary">{stat.value}</span>
            </div>
          ))}
        </div>
      </DashboardCard>
    </div>
  );
};
