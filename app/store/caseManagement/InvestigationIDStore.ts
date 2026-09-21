import { create } from 'zustand';
import { CaseInvestigationType } from '@/app/types';
import { caseManagementService } from '@/app/services/case-management';

interface InvestigationIDStore {
  selectedinvestigationId: string | null;
  setInvestigationId: (id: string | null) => void;
  selectedInvestigation: CaseInvestigationType | null;
  fetchInvestigationDetails: (id: string) => void;
}

export const useInvestigationIDStore = create<InvestigationIDStore>((set) => ({
    selectedinvestigationId: null,
    setInvestigationId: (id) => set({ selectedinvestigationId: id }),
    selectedInvestigation: null,
    fetchInvestigationDetails: async (id) => {
        const investigation = await caseManagementService.getInvstigationDetails(id);
        set({ selectedInvestigation: investigation });
    }
}));
