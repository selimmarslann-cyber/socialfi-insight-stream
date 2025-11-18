import * as React from "react";

import { cn } from "@/lib/utils";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
          "flex min-h-[96px] w-full rounded-[12px] border border-border-subtle bg-surface px-4 py-3 text-sm-2 text-text-primary transition-colors",
          "placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-start)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",
          "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
