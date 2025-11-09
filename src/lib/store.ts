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
  chainId?: number;
  connect: (address: string, chainId?: number) => void;
  disconnect: () => void;
  updateBalance: (usdt: number, nop: number) => void;
  setChainId: (chainId?: number) => void;
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
  chainId: undefined,
  connect: (address, chainId) => set({ connected: true, address, chainId }),
  disconnect: () => set({ connected: false, address: undefined, chainId: undefined }),
  updateBalance: (usdt, nop) => set({ usdt, nop }),
  setChainId: (chainId) => set({ chainId }),
}));
