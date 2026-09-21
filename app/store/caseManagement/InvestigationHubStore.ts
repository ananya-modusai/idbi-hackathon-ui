import { create } from "zustand";
import { caseManagementService } from "@/app/services/case-management";
import { InvestigationReference, CaseEventsListType, caseNote, EmailCommunicationList, EmailCommunicationItem } from "@/app/types";

interface InvestigationHubStore {
  investigationReferences: InvestigationReference[];
  fetchInvestigationReferences: () => Promise<void>;
  caseEvents: CaseEventsListType;
  fetchCaseEvents: (investigationId: string) => Promise<void>;
  postInvestigationNote: (investigationId: string, note: caseNote) => Promise<any>;
  // emailCommunications: EmailCommunicationList;
  // fetchEmailCommunications: (investigationId: string) => Promise<void>;   
  // postEmailCommunication: (investigationId: string, emailCommunication: EmailCommunicationItem) => Promise<any>;
}

export const useInvestigationHubStore = create<InvestigationHubStore>((set) => ({
  investigationReferences: [],
  fetchInvestigationReferences: async () => {
    // Commented out due to missing function in caseManagementService
    // const references = await caseManagementService.getInvestigationReferences();
    // set({ investigationReferences: references });
  },
  caseEvents: { case_events: [], case_event_meta_data: [] },
  fetchCaseEvents: async (investigationId: string) => {
    const events = await caseManagementService.getCaseEvents(investigationId);
    set({ caseEvents: events });
  },
  postInvestigationNote: async (investigationId: string, note: caseNote) => {
    const response = await caseManagementService.postInvestigationNote(investigationId, note);
    return response;
  },
  emailCommunications: { email_communication: [] },
  // fetchEmailCommunications: async (investigationId: string) => {
  //   const communications = await caseManagementService.getEmailCommunications(investigationId);
  //   set({ emailCommunications: communications });
  // },
  // postEmailCommunication: async (investigationId: string, emailCommunication: EmailCommunicationItem) => {
  //   const response = await caseManagementService.postEmailCommunication(investigationId, emailCommunication);
  //   return response;
  // }
}));
