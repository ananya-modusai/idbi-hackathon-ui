import { create } from 'zustand';
import { caseManagementService } from '@/app/services/case-management';
import { CaseAssigneeInfo, CaseInvestigationListType, InvestigatorsListType } from '@/app/types';

interface CaseManagementStore {
    caseInvestigations: CaseInvestigationListType | null;
    fetchCaseInvestigations: (merchantId: string) => Promise<void>;
    investigators: InvestigatorsListType | null;
    fetchInvestigators: () => Promise<void>;
    allInvestigations: CaseInvestigationListType | null;
    fetchAllInvestigations: () => Promise<void>;
    postUpdateCase: (investigationId: string, caseAssigneeInfo: CaseAssigneeInfo) => Promise<void>;
}

export const useCaseManagementStore = create<CaseManagementStore>((set) => ({
    caseInvestigations: null,
    fetchCaseInvestigations: async (merchantId: string) => {
        const caseInvestigations = await caseManagementService.getCaseInvestigations(merchantId);
        set({ caseInvestigations });
    },
    investigators: null,
    fetchInvestigators: async () => {
        const investigators = await caseManagementService.getInvestigators();
        set({ investigators });
    },
    allInvestigations: null,
    fetchAllInvestigations: async () => {
        const allInvestigations = await caseManagementService.getAllInvestigations();
        set({ allInvestigations });
    },
    postUpdateCase: async (investigationId: string, caseAssigneeInfo: CaseAssigneeInfo) => {
        const response = await caseManagementService.postUpdateCase(investigationId, caseAssigneeInfo);
        return response;
    },
}));
