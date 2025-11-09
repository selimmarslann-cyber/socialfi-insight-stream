import type { BoostConfig } from '@/types/rewards';

export const boostEvents: BoostConfig[] = [
  {
    key: 'signup',
    title: 'Üye ol',
    reward: 2000,
    href: '/signup',
  },
  {
    key: 'deposit',
    title: 'Deposit NOP',
    reward: 5000,
    href: '/wallet?tab=deposit',
  },
  {
    key: 'contribute',
    title: 'Katkı yap',
    reward: 3000,
    href: '/contributes',
  },
];
