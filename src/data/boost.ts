import type { BoostEvent } from '@/types/admin';

export const boostEvents: BoostEvent[] = [
  {
    id: 'profile-complete',
    title: 'Complete your profile',
    badge: 'x2',
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    cta: {
      label: 'Go',
      href: '/settings/profile',
    },
  },
  {
    id: 'rate-contribution',
    title: 'Rate 1 contribution',
    badge: 'x2',
    expiresAt: new Date(Date.now() + 16 * 60 * 60 * 1000).toISOString(),
    cta: {
      label: 'Review',
      href: '/contributes',
    },
  },
  {
    id: 'visual-insight',
    title: 'Post a visual insight',
    badge: 'x3',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    cta: {
      label: 'Compose',
      href: '/explore',
    },
  },
];
