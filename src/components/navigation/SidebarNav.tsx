import type { CSSProperties } from 'react';
import { LucideIcon } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Badge } from '@/components/ui/badge';

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

  const hoverStyle = 'hover:bg-[var(--hover-bg)] hover:text-[var(--menu-active)]';

  const linkStyle = (isActive: boolean): CSSProperties & { '--hover-bg': string } => ({
    color: isActive ? 'var(--menu-active)' : 'var(--menu-item)',
    background: isActive ? 'var(--surface-subtle)' : 'transparent',
    borderColor: isActive ? 'var(--ring)' : 'transparent',
    '--hover-bg': 'color-mix(in srgb, var(--surface-subtle) 70%, transparent)',
  });

  const iconContainerStyle = (isActive: boolean): CSSProperties => ({
    borderColor: isActive
      ? 'color-mix(in srgb, var(--ring) 65%, transparent)'
      : 'color-mix(in srgb, var(--ring) 40%, transparent)',
    background: isActive
      ? 'color-mix(in srgb, var(--surface-subtle) 90%, transparent)'
      : 'color-mix(in srgb, var(--bg-card) 85%, transparent)',
    color: isActive ? 'var(--menu-active)' : 'color-mix(in srgb, var(--menu-muted) 70%, var(--menu-item))',
  });

  return (
    <nav className="space-y-1">
      {regularItems.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          end={item.href === '/'}
          className={`group flex h-10 items-center gap-3 rounded-[12px] border border-transparent px-3 text-sm transition ${hoverStyle}`}
          style={({ isActive }) => linkStyle(isActive)}
        >
          {({ isActive }) => (
            <>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-xl border shadow-sm transition"
                style={iconContainerStyle(isActive)}
              >
                <item.icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}

      {adminItems.length > 0 && (
        <div
          className="mt-4 border-t pt-4"
          style={{ borderColor: 'color-mix(in srgb, var(--ring) 30%, transparent)' }}
        >
          {adminItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={`group flex h-10 items-center gap-3 rounded-[12px] border border-transparent px-3 text-sm transition ${hoverStyle}`}
              style={({ isActive }) => linkStyle(isActive)}
            >
              {({ isActive }) => (
                <>
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl border shadow-sm transition"
                    style={iconContainerStyle(isActive)}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                  <Badge
                    variant="secondary"
                    className="ml-auto text-xs font-semibold"
                    style={{
                      background: 'color-mix(in srgb, var(--brand-gold) 18%, transparent)',
                      color: 'var(--menu-item)',
                      border: '1px solid color-mix(in srgb, var(--ring) 40%, transparent)',
                    }}
                  >
                    Admin
                  </Badge>
                </>
              )}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
};
