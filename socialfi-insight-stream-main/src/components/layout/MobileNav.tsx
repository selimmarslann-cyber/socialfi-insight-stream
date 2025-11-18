import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/explore", label: "Explore" },
  { to: "/contributes", label: "Contributes" },
  { to: "/wallet", label: "Wallet" },
  { to: "/burn", label: "Burn" },
  { to: "/docs", label: "Docs" },
  { to: "/settings", label: "Settings" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-surface text-text-primary shadow-subtle transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-subtle md:hidden"
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={close}>
          <div
            className="absolute inset-y-0 left-0 w-72 max-w-[80%] border-r border-border-subtle bg-background-elevated shadow-soft"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
              <span className="text-sm-2 font-semibold text-text-primary">NOP Intelligence</span>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={close}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle bg-surface text-text-primary"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 px-3 py-3">
              {navItems.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={close}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-sm-2 transition",
                      active ? "bg-accent-soft text-text-primary" : "text-text-secondary hover:bg-surface-muted",
                    )}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
