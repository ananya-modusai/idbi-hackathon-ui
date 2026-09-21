import { create } from 'zustand';
import { merchantService } from '@/app/services/merchantServices';
import { KeyMetricListType, RiskAssessment } from '@/app/types';

interface InvestigationOverviewStore {
    keyMetricList: KeyMetricListType | null;
    riskAssessment: RiskAssessment | null;
    summary: string | null;
    loading: boolean;
    error: string | null;
    // investigations: InvestigationListType | null;
    fetchKeyMetricList: (merchantId: string) => Promise<void>;
    fetchRiskAssessment: (merchantId: string) => Promise<void>;
    fetchSummary: (merchantId: string) => Promise<void>;
    // fetchInvestigations: (merchantId: string) => Promise<void>;
}

export const useInvestigationOverviewStore = create<InvestigationOverviewStore>((set) => ({
    keyMetricList: null,
    riskAssessment: null,
    summary: null,
    loading: false,
    error: null,
    fetchKeyMetricList: async (merchantId: string) => {
        const keyMetricList = await merchantService.getMerchantKeyMetrics(merchantId);
        set({ keyMetricList });
    },
    fetchRiskAssessment: async (merchantId: string) => {
        try {
            set({ loading: true, error: null });
            const response = await merchantService.getMerchantRiskAssessment(merchantId);
            
            // Check if we have valid data
            if (!response || !response.data) {
                set({ 
                    riskAssessment: null, 
                    loading: false, 
                    error: 'No risk assessment data available for this merchant' 
                });
                return;
            }
            
            set({ riskAssessment: response.data, loading: false });
        } catch (error: any) {
            console.error('Failed to fetch risk assessment:', error);
            set({ 
                riskAssessment: null, 
                loading: false, 
                error: error.message || 'Failed to fetch risk assessment' 
            });
        }
    },
    fetchSummary: async (merchantId: string) => {
        const data = await merchantService.getMerchantSummary(merchantId);
        set({ summary: data.summary });
    },
    // fetchInvestigations: async (merchantId: string) => {
    //     const investigations = await merchantService.getMerchantInvestigations(merchantId);
    //     set({ investigations });
    // },
}));
