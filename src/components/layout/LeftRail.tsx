import { SidebarNav } from "@/components/navigation/SidebarNav";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";
import { useSidebarNavItems } from "@/hooks/useSidebarNavItems";

const snapshotStats = [
  { label: "NOP price", value: "$0.12" },
  { label: "Open positions", value: "312" },
  { label: "Reputation leaders", value: "28" },
  { label: "7d burn", value: "38.2K NOP" },
];

export const LeftRail = () => {
  const navItems = useSidebarNavItems();

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
