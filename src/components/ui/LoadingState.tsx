import { cn } from "@/lib/utils";

type LoadingStateProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
};

export function LoadingState({ size = "md", className, text }: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-border-subtle border-t-indigo-600",
          sizeClasses[size]
        )}
      />
      {text && <p className="text-sm text-text-secondary">{text}</p>}
    </div>
  );
}

type SkeletonProps = {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
};

export function Skeleton({ className, variant = "rectangular" }: SkeletonProps) {
  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-xl",
  };

  return (
    <div
      className={cn(
        "skeleton bg-surface-muted",
        variantClasses[variant],
        className
      )}
    />
  );
}

