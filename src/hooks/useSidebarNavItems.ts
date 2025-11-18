import { useMemo } from "react";
import { BookOpen, Compass, Flame, LayoutDashboard, LineChart, Settings, Shield, Wallet2 } from "lucide-react";
import type { SidebarNavItem } from "@/components/navigation/SidebarNav";
import { useAuthStore } from "@/lib/store";

const baseNavItems: SidebarNavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Contributes", href: "/contributes", icon: LineChart },
  { label: "Wallet", href: "/wallet", icon: Wallet2 },
  { label: "Burn", href: "/burn", icon: Flame },
  { label: "Docs", href: "/docs", icon: BookOpen },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const useSidebarNavItems = () => {
  const { isAdmin } = useAuthStore();
  return useMemo(
    () =>
      [
        ...baseNavItems,
        ...(isAdmin ? [{ label: "Admin Panel", href: "/admin", icon: Shield, isAdmin: true }] : []),
      ],
    [isAdmin],
  );
};
