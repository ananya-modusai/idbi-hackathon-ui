import { create } from 'zustand';

interface SidebarStore {
  shouldCloseSidebar: boolean;
  setShouldCloseSidebar: (value: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  shouldCloseSidebar: false,
  setShouldCloseSidebar: (value: boolean) => set({ shouldCloseSidebar: value }),
}));
