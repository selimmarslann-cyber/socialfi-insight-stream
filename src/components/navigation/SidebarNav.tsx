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
          className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors hover:bg-accent/10 text-foreground/80"
          activeClassName="font-medium text-accent bg-accent/10 border-l-2 border-accent"
        >
          <item.icon className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{item.label}</span>
        </NavLink>
      ))}

      {adminItems.length > 0 && (
        <div className="pt-4 mt-4 border-t border-border">
          {adminItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors hover:bg-accent/10 text-foreground/70 opacity-90 hover:opacity-100"
              activeClassName="font-medium text-accent bg-accent/10 border-l-2 border-accent opacity-100"
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
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
