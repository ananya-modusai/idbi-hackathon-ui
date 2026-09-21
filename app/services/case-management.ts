import { API } from './axios';
import { CaseInvestigationListType, InvestigatorsListType, InvestigationReference, CaseEventsListType, CaseInvestigationType, InvestigatorType, caseNote, CaseAssigneeInfo, EmailCommunicationList, EmailCommunicationItem } from '@/app/types';

export const caseManagementService = {

  // getInvestigationReferences: async (): Promise<InvestigationReference[]> => {
  //   const response = await API.get(`/api/v1/case-management/investigationIDs`);
  //   console.log("response", response);
  //   return response.data.data;
  // },

  getAllInvestigations: async (): Promise<CaseInvestigationListType> => {
    const response = await API.get(`/api/v1/case-management/investigations`);
    return response.data;
  },

  getCaseInvestigations: async (merchantId: string): Promise<CaseInvestigationListType> => {
    const response = await API.get(`/api/v1/case-management/${merchantId}/investigations`);
    return response.data;
  },

  getInvstigationDetails: async (investigationId: string): Promise<CaseInvestigationType> => {
    const response = await API.get(`/api/v1/case-management/${investigationId}/investigation-details`);
    console.log("response.data : ", response.data);
    return response.data.investigation;
  },

  getInvestigators: async (): Promise<InvestigatorsListType> => {
    const response = await API.get(`/api/v1/case-management/investigators`);
    return response.data;
  },

  // from here Investigation Hub Services

  postInvestigationNote: async (investigationId: string, note: caseNote): Promise<any> => {
    const response = await API.post(
      `/api/v1/case-management/${investigationId}/add-case-note`, 
      JSON.stringify(note),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  },

  postUpdateCase: async (investigationId: string, caseAssigneeInfo: CaseAssigneeInfo): Promise<any> => {
    const response = await API.post(`/api/v1/case-management/${investigationId}/update-investigation`, JSON.stringify(caseAssigneeInfo), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },

  getCaseEvents: async (investigationId: string): Promise<CaseEventsListType> => {
    const response = await API.get(`/api/v1/case-management/${investigationId}/case-events`);
    return response.data;
  },

  // from here Assigned Cases Services

  getInvestogatorDetails: async (investigatorEmail: string): Promise<InvestigatorType> => {
    const response = await API.get(`/api/v1/case-management/${investigatorEmail}/investigator-details`);
    return response.data.investigator;
  },

  getAssignedInvestigations: async (investigatorEmail: string): Promise<CaseInvestigationType[]> => {
    const response = await API.get(`/api/v1/case-management/assigned_cases/${investigatorEmail}/`);
    return response.data.cases;
  },
};
