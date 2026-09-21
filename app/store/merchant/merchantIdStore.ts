import { create } from "zustand";
import { merchantService } from "@/app/services/merchantServices";
import { MerchantItemType } from '@/app/types/merchant';
import { MerchantProfileType } from '@/app/types';

interface MerchantIdStore {
  merchantIdList: MerchantItemType[];
  selectedMerchantId: string | null;
  selectedMerchant: MerchantProfileType | null;
  loading: boolean;
  error: string | null;
  pagination: {
    skip: number;
    limit: number;
    hasMore: boolean;
  };
  fetchMerchantIdList: (skip?: number, limit?: number) => Promise<void>;
  fetchMerchantDetails: (merchantId: string) => Promise<void>;
  setSelectedMerchantId: (merchantId: string | null) => void;
  clearSelectedMerchant: () => void;
  loadMoreMerchants: () => Promise<void>;
}

export const useMerchantIdStore = create<MerchantIdStore>((set, get) => ({
  merchantIdList: [],
  selectedMerchantId: null,
  selectedMerchant: null,
  loading: false,
  error: null,
  pagination: {
    skip: 0,
    limit: 500,
    hasMore: true
  },
  
  setSelectedMerchantId: (merchantId: string | null) => 
    set({ selectedMerchantId: merchantId }),
    
  clearSelectedMerchant: () => 
    set({ selectedMerchant: null, selectedMerchantId: null }),
    
  fetchMerchantIdList: async (skip: number = 0, limit: number = 500) => {
    try {
      set({ loading: true, error: null });
      
      const merchants = await merchantService.getMerchantList(skip, limit);
      
      set({ 
        merchantIdList: merchants,
        pagination: {
          skip,
          limit,
          hasMore: merchants.length === limit // Check if more items might exist
        },
        loading: false 
      });
    } catch (error) {
      console.error('Error in fetchMerchantIdList:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch merchant list', 
        loading: false 
      });
    }
  },

  loadMoreMerchants: async () => {
    const { pagination, merchantIdList } = get();
    if (!pagination.hasMore || get().loading) return;
    
    try {
      set({ loading: true });
      const nextSkip = pagination.skip + pagination.limit;
      const newMerchants = await merchantService.getMerchantList(nextSkip, pagination.limit);
      
      set({
        merchantIdList: [...merchantIdList, ...newMerchants],
        pagination: {
          ...pagination,
          skip: nextSkip,
          hasMore: newMerchants.length === pagination.limit
        },
        loading: false
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load more merchants',
        loading: false 
      });
    }
  },

  fetchMerchantDetails: async (merchantId: string) => {
    if (!merchantId) {
      set({ error: 'Merchant ID is required', loading: false });
      return;
    }
    
    try {
      set({ loading: true, error: null });
      const merchantData = await merchantService.getMerchantDetails(merchantId);
      set({ 
        selectedMerchant: merchantData, 
        selectedMerchantId: merchantId,
        loading: false 
      });
    } catch (error) {
      console.error('Error fetching merchant details:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch merchant details', 
        loading: false 
      });
    }
  },
}));



