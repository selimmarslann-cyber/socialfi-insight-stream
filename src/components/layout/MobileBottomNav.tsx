import { Link, useLocation } from "react-router-dom";
import { Home, Search, Plus, Wallet, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWalletStore } from "@/lib/store";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/contributes", label: "Create", icon: Plus },
  { to: "/portfolio", label: "Portfolio", icon: Wallet },
  { to: "/profile", label: "Profile", icon: User },
];

export function MobileBottomNav() {
  const location = useLocation();
  const { connected } = useWalletStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-background-elevated/95 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || 
            (item.to !== "/" && location.pathname.startsWith(item.to));
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition-all",
                "min-h-[44px] min-w-[44px] touch-manipulation",
                isActive
                  ? "text-indigo-600 dark:text-cyan-400"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-transform",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-[10px] font-medium uppercase tracking-wide",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* Safe area for iOS notch */}
      <div className="h-safe-area-inset-bottom bg-background-elevated" />
    </nav>
  );
}

