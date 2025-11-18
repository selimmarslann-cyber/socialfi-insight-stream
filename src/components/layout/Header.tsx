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
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-[rgba(245,248,255,0.92)] shadow-[0_6px_20px_rgba(15,23,42,0.08)] backdrop-blur-md">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-pill border border-border-subtle/70 bg-white/80 px-2 py-1 shadow-subtle/40">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface ring-2 ring-ring-subtle/60">
                <img src="/logo.svg" alt="NOP Intelligence Layer" className="h-6 w-6" loading="eager" />
              </div>
              <div className="hidden flex-col leading-tight text-left md:flex">
                <span className="text-sm-2 font-semibold text-text-primary">NOP Intelligence</span>
                <span className="text-xs-2 text-text-secondary">SocialFi research dashboard</span>
              </div>
            </div>
          </div>

          <div className="relative hidden h-10 max-w-md flex-1 md:block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              placeholder="Search market intel…"
              className="h-full border border-border-subtle/60 bg-surface pl-11 pr-4 text-sm-2 shadow-subtle/10 placeholder:text-text-muted"
            />
          </div>

          <div className="flex items-center gap-2">
            <NopHeaderCounter />
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-10 w-10 rounded-full border border-border-subtle/70 bg-surface text-text-secondary shadow-subtle/30 hover:text-text-primary md:flex"
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
                  variant="ghost"
                  size="icon"
                  aria-label="User menu"
                  className="h-10 w-10 rounded-full border border-border-subtle/70 bg-surface text-text-secondary shadow-subtle/30 hover:text-text-primary"
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
