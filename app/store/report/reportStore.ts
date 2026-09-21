import { create } from 'zustand';
import { reportService, componentType } from '@/app/services/reportServices';
import type { Report, ReportComponent } from '@/app/pages/ReportGeneration/utils/report';

interface ReportStore {
  reports: Report[];
  createNewReport: (title: string, email: string) => Promise<Report>;
  addComponentToReport: (reportId: string, component: ReportComponent) => Promise<Report>;
  removeComponentFromReport: (reportId: string, componentId: string) => Promise<Report>;
  fetchReports: (email: string) => Promise<void>;
  fetchReportDetails: (reportId: string) => Promise<Report>;
  updateReportComponents: (report: Report) => Promise<void>;
}

export const useReportStore = create<ReportStore>((set, get) => ({
  reports: [],

  createNewReport: async (title, email) => {
    const response = await reportService.getNewReportId(email, title);
    const newReport = { 
      id: response.report_id, 
      report_title: response.report_title, 
      last_updated: new Date().toISOString(),
      components: [] 
    };
    set(state => ({ 
      reports: [...state.reports, newReport],
    }));
    return newReport;
  },

  fetchReports: async (email) => {
    const reportList = await reportService.getReportIDs(email);
    set({ reports: reportList });
  },

  fetchReportDetails: async (reportId) => {
    const details = await reportService.getReportDetails(reportId);
    console.log("details in rudra", details)
    const updatedReport = {
      id: reportId,
      report_title: details.report_title,
      last_updated: details.last_updated,
      components: details.components || []
    };
    
    // Update the report in the store with full details
    set(state => ({
      reports: state.reports.map(report => 
        report.id === reportId ? updatedReport : report
      )
    }));
    
    return updatedReport;
  },

  addComponentToReport: async (reportId, component) => {
    let updatedReport: Report | undefined;
    set(state => {
      const reports = state.reports.map(report => 
        report.id === reportId 
          ? { ...report, components: [...(report.components || []), component] }    
          : report
      );
      updatedReport = reports.find(r => r.id === reportId);
      return { reports };
    });
    if (!updatedReport) throw new Error('Report not found');
    return updatedReport;
  },

  removeComponentFromReport: async (reportId, componentId) => {
    try {
      let updatedReport: Report | undefined;
      set(state => {
        const reports = state.reports.map(report => {
          if (report.id === reportId) {
            const filteredComponents = (report.components || [])
              .filter(c => c.frontend_component_id !== componentId);
            return { ...report, components: filteredComponents };
          }
          return report;
        });
        updatedReport = reports.find(r => r.id === reportId);
        return { reports };
      });
      if (!updatedReport) throw new Error('Report not found');
      
      // Ensure we're not returning undefined
      return updatedReport;
    } catch (error) {
      console.error('Error in removeComponentFromReport:', error);
      throw error;
    }
  },

  updateReportComponents: async (report) => {
    // const report = get().reports.find(r => r.id === reportId);
    if (!report) return;
    console.log("testing chayan", report)

    const components: componentType[] = (report.components || []).map(c => ({
      frontend_component_id: c.frontend_component_id,
      component_type: c.component_type,
      data: c.data
    }));

    await reportService.UpdateReportComponents(report.id, components);
  },

})); 
