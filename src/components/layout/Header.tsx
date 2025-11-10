import { useEffect, useState } from 'react';
import { Moon, Sun, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton';
import { NopCounter } from '@/components/wallet/NopCounter';
import { Container } from '@/components/layout/Container';
import { getTheme, toggleTheme, subscribeTheme, type ThemeMode } from '@/lib/theme';

export const Header = () => {
  const [mode, setMode] = useState<ThemeMode>(() => getTheme());

  useEffect(() => {
    setMode(getTheme());
    const unsubscribe = subscribeTheme(setMode);
    return () => {
      unsubscribe();
    };
  }, []);

  const handleToggle = () => {
    const next = toggleTheme();
    setMode(next);
  };

    return (
      <header
        className="sticky top-0 z-50 border-b backdrop-blur"
        style={{
          background: 'color-mix(in srgb, var(--bg-base) 92%, transparent)',
          borderColor: 'color-mix(in srgb, var(--ring) 35%, transparent)',
        }}
      >
        <Container>
          <div className="flex h-16 items-center justify-between gap-4 text-[color:var(--text-secondary)]">
            <div className="flex items-center gap-3">
              <img
                src="/logo.svg"
                alt="NopintelligenceLayer logo"
                className="h-10 w-10"
                loading="eager"
              />
              <div className="hidden flex-col leading-tight sm:flex">
                <span className="text-sm font-semibold text-[color:var(--text-primary)]">
                  NopintelligenceLayer
                </span>
                <span className="text-xs text-[color:var(--text-secondary)]">SocilFi-ai-chain</span>
              </div>
            </div>

            <div className="relative hidden flex-1 max-w-md md:block">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--menu-muted)]" />
              <Input
                placeholder="Search market intel…"
                className="h-11 rounded-full border-none pl-11 pr-4 text-sm shadow-inner focus-visible:ring-2"
                style={{
                  background: 'color-mix(in srgb, var(--bg-card) 90%, transparent)',
                  color: 'var(--text-primary)',
                  boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.06)',
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <NopCounter />
              <Button
                variant="ghost"
                size="icon"
                className="hidden h-9 w-9 rounded-full shadow-sm transition md:flex"
                style={{
                  border: '1px solid color-mix(in srgb, var(--ring) 50%, transparent)',
                  background: 'color-mix(in srgb, var(--bg-card) 88%, transparent)',
                  color: 'var(--text-secondary)',
                }}
                onClick={handleToggle}
                aria-label="Toggle theme"
                aria-pressed={mode === 'dark'}
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
                    className="h-9 w-9 rounded-full shadow-sm transition"
                    style={{
                      border: '1px solid color-mix(in srgb, var(--ring) 50%, transparent)',
                      background: 'color-mix(in srgb, var(--bg-card) 88%, transparent)',
                      color: 'var(--text-secondary)',
                    }}
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
