import { create } from "zustand";
import { customerService } from "@/app/services/customerServices";

interface CustomerIdStore {
  customerIdList: { value: string; label: string; _raw?: any }[];
  totalPages: number;
  totalHighRiskCount: number;
  totalMediumRiskCount: number;
  totalLowRiskCount: number;
  totalCachedCount: number;
  totalUncachedCount: number;
  loading: boolean;
  error: string | null;
  fetchCustomerIdList: (nameOrId?: string, page?: number, append?: boolean, sortBy?: string, sortOrder?: string, force?: boolean, status?: string, cachedStatus?: boolean) => Promise<void>;
}

export const useCustomerIdStore = create<CustomerIdStore>((set, get) => ({
  customerIdList: [],
  totalPages: 1,
  totalHighRiskCount: 0,
  totalMediumRiskCount: 0,
  totalLowRiskCount: 0,
  totalCachedCount: 0,
  totalUncachedCount: 0,
  loading: false,
  error: null,

  fetchCustomerIdList: async (nameOrId?: string, page = 1, append = false, sortBy = '2nd_degree_customer_count', sortOrder = 'desc', force = false, status?: string, cachedStatus?: boolean) => {
    try {
      // Prevent redundant concurrent requests if already loading the same parameters
      // (Unless force is true)
      if (get().loading && !force) {
        return;
      }

      set({ loading: true, error: null });
      // Decide whether to treat the query as numeric CID (userId) or name.
      const trimmed = (nameOrId ?? '').toString().trim();
      const isNumericQuery = trimmed !== '' && /^[0-9]+$/.test(trimmed);

      // Request the specified page with 200 items. If a numeric query is provided, send it as userId,
      // otherwise forward it as name so the backend can perform name-based search.
      const result = await customerService.getCustomerList(
        page,
        200,
        isNumericQuery ? undefined : (trimmed || undefined),
        sortBy,
        sortOrder,
        force,
        isNumericQuery ? trimmed : undefined,
        status,
        cachedStatus
      );
      
      if (result) {
        const newItems = result.items ?? [];
        set({ 
          customerIdList: append ? [...get().customerIdList, ...newItems] : newItems, 
          totalPages: result.metadata?.totalPages ?? 1,
          totalHighRiskCount: result.metadata?.totalHighRiskCount ?? 0,
          totalMediumRiskCount: result.metadata?.totalMediumRiskCount ?? 0,
          totalLowRiskCount: result.metadata?.totalLowRiskCount ?? 0,
          totalCachedCount: result.metadata?.totalCachedCount ?? 0,
          totalUncachedCount: result.metadata?.totalUncachedCount ?? 0,
          loading: false 
        });
      } else {
        if (!append) {
          set({ customerIdList: [], totalPages: 1 });
        }
        set({ loading: false });
      }
    } catch (error) {
      set({ error: 'Failed to fetch customer list', loading: false });
    }
  }
}));