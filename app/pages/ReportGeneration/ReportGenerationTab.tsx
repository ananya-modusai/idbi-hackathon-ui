import { useReportStore } from '@/app/store/report/reportStore';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useArtifactStore } from '@/app/store/artifact/artifactStore';
import type { Report } from './utils/report';
import { ReportArtifact } from './utils/ReportArtifact';
import { useInvestigatorDetailsStore } from '@/app/store/login/InvestigatorDetailsStore';
import { CreateReportDialog } from './utils/CreateReportDialog';

export function ReportGenerationTab() {
  const { reports, fetchReports, createNewReport, fetchReportDetails } = useReportStore();
  const { addTab, setCollapsed } = useArtifactStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReportTitle, setNewReportTitle] = useState('');
  const { investigatorEmail } = useInvestigatorDetailsStore();  

  useEffect(() => {
    fetchReports(investigatorEmail);
  }, [fetchReports]);

  const handleCreateReport = async () => {
    await createNewReport(newReportTitle, investigatorEmail);
    setIsDialogOpen(false);
    setNewReportTitle('');
  };

  const openReportInArtifact = async (report: Report) => {
    // Only fetch details if components are not present
    console.log("report in reporttab rudra", report)
    const reportDetails = await fetchReportDetails(report.id);
    
    addTab({
      id: `report-${report.id}`,
      title: `Report: ${reportDetails.report_title}`,
      renderArtifact: () => <ReportArtifact report={reportDetails} />
    });
    setCollapsed(false);
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Reports</h2>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No reports created yet. Click "New Report" to create one.
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => openReportInArtifact(report)}
            >
              <h3 className="font-medium mb-2">{report.report_title}</h3>
              <div className="text-sm text-gray-500">
              {report.last_updated 
                    ? new Date(report.last_updated).toLocaleDateString()
                    : 'Never updated'}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateReportDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCreateReport={handleCreateReport}
        reportTitle={newReportTitle}
        onReportTitleChange={(value) => setNewReportTitle(value)}
      />
    </div>
  );
}