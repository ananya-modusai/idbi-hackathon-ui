import { create } from 'zustand';
import { ActiveContextKey, ActiveContextType } from './types';

interface IdbiActiveContextStore {
  activeContexts: ActiveContextType;
  setContext: (type: ActiveContextKey, value: string | null) => void;
  clearContexts: () => void;
}

/**
 * The IDBI workspace's own active-context store — deliberately separate from the
 * boilerplate's app/store/activeContextStore, which carries the donor project's
 * URL-sync and eight domain contexts.
 */
export const useIdbiActiveContextStore = create<IdbiActiveContextStore>((set) => ({
  activeContexts: {},
  setContext: (type, value) => {
    set(state => {
      // Avoid redundant updates if the value is unchanged
      if (state.activeContexts[type] === value) return state;
      return { activeContexts: { ...state.activeContexts, [type]: value } };
    });
  },
  clearContexts: () => set({ activeContexts: {} }),
}));
