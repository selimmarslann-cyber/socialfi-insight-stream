import { useEffect, useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  SIDE_CARD_CLASS,
  SIDE_CARD_TITLE_CLASS,
  SIDE_CARD_STYLE,
} from '@/components/side/common';
import { boostEvents } from '@/data/boost';
import type { BoostConfig, BoostKey } from '@/types/rewards';
import { hasClaimed, markClaimed } from '@/lib/rewards';
import { useWalletStore } from '@/lib/store';

const CTA_LABELS: Record<BoostKey, string> = {
  signup: 'Go',
  deposit: 'Go',
  contribute: 'Review',
};

export interface BoostEventCardProps {
  title?: string;
  events?: BoostConfig[];
  className?: string;
}

type ClaimState = Record<BoostKey, boolean>;

const rewardBadgeStyle = (claimed: boolean) => ({
  background: claimed
    ? 'color-mix(in srgb, var(--surface-subtle) 70%, transparent)'
    : 'color-mix(in srgb, var(--brand-gold) 30%, transparent)',
  color: claimed ? 'var(--menu-muted)' : 'var(--menu-item)',
  border: claimed
    ? '1px solid color-mix(in srgb, var(--ring) 35%, transparent)'
    : '1px solid color-mix(in srgb, var(--brand-gold) 40%, transparent)',
});

const actionRowStyle = {
  background: 'color-mix(in srgb, var(--surface-subtle) 60%, transparent)',
  border: '1px solid color-mix(in srgb, var(--ring) 30%, transparent)',
};

const computeClaims = (user: string, items: BoostConfig[]): ClaimState =>
  items.reduce<ClaimState>(
    (acc, item) => ({
      ...acc,
      [item.key]: hasClaimed(user, item.key),
    }),
    { signup: false, deposit: false, contribute: false },
  );

export const BoostEventCard = ({
  title = 'Boosted Tasks',
  events = boostEvents,
  className,
}: BoostEventCardProps) => {
  const connected = useWalletStore((state) => state.connected);
  const address = useWalletStore((state) => state.address);
  const grantNop = useWalletStore((state) => state.grantNop);

  const userId = address ?? 'guest';

  const [claimed, setClaimed] = useState<ClaimState>(() =>
    computeClaims(userId, events),
  );

  useEffect(() => {
    setClaimed(computeClaims(userId, events));
  }, [userId, events]);

  const activeEvents = useMemo(() => events.slice(0, 3), [events]);

  const handleAction =
    (item: BoostConfig) => (event: MouseEvent<HTMLAnchorElement>) => {
      if (['deposit', 'contribute'].includes(item.key) && !connected) {
        event.preventDefault();
        toast.warning('Önce cüzdanını bağla');
        return;
      }

      if (claimed[item.key]) {
        toast.info('Bu ödül zaten alındı');
        return;
      }

      grantNop?.(item.reward);
      markClaimed(userId, item.key);
      setClaimed((prev) => ({ ...prev, [item.key]: true }));
      toast.success(`+${item.reward} NOP eklendi (tek seferlik)`);
    };

  return (
    <section className={cn(SIDE_CARD_CLASS, className)} style={SIDE_CARD_STYLE}>
      <header className="mb-4 flex items-center justify-between text-[color:var(--text-primary)]">
        <h3 className={SIDE_CARD_TITLE_CLASS}>
          <Sparkles className="h-4 w-4 text-[var(--brand-to)]" />
          {title}
        </h3>
        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--menu-item)]" style={rewardBadgeStyle(false)}>
          3 görev
        </span>
      </header>

      <div className="space-y-2.5">
        {activeEvents.map((item) => {
          const isClaimed = claimed[item.key];
          return (
            <div
              key={item.key}
              className="flex items-center justify-between gap-3 rounded-xl border px-3 py-3 transition"
              style={actionRowStyle}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-[color:var(--text-primary)]">
                  {item.title}
                </span>
                {isClaimed ? (
                  <span className="text-xs text-[color:var(--menu-muted)]">Ödül alındı</span>
                ) : (
                  <span className="text-xs text-[color:var(--menu-muted)]">Tek seferlik bonus</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={rewardBadgeStyle(isClaimed)}
                >
                  +{item.reward.toLocaleString('tr-TR')} NOP
                </span>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-[color:var(--menu-active)]"
                >
                  <Link to={item.href} onClick={handleAction(item)}>
                    {isClaimed ? 'View' : CTA_LABELS[item.key]}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
