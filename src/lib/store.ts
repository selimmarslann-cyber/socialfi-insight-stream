import { create } from 'zustand';

interface AppState {
  isPostComposerOpen: boolean;
  setPostComposerOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isPostComposerOpen: false,
  setPostComposerOpen: (open) => set({ isPostComposerOpen: open }),
}));
