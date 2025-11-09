import { create } from 'zustand';

interface AppState {
  isPostComposerOpen: boolean;
  setPostComposerOpen: (open: boolean) => void;
}

interface AuthState {
  isAdmin: boolean;
}

interface WalletState {
  connected: boolean;
  address?: string;
  usdt: number;
  nop: number;
  connect: (address: string) => void;
  disconnect: () => void;
  updateBalance: (usdt: number, nop: number) => void;
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
  usdt: 0,
  nop: 0,
  connect: (address) => set({ connected: true, address }),
  disconnect: () => set({ connected: false, address: undefined }),
  updateBalance: (usdt, nop) => set({ usdt, nop }),
}));
