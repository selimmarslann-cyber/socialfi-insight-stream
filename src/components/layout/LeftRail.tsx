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

const networkStats = [
  { label: "Network TVL", value: "$128.4M", delta: "+2.1%" },
  { label: "NOP Burned (7d)", value: "38,240", delta: "+12%" },
  { label: "Signal Accuracy", value: "87%", delta: "+1.4%" },
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
    <div className="space-y-4 lg:space-y-5">
      <DashboardCard>
        <DashboardSectionTitle label="Navigate" title="Intelligence Views" />
        <SidebarNav items={navItems} />
      </DashboardCard>

      <DashboardCard>
        <DashboardSectionTitle label="Network Pulse" title="NOP Snapshot" />
        <div className="space-y-3">
          {networkStats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center justify-between rounded-2xl border border-slate-100/80 bg-slate-50/60 px-3 py-2"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {stat.label}
                </p>
                <p className="text-sm font-semibold text-slate-900 tabular-nums">{stat.value}</p>
              </div>
              <span className="text-xs font-semibold text-emerald-600">{stat.delta}</span>
            </div>
          ))}
        </div>
      </DashboardCard>
    </div>
  );
};
