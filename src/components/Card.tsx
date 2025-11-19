import React from "react";

type CardProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  error?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
};

export default function Card({ title, subtitle, right, error, onRetry, children }: CardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card-soft">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-semibold text-foreground">{title}</div>
          {subtitle ? <div className="text-xs text-muted-foreground">{subtitle}</div> : null}
        </div>
        <div className="flex items-center gap-2 text-sm">
          {right ? <div>{right}</div> : null}
          {error && onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="text-sm font-semibold text-indigo-400 underline-offset-4 hover:underline"
            >
              Retry
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-3 text-sm text-muted-foreground">
        {error ? <div className="text-sm font-medium text-destructive">{error}</div> : children}
      </div>
    </div>
  );
}
