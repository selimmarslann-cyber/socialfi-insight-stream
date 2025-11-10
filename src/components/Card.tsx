import React from "react";

type CardProps = {
  title: string;
  subtitle?: string;
  error?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
};

export default function Card({ title, subtitle, error, onRetry, children }: CardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-semibold text-slate-800">{title}</div>
          {subtitle ? <div className="text-xs text-slate-500">{subtitle}</div> : null}
        </div>
        {error && onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="text-sm font-semibold text-indigo-600 underline-offset-4 hover:underline"
          >
            Retry
          </button>
        ) : null}
      </div>
      <div className="mt-3 text-sm text-slate-700">
        {error ? <div className="text-sm font-medium text-rose-600">{error}</div> : children}
      </div>
    </div>
  );
}
