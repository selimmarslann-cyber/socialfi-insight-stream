import { Moon, Sun, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton';
import { NopCounter } from '@/components/wallet/NopCounter';
import { Container } from '@/components/layout/Container';

export const Header = () => {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-indigo-500/10 bg-[#F5F8FF]/90 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--brand-gradient)] text-sm font-semibold text-white shadow">
              N
            </div>
            <div className="hidden flex-col leading-tight sm:flex">
              <span className="text-sm font-semibold text-slate-900">NOP Intelligence</span>
              <span className="text-xs text-slate-500">SocialFi research desk</span>
            </div>
          </div>

          <div className="relative hidden flex-1 max-w-md md:block">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search market intel…"
              className="h-11 rounded-full border-none bg-white/80 pl-11 pr-4 text-sm shadow-inner focus-visible:ring-2 focus-visible:ring-indigo-200"
            />
          </div>

          <div className="flex items-center gap-2">
            <NopCounter />
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-9 w-9 rounded-full border border-indigo-500/10 bg-white/80 text-slate-600 shadow-sm hover:bg-white md:flex"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <WalletConnectButton />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="User menu"
                  className="h-9 w-9 rounded-full border border-indigo-500/10 bg-white/80 text-slate-600 shadow-sm hover:bg-white"
                >
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Container>
    </header>
  );
};
