import { create } from 'zustand';
import { generateRefCode } from '@/lib/utils';

interface AppState {
  isPostComposerOpen: boolean;
  setPostComposerOpen: (open: boolean) => void;
}

interface AuthState {
  isAdmin: boolean;
}

type WalletProvider = 'metamask' | 'trust' | 'email';

interface WalletState {
  connected: boolean;
  address?: string;
  provider?: WalletProvider;
  refCode: string;
  inviterCode?: string;
  usdt: number;
  nop: number;
  connect: (payload: { address: string; provider: WalletProvider; inviterCode?: string }) => void;
  disconnect: () => void;
  updateBalance: (usdt: number, nop: number) => void;
  setRefCode: (code: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isPostComposerOpen: false,
  setPostComposerOpen: (open) => set({ isPostComposerOpen: open }),
}));

export const useAuthStore = create<AuthState>(() => ({
  isAdmin: import.meta.env.VITE_IS_ADMIN === 'true',
}));

export const useWalletStore = create<WalletState>((set) => ({
  connected: false,
  address: undefined,
  provider: undefined,
  refCode: generateRefCode(),
  inviterCode: undefined,
  usdt: 0,
  nop: 0,
  connect: ({ address, provider, inviterCode }) =>
    set((state) => ({
      connected: true,
      address,
      provider,
      inviterCode,
      refCode: state.refCode || generateRefCode(),
    })),
  disconnect: () =>
    set((state) => ({
      connected: false,
      address: undefined,
      provider: undefined,
      inviterCode: undefined,
      refCode: state.refCode || generateRefCode(),
    })),
  updateBalance: (usdt, nop) => set({ usdt, nop }),
  setRefCode: (code) =>
    set({ refCode: code.startsWith('nop') ? code : `nop${code}` }),
}));
