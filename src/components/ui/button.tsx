import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-manipulation",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-700 hover:to-cyan-600 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-95",
        accent:
          "bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-700 hover:to-cyan-600 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-95",
        outline:
          "border-2 border-border-subtle bg-transparent text-text-primary hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:border-cyan-600 dark:hover:bg-cyan-950/20",
        ghost: "bg-transparent text-text-secondary hover:bg-surface-muted hover:text-text-primary",
        subtle:
          "border border-border-subtle bg-surface-muted text-text-primary hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:border-cyan-700 dark:hover:bg-cyan-950/20",
        secondary:
          "border border-border-subtle bg-surface-muted text-text-primary hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:border-cyan-700 dark:hover:bg-cyan-950/20",
        destructive: "bg-red-600 text-white shadow-lg shadow-red-500/30 hover:bg-red-700 hover:shadow-xl hover:shadow-red-500/40 active:scale-95",
        link: "text-indigo-600 underline-offset-4 hover:text-indigo-700 hover:underline dark:text-cyan-400 dark:hover:text-cyan-300",
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
