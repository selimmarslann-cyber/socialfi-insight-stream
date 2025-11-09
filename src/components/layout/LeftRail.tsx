import { Home, Compass, Wallet, Settings, Shield, Menu, LineChart, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SidebarNav } from '@/components/navigation/SidebarNav';
import { useAuthStore } from '@/lib/store';
import { BoostEventCard } from '@/components/side/BoostEventCard';
import { boostEvents } from '@/data/boost';

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Explore', href: '/explore', icon: Compass },
  { label: 'Contributes', href: '/contributes', icon: LineChart },
  { label: 'Wallet', href: '/wallet', icon: Wallet },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Games', href: '/games', icon: Gamepad2 },
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
        <aside
          className="sticky top-20 hidden h-[calc(100vh-5rem)] w-[280px] space-y-6 overflow-y-auto rounded-2xl p-3 backdrop-blur lg:block"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--ring)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
        <div className="space-y-6">
          <SidebarNav items={allNavItems} />
          <BoostEventCard events={boostEvents} />
        </div>
      </aside>

      {/* Mobile */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[280px] overflow-y-auto"
            style={{
              background: 'var(--bg-card)',
              borderRight: '1px solid var(--ring)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
          <div className="space-y-6 pt-6">
            <SidebarNav items={allNavItems} />
            <BoostEventCard events={boostEvents} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
