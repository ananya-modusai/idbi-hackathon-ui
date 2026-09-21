import { create } from "zustand";
import { merchantService } from "@/app/services/merchantServices";

interface MerchantVersionsStore {
  versions: Record<string, any[]>;
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
  fetchVersions: (merchantId: string) => Promise<any[]>;
}

// Module-level variable to track ongoing requests across all hook instances
const fetchPromises: Record<string, Promise<any[]> | undefined> = {};

export const useMerchantVersionsStore = create<MerchantVersionsStore>((set, get) => ({
  versions: {},
  loading: {},
  error: {},
  
  fetchVersions: async (merchantId: string) => {
    if (!merchantId) return [];
    
    // 1. Return cached versions if available
    const state = get();
    if (state.versions[merchantId]) {
      return state.versions[merchantId];
    }
    
    // 2. If a request is already in flight for this merchantId, return that promise
    if (fetchPromises[merchantId]) {
      return fetchPromises[merchantId];
    }
    
    // 3. Create a new request and store its promise
    fetchPromises[merchantId] = (async () => {
      try {
        set((state) => ({
          loading: { ...state.loading, [merchantId]: true },
          error: { ...state.error, [merchantId]: null }
        }));
        
        const response = await merchantService.getMerchantVersions(merchantId);
        const versions = response.success && response.versions ? response.versions : (Array.isArray(response) ? response : []);
        
        set((state) => ({
          versions: { ...state.versions, [merchantId]: versions },
          loading: { ...state.loading, [merchantId]: false }
        }));
        
        return versions;
      } catch (error) {
        console.error('Error in fetchVersions:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch merchant versions';
        set((state) => ({
          error: { ...state.error, [merchantId]: errorMessage },
          loading: { ...state.loading, [merchantId]: false }
        }));
        return [];
      } finally {
        // Clean up the promise map once the request is done
        delete fetchPromises[merchantId];
      }
    })();
    
    return fetchPromises[merchantId];
  },
}));
