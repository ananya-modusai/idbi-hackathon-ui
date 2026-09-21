import { create } from 'zustand';
import { DigitalInformationType } from '@/app/types';
import { merchantService } from '@/app/services/merchantServices';

interface InvestigationDigitalFootprintStore {
    digitalInformation: DigitalInformationType | null;
    fetchDigitalInformation: (merchantId: string) => Promise<void>;
}

export const useInvestigationDigitalFootprintStore = create<InvestigationDigitalFootprintStore>((set) => ({
    digitalInformation: null,
    fetchDigitalInformation: async (merchantId: string) => {
        const digitalInformation = await merchantService.getMerchantDigitalInformation(merchantId);
        set({ digitalInformation });
    }
}));