import * as React from "react";

import { cn } from "@/lib/utils";

type DashboardSectionTitleProps = {
  label?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function DashboardSectionTitle({
  label,
  title,
  description,
  action,
  className,
}: DashboardSectionTitleProps) {
  return (
    <div className={cn("mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex flex-col gap-1">
        {label && (
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted">
            {label}
          </div>
        )}
        <div className="text-lg-2 font-semibold text-text-primary">{title}</div>
        {description && (
          <p className="text-sm-2 leading-snug text-text-secondary">{description}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
