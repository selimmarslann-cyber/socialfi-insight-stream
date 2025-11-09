import { create } from 'zustand';

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
  usdt: 0,
  nop: 0,
  chainId: undefined,
  connect: (address, chainId) => set({ connected: true, address, chainId }),
  disconnect: () => set({ connected: false, address: undefined, chainId: undefined }),
  updateBalance: (usdt, nop) => set({ usdt, nop }),
  setChainId: (chainId) => set({ chainId }),
}));
