import * as React from "react";

import { cn } from "@/lib/utils";

type StatusTone = "default" | "success" | "warning" | "muted" | "danger";

const toneClasses: Record<StatusTone, string> = {
  default: "bg-accent-soft text-text-primary",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  muted: "bg-surface-muted text-text-muted ring-1 ring-border-subtle/60",
  danger: "bg-error/10 text-error ring-1 ring-error/20",
};

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
}

export function StatusPill({ tone = "default", className, children, ...props }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-[11px] font-medium tabular-nums",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
