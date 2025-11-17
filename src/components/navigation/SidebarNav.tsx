import { LucideIcon } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Badge } from "@/components/ui/badge";
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
  "group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-sm font-medium text-slate-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-100 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]";
const activeLinkClass = "bg-white text-slate-900 border-slate-200 shadow-sm";
const iconBaseClass =
  "flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200/60 bg-white/80 text-slate-500 transition group-hover:border-indigo-200 group-hover:text-indigo-600";
const iconActiveClass = "border-indigo-200 bg-indigo-50 text-indigo-600 shadow-sm";

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
        <div className="mt-4 border-t border-slate-100 pt-4">
          {adminItems.map((item) => (
            <NavLink key={item.href} to={item.href} className={baseLinkClass} activeClassName={activeLinkClass}>
              {({ isActive }) => (
                <>
                  <span className={cn(iconBaseClass, isActive && iconActiveClass)}>
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                  </span>
                  <span>{item.label}</span>
                  <Badge className="ml-auto rounded-full border border-amber-200/70 bg-amber-50/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-600">
                    Admin
                  </Badge>
                </>
              )}
            </NavLink>
          ))}
        </div>
      ) : null}
    </nav>
  );
};
