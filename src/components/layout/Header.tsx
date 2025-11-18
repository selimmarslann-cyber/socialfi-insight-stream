import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, Search, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { NopHeaderCounter } from "@/components/wallet/NopHeaderCounter";
import { Container } from "@/components/layout/Container";
import {
  getThemePreference,
  getSystem,
  toggleTheme,
  subscribeTheme,
  type ThemePreference,
} from "@/lib/theme";

export const Header = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ThemePreference>(() => getThemePreference());

  useEffect(() => {
    setMode(getThemePreference());
    const unsubscribe = subscribeTheme(setMode);
    return () => {
      unsubscribe();
    };
  }, []);

  const handleToggle = () => {
    const next = toggleTheme();
    setMode(next);
  };

  const resolvedMode = mode === "system" ? getSystem() : mode;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur dark:border-white/10 dark:bg-slate-900/80">
      <Container>
        <div className="flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="NOP Intelligence Layer" className="h-10 w-10" loading="eager" />
            <div className="hidden flex-col leading-tight md:flex">
                <span className="text-sm font-semibold text-slate-900">NOP Intelligence</span>
                <span className="text-xs text-slate-500">SocialFi research dashboard</span>
            </div>
          </div>

          <div className="relative hidden h-10 flex-1 max-w-md md:block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search market intel…"
              className="h-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-indigo-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <NopHeaderCounter />
            <Button
              variant="outline"
              size="icon"
              className="hidden h-9 w-9 rounded-full border-slate-200/70 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-white/20 dark:bg-white/10 md:flex"
              onClick={handleToggle}
              aria-label="Toggle theme"
              aria-pressed={resolvedMode === "dark"}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <WalletConnectButton />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="User menu"
                  className="h-9 w-9 rounded-full border-slate-200/70 bg-white/90 text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-white/20 dark:bg-white/10"
                >
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => toast.info("Profile customization is coming soon.")}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate("/settings")}>Settings</DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => toast.info("Sign out flow will be enabled with SafeAuth.")}
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Container>
    </header>
  );
};
