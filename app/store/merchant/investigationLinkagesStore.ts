import { create } from 'zustand';
import { NetworkData } from '@/app/types';
import { merchantService } from '@/app/services/merchantServices';
interface InvestigationLinkagesStore {
    networkData: NetworkData | null;
    fetchNetworkData: (merchantId: string) => Promise<void>;
}

export const useInvestigationLinkagesStore = create<InvestigationLinkagesStore>((set) => ({
    networkData: null,
    fetchNetworkData: async (merchantId: string) => {
        const networkData = await merchantService.getMerchantNetwork(merchantId);
        set({ networkData });
    }
}));