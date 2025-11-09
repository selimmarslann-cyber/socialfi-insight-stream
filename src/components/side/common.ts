import type { CSSProperties } from 'react';

export const SIDE_CARD_CLASS = 'rounded-2xl p-4 transition-colors';
export const SIDE_CARD_STYLE: CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid color-mix(in srgb, var(--ring) 40%, transparent)',
  boxShadow: 'var(--shadow-card)',
};

export const SIDE_CARD_TITLE_CLASS =
  'text-sm font-semibold flex items-center gap-2 text-[color:var(--text-secondary)]';

export const SIDE_SKELETON_CLASS =
  'animate-pulse bg-[color:color-mix(in_srgb,var(--surface-subtle)80%,transparent)] rounded-md h-[14px]';
