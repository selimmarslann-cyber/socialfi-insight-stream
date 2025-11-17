import * as React from "react";

type DashboardSectionTitleProps = {
  label?: string;
  title: string;
  action?: React.ReactNode;
};

export function DashboardSectionTitle({ label, title, action }: DashboardSectionTitleProps) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div>
        {label && (
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            {label}
          </div>
        )}
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white md:text-base">{title}</h2>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
