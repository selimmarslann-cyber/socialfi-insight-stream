import { LucideIcon } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  isAdmin?: boolean;
}

interface SidebarNavProps {
  items: NavItem[];
}

export const SidebarNav = ({ items }: SidebarNavProps) => {
  const regularItems = items.filter((item) => !item.isAdmin);
  const adminItems = items.filter((item) => item.isAdmin);

  return (
    <nav className="space-y-1">
      {regularItems.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          end={item.href === '/'}
          className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-indigo-50 hover:text-slate-900"
          activeClassName="bg-white text-slate-900 shadow-sm ring-1 ring-indigo-500/20"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-indigo-500/15 bg-white text-indigo-600 shadow-sm transition group-hover:border-indigo-500/30 group-hover:text-indigo-700">
            <item.icon className="h-5 w-5" />
          </span>
          <span className="text-sm">{item.label}</span>
        </NavLink>
      ))}

      {adminItems.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          {adminItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-slate-500 transition hover:bg-indigo-50 hover:text-slate-900"
              activeClassName="bg-white text-slate-900 shadow-sm ring-1 ring-indigo-500/20"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-indigo-500/15 bg-white text-indigo-600 shadow-sm transition group-hover:border-indigo-500/30 group-hover:text-indigo-700">
                <item.icon className="h-5 w-5 flex-shrink-0" />
              </span>
              <span className="text-sm">{item.label}</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                Admin
              </Badge>
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
};
