import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import type { BoostEvent } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  SIDE_CARD_CLASS,
  SIDE_CARD_TITLE_CLASS,
} from '@/components/side/common';

const GOLD_CHIP_CLASS =
  'inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-500/30';

const LIST_ITEM_CLASS =
  'flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-2 transition hover:border-indigo-400/70 hover:bg-indigo-50/60';

const EMPTY_STATE_CLASS =
  'rounded-xl border border-dashed border-slate-200/80 bg-slate-50 px-3 py-6 text-center text-xs text-slate-500';

export interface BoostEventCardProps {
  title?: string;
  events?: BoostEvent[];
  className?: string;
}

const formatCountdown = (expiresAt: string) => {
  const expires = new Date(expiresAt).getTime();
  if (Number.isNaN(expires)) {
    return null;
  }

  const diffMinutes = Math.max(0, Math.round((expires - Date.now()) / 60_000));
  if (diffMinutes === 0) {
    return 'Ends soon';
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours === 0) {
    return `Ends in ${minutes}m`;
  }

  if (minutes === 0) {
    return `Ends in ${hours}h`;
  }

  return `Ends in ${hours}h ${minutes}m`;
};

const BoostBadge = ({ children }: PropsWithChildren) => (
  <span className={GOLD_CHIP_CLASS}>{children}</span>
);

export const BoostEventCard = ({
  title = 'Boosted Tasks',
  events = [],
  className,
}: BoostEventCardProps) => {
  const upcoming = events.slice(0, 3);
  const nearestExpiry = upcoming.reduce<Date | null>((acc, item) => {
    const expires = new Date(item.expiresAt);
    if (Number.isNaN(expires.getTime())) {
      return acc;
    }
    if (!acc) {
      return expires;
    }
    return expires < acc ? expires : acc;
  }, null);

  const countdownLabel = nearestExpiry
    ? formatCountdown(nearestExpiry.toISOString())
    : null;

  return (
    <section className={cn(SIDE_CARD_CLASS, className)}>
      <header className="mb-4 flex items-center justify-between">
        <h3 className={SIDE_CARD_TITLE_CLASS}>
          <Sparkles className="h-4 w-4 text-indigo-500" />
          {title}
        </h3>
        <BoostBadge>x2 NOP</BoostBadge>
      </header>

      {upcoming.length === 0 ? (
        <p className={EMPTY_STATE_CLASS}>
          No active boost. Check back soon.
        </p>
      ) : (
        <div className="space-y-2.5">
          {upcoming.map((event) => (
            <div key={event.id} className={LIST_ITEM_CLASS}>
              <div className="flex items-center gap-3">
                {event.icon ? (
                  <span className="text-indigo-500">{event.icon}</span>
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-semibold text-indigo-600">
                    {event.badge ?? 'x2'}
                  </span>
                )}
                <span className="text-sm font-medium text-slate-700">
                  {event.title}
                </span>
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="gap-1 text-indigo-600 hover:bg-indigo-100/70"
              >
                <Link to={event.cta.href} aria-label={event.cta.label}>
                  {event.cta.label}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}

      <footer className="mt-4 text-xs text-slate-500">
        {countdownLabel ? (
          <span>{countdownLabel}</span>
        ) : (
          <span className="text-slate-400">Boost timers update hourly</span>
        )}
      </footer>
    </section>
  );
};
