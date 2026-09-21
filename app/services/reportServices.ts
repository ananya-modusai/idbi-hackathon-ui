import { API } from './axios';

export interface componentType {
    frontend_component_id: string;
    component_type: string;
    data: any;
}

export const reportService = {

  getNewReportId : async (email: string, title: string) => {
    const response = await API.get(`/api/v1/report-gen/added-new-report?investigator_email=${email}&report_title=${title}`);    
    return response.data;
  },

  getReportIDs : async (email: string) => {
    const response = await API.get(`/api/v1/report-gen/${email}/get-report-ids`);    
    return response.data;
  },

  getReportDetails : async (reportId: string) => {
    const response = await API.get(`/api/v1/report-gen/${reportId}/get-report`);    
    return response.data.response;
  },

  UpdateReportComponents : async (reportId: string, components: componentType[]) => {
    const response = await API.post(`/api/v1/report-gen/${reportId}/update-report-components`, {"report_gen" : components});
    return response.data;
  }
};
