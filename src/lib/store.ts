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

type LegacyConnectOptions =
  | number
  | {
      provider?: WalletProvider;
      inviterCode?: string;
      nop?: number;
      chainId?: number;
    };

interface WalletState {
  connected: boolean;
  address?: string;
  provider?: WalletProvider;
  refCode: string;
  inviterCode?: string;
  chainId?: number;
  usdt: number;
  nop: number;
  connect: (address: string, options?: LegacyConnectOptions) => void;
  disconnect: () => void;
  updateBalance: (usdt: number, nop: number) => void;
  setRefCode: (code: string) => void;
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
  provider: undefined,
  refCode: generateRefCode(),
  inviterCode: undefined,
  chainId: undefined,
  usdt: 0,
  nop: 0,
  connect: (address, options) =>
    set((state) => {
      const isNumberOption = typeof options === 'number';
      const provider =
        !isNumberOption && typeof options === 'object' ? options?.provider ?? state.provider : state.provider;
      const inviterCode =
        !isNumberOption && typeof options === 'object'
          ? options?.inviterCode ?? state.inviterCode
          : state.inviterCode;
      const nop =
        typeof options === 'object' && options?.nop !== undefined ? options.nop : state.nop;
      const chainId =
        isNumberOption ? options : typeof options === 'object' && options?.chainId !== undefined ? options.chainId : state.chainId;

      return {
        ...state,
      connected: true,
      address,
      provider,
      inviterCode,
        refCode: state.refCode || generateRefCode(),
        nop,
        chainId,
      };
    }),
  disconnect: () =>
    set((state) => ({
      ...state,
      connected: false,
      address: undefined,
      provider: undefined,
      inviterCode: undefined,
      refCode: state.refCode || generateRefCode(),
      chainId: undefined,
    })),
  updateBalance: (usdt, nop) => set({ usdt, nop }),
  setRefCode: (code) =>
    set({ refCode: code.startsWith('nop') ? code : `nop${code}` }),
  setChainId: (chainId) => set({ chainId }),
}));
