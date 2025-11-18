import { LucideIcon } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  isAdmin?: boolean;
}

interface SidebarNavProps {
  items: SidebarNavItem[];
}

const baseLinkClass =
  "group flex items-center gap-3 rounded-card border border-transparent px-3 py-2 text-sm-2 font-medium text-text-secondary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-start)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] hover:border-border-subtle hover:bg-surface";
const activeLinkClass = "border-border-subtle bg-surface text-text-primary shadow-subtle/40";
const iconBaseClass =
  "flex h-9 w-9 items-center justify-center rounded-2xl border border-border-subtle/80 bg-surface-muted text-text-muted transition group-hover:border-ring-subtle group-hover:text-text-primary";
const iconActiveClass = "border-ring-subtle bg-accent-soft text-text-primary shadow-subtle";

export const SidebarNav = ({ items }: SidebarNavProps) => {
  const regularItems = items.filter((item) => !item.isAdmin);
  const adminItems = items.filter((item) => item.isAdmin);

  return (
    <nav className="space-y-1">
      {regularItems.map((item) => (
        <NavLink key={item.href} to={item.href} end={item.href === "/"} className={baseLinkClass} activeClassName={activeLinkClass}>
          {({ isActive }) => (
            <>
              <span className={cn(iconBaseClass, isActive && iconActiveClass)}>
                <item.icon className="h-4 w-4" />
              </span>
              <span>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}

      {adminItems.length > 0 ? (
          <div className="mt-4 border-t border-border-subtle/60 pt-4">
          {adminItems.map((item) => (
            <NavLink key={item.href} to={item.href} className={baseLinkClass} activeClassName={activeLinkClass}>
              {({ isActive }) => (
                <>
                  <span className={cn(iconBaseClass, isActive && iconActiveClass)}>
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                  </span>
                  <span>{item.label}</span>
                    <StatusPill tone="warning" className="ml-auto">
                      Admin
                    </StatusPill>
                </>
              )}
            </NavLink>
          ))}
        </div>
      ) : null}
    </nav>
  );
};
