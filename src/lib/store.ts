import { create } from 'zustand';
import { generateRefCode } from '@/lib/utils';

interface AppState {
  isPostComposerOpen: boolean;
  setPostComposerOpen: (open: boolean) => void;
}

const ADMIN_SESSION_KEY = "nop_admin_session";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "adminadmin";

interface AuthState {
  isAdmin: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
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
// Tip: options hem number (chainId) hem de obje olabilir
type LegacyConnectOptions = {
  provider?: WalletProvider;
  inviterCode?: string;
  nop?: number;
  chainId?: number;
};

connect: (address: string, options?: number | LegacyConnectOptions) => void;
disconnect: () => void;
updateBalance: (usdt: number, nop: number) => void;
setRefCode: (code: string) => void;
setChainId: (chainId?: number) => void;

  setChainId: (chainId?: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isPostComposerOpen: false,
  setPostComposerOpen: (open) => set({ isPostComposerOpen: open }),
}));

const getInitialAdminState = () => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ADMIN_SESSION_KEY) === "true";
};

export const useAuthStore = create<AuthState>((set) => ({
  isAdmin: getInitialAdminState(),
  login: (username, password) => {
    const success = username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
    if (success) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ADMIN_SESSION_KEY, "true");
      }
      set({ isAdmin: true });
    } else {
      set({ isAdmin: false });
    }
    return success;
  },
  logout: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ADMIN_SESSION_KEY);
    }
    set({ isAdmin: false });
  },
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
// ... state'in üst kısmı aynı kalsın
// başlangıç state'inde chainId: undefined olduğundan emin ol

connect: (address, options) =>
  set((state) => {
    // options hem number (chainId) hem de object olabilir
    const isNumberOption = typeof options === 'number';

    const provider =
      !isNumberOption && typeof options === 'object'
        ? options?.provider ?? state.provider
        : state.provider;

    const inviterCode =
      !isNumberOption && typeof options === 'object'
        ? options?.inviterCode ?? state.inviterCode
        : state.inviterCode;

    const nop =
      typeof options === 'object' && options?.nop !== undefined
        ? options.nop
        : state.nop;

    const chainId = isNumberOption
      ? (options as number)
      : typeof options === 'object' && options?.chainId !== undefined
      ? options.chainId
      : state.chainId;

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
  set({
    refCode: code?.toLowerCase().startsWith('nop') ? code : `nop${code}`,
  }),

setChainId: (chainId) => set({ chainId }),

  setChainId: (chainId) => set({ chainId }),
}));
