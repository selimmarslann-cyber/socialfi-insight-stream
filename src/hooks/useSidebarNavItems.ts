import { useMemo } from "react";
import { BookOpen, Compass, Flame, LayoutDashboard, LineChart, Settings, Shield, Wallet2 } from "lucide-react";
import type { SidebarNavItem } from "@/components/navigation/SidebarNav";

const baseNavItems: SidebarNavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Contributes", href: "/contributes", icon: LineChart },
  { label: "Wallet", href: "/wallet", icon: Wallet2 },
  { label: "Burn", href: "/burn", icon: Flame },
  { label: "Docs", href: "/docs", icon: BookOpen },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Admin", href: "/admin", icon: Shield, isAdmin: true },
];

export const useSidebarNavItems = () => useMemo(() => baseNavItems, []);
