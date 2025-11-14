import { create } from 'zustand';
import { generateRefCode } from '@/lib/utils';
import type { WalletTx } from '@/types/wallet';
import type { Post } from '@/types/feed';

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
  transactions: WalletTx[];
  connect: (address: string, options?: LegacyConnectOptions) => void;
  disconnect: () => void;
  updateBalance: (usdt: number, nop: number) => void;
  grantNop: (amount: number) => void;
  setRefCode: (code: string) => void;
  setChainId: (chainId?: number) => void;
  addTx: (tx: WalletTx) => void;
}

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
  transactions: [
    {
      id: 'tx-1',
      hash: '0x79fa...92c1',
      type: 'deposit',
      asset: 'USDT',
      amount: 1200,
      direction: 'in',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      status: 'completed',
      counterparty: 'Binance',
    },
    {
      id: 'tx-2',
      hash: '0xa93d...6b0f',
      type: 'buy',
      asset: 'NOP',
      amount: 8600,
      direction: 'in',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      status: 'completed',
      counterparty: 'NOP DEX',
      note: 'Market buy',
    },
    {
      id: 'tx-3',
      hash: '0x4ceb...e66d',
      type: 'send',
      asset: 'USDT',
      amount: 420,
      direction: 'out',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      status: 'pending',
      counterparty: '0x6DFb...ee12',
    },
  ],
  connect: (address, options) =>
    set((state) => {
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
  grantNop: (amount) =>
    set((state) => ({
      nop: Math.max(0, (state.nop ?? 0) + amount),
    })),
  setRefCode: (code) =>
    set({
      refCode: code?.toLowerCase().startsWith('nop') ? code : `nop${code}`,
    }),
  setChainId: (chainId) => set({ chainId }),
  addTx: (tx) =>
    set((state) => ({
      transactions: [tx, ...state.transactions].slice(0, 25),
    })),
}));

interface FeedState {
  userPosts: Post[];
  prependPost: (post: Post) => void;
  clearUserPosts: () => void;
  removePost: (postId: string) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  userPosts: [],
  prependPost: (post) =>
    set((state) => {
      const filtered = state.userPosts.filter((item) => item.id !== post.id);
      return {
        userPosts: [post, ...filtered].slice(0, 30),
      };
    }),
  clearUserPosts: () => set({ userPosts: [] }),
  removePost: (postId) =>
    set((state) => ({
      userPosts: state.userPosts.filter((post) => post.id !== postId),
    })),
}));
