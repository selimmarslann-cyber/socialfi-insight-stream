import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
            "flex h-9 w-full rounded-pill border border-border-subtle bg-surface px-3 text-sm-2 text-text-primary transition-colors",
            "placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-start)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",
            "disabled:cursor-not-allowed disabled:opacity-60 sm:h-10",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-primary",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
