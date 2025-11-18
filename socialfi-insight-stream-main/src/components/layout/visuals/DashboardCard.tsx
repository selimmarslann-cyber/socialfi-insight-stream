import * as React from "react";

import { cn } from "@/lib/utils";

type DashboardCardProps = React.HTMLAttributes<HTMLDivElement>;

export const DashboardCard = React.forwardRef<HTMLDivElement, DashboardCardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-card border border-border-subtle bg-surface shadow-subtle",
          "px-4 py-3 sm:px-5 sm:py-4",
          "backdrop-blur-sm",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

DashboardCard.displayName = "DashboardCard";
