import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-start)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-slate-900 text-white shadow-soft hover:bg-slate-800 active:bg-slate-900",
        accent:
          "bg-[radial-gradient(circle_at_top_left,#4F46E5,#06B6D4)] text-white shadow-soft hover:brightness-105",
        outline:
          "border border-border-subtle bg-surface text-text-primary hover:bg-surface-muted",
        ghost: "bg-transparent text-text-secondary hover:bg-accent-soft",
        subtle:
          "border border-transparent bg-surface-muted text-text-primary hover:border-border-subtle",
        secondary:
          "border border-transparent bg-surface-muted text-text-primary hover:border-border-subtle",
        destructive: "bg-error text-white shadow-subtle hover:bg-[#dc2626]",
        link: "text-text-primary underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 px-3 text-[11px]",
        sm: "h-8 px-3.5 text-xs",
        md: "h-9 px-4 text-sm-2",
        lg: "h-10 px-5 text-sm-2",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
