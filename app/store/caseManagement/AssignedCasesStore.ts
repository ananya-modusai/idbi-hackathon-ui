import { create } from "zustand";
import { caseManagementService } from "@/app/services/case-management";
import { InvestigatorType, CaseInvestigationListType, CaseInvestigationType } from "@/app/types";

interface AssignedCasesStore {
  investigatorDetails: InvestigatorType | null;
  fetchInvestigatorDetails: (investigatorEmail: string) => void;
  assignedCases: CaseInvestigationType[] | null;
  fetchAssignedCases: (email : string) => void;
}

export const useAssignedCasesStore = create<AssignedCasesStore>((set) => ({
  investigatorDetails: null,
  fetchInvestigatorDetails: async (investigatorEmail) => {
    const investigatorDetails = await caseManagementService.getInvestogatorDetails(investigatorEmail);
    set({ investigatorDetails });
  },
  assignedCases: [],
  fetchAssignedCases: async (investigatorEmail) => {
    const assignedCases = await caseManagementService.getAssignedInvestigations(investigatorEmail);
    set({ assignedCases });
  },
}));
