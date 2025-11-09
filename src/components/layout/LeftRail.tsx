import { Home, Compass, Wallet, Settings, Shield, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { TopGainers } from '@/components/widgets/TopGainers';
import { SidebarNav } from '@/components/navigation/SidebarNav';
import { useAuthStore } from '@/lib/store';

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Explore', href: '/explore', icon: Compass },
  { label: 'Wallet', href: '/wallet', icon: Wallet },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export const LeftRail = () => {
  const { isAdmin } = useAuthStore();

  const allNavItems = [
    ...navItems,
    ...(isAdmin
      ? [{ label: 'Admin Panel', href: '/admin', icon: Shield, isAdmin: true }]
      : []),
  ];

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block w-[280px] space-y-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto pb-8">
        <div className="space-y-6">
          <SidebarNav items={allNavItems} />
          <TopGainers />
        </div>
      </aside>

      {/* Mobile */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] overflow-y-auto">
          <div className="space-y-6 pt-6">
            <SidebarNav items={allNavItems} />
            <TopGainers />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
