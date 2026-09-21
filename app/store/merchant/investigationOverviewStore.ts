import { create } from 'zustand';
import { merchantService } from '@/app/services/merchantServices';
import { KeyMetricListType, RiskAssessment } from '@/app/types';

interface InvestigationOverviewStore {
    keyMetricList: KeyMetricListType | null;
    riskAssessment: RiskAssessment | null;
    summary: string | null;
    transactionMetrics: any | null;
    fetchKeyMetricList: (merchantId: string) => Promise<void>;
    fetchRiskAssessment: (merchantId: string) => Promise<void>;
    fetchSummary: (merchantId: string) => Promise<void>;
    fetchTransactionMetrics: (merchantId: string) => Promise<void>;
}

export const useInvestigationOverviewStore = create<InvestigationOverviewStore>((set) => ({
    keyMetricList: null,
    riskAssessment: null,
    summary: null,
    transactionMetrics: null,
    fetchKeyMetricList: async (merchantId: string) => {
        const keyMetricList = await merchantService.getMerchantKeyMetrics(merchantId);
        set({ keyMetricList });
    },
    fetchRiskAssessment: async (merchantId: string) => {
        const riskAssessment = await merchantService.getMerchantRiskAssessment(merchantId);
        set({ riskAssessment: riskAssessment.data });
    },
    fetchSummary: async (merchantId: string) => {
        const data = await merchantService.getMerchantSummary(merchantId);
        set({ summary: data.summary });
    },
    fetchTransactionMetrics: async (merchantId: string) => {
        const transactionMetrics = await merchantService.getMerchantTransactionMetrics(merchantId);
        set({ transactionMetrics });
    }
})); 