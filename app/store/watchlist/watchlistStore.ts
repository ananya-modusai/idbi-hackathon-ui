import { create } from 'zustand';
import { watchlistService, WatchlistItem } from '@/app/services/watchlistServices';

interface WatchlistState {
  watchlists: Record<string, WatchlistItem[]>;
  loadingOrgs: Record<string, boolean>;
  error: string | null;
  fetchWatchlist: (organizationId: string) => Promise<void>;
  getWatchlist: (organizationId: string) => WatchlistItem[] | undefined;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  watchlists: {},
  loadingOrgs: {},
  error: null,

  getWatchlist: (organizationId: string) => {
    const state = get();
    return state.watchlists[organizationId];
  },

  fetchWatchlist: async (organizationId: string) => {
    if (!organizationId) return;

    const state = get();
    // If we already have data or a fetch in progress for this org, don't fetch again
    if (state.watchlists[organizationId] || state.loadingOrgs[organizationId]) {
      return;
    }

    set(state => ({ loadingOrgs: { ...state.loadingOrgs, [organizationId]: true }, error: null }));

    try {
      const result = await watchlistService.getOrganizationWatchlist(organizationId);
      if (result.success && result.data) {
        set(state => ({ watchlists: { ...state.watchlists, [organizationId]: result.data } }));
      } else {
        set({ error: result.error || 'Failed to fetch watchlist' });
      }
    } catch (error) {
      console.error('Error fetching watchlist in store:', error);
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      set(state => ({ loadingOrgs: { ...state.loadingOrgs, [organizationId]: false } }));
    }
  }
}));

export default useWatchlistStore;
