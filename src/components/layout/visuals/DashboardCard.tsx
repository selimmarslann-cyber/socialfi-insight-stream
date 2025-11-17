import * as React from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CardProps = React.ComponentProps<typeof Card>;

export function DashboardCard({ className, ...props }: CardProps) {
  return (
    <Card
      className={cn(
        "rounded-2xl bg-white dark:bg-[var(--color-surface-elevated)] shadow-[0_18px_45px_rgba(15,23,42,0.06)] dark:shadow-[0_22px_50px_rgba(0,0,0,0.55)]",
        "border border-slate-200/60 dark:border-white/10",
        "p-4 md:p-5",
        className,
      )}
      {...props}
    />
  );
}
