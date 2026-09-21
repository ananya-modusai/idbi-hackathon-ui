import { FC, useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PDFDocument } from '@/app/pages/ReportGeneration/utils/PDFTemplate';
import { Report } from '@/app/pages/ReportGeneration/utils/report';
import { Button } from '@/components/ui/button';
import { Printer, FileText, Loader2 } from 'lucide-react';
import { useReportStore } from '@/app/store/report/reportStore';

interface ReportPrinterProps {
  reportId: string;
  small?: boolean;
}

interface PDFDownloadButtonProps {
  loading: boolean;
  error: any;
  small: boolean;
}

const PDFDownloadButton: FC<PDFDownloadButtonProps> = ({ loading, error, small }) => (
  <Button
    variant="ghost"
    size={small ? "sm" : "default"}
    disabled={loading}
    className={`${small ? "h-7 px-2.5 text-xs gap-1.5" : ""} ${
      error ? "text-red-500" : "text-gray-500 hover:text-gray-900 hover:bg-gray-200"
    }`}
  >
    {loading ? (
      <Loader2 className={`${small ? "h-3.5 w-3.5" : "h-4 w-4"} animate-spin`} />
    ) : (
      <Printer className={small ? "h-3.5 w-3.5" : "h-4 w-4"} />
    )}
    {loading ? "Generating..." : error ? "Error" : "Download PDF"}
  </Button>
);

export const ReportPrinter: FC<ReportPrinterProps> = ({ reportId, small = false }) => {
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const { fetchReportDetails } = useReportStore();

  useEffect(() => {
    const loadReport = async () => {
      setIsLoading(true);
      try {
        const reportDetails = await fetchReportDetails(reportId);
        if (reportDetails) {
          setReport(reportDetails);
        }
      } catch (error) {
        console.error("Error loading report for printing:", error);
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [reportId, fetchReportDetails]);

  if (isLoading) {
    return (
      <Button
        variant="ghost"
        size={small ? "sm" : "default"}
        disabled
        className={small ? "h-7 px-2.5 text-xs gap-1.5" : ""}
      >
        <Loader2 className={`${small ? "h-3.5 w-3.5" : "h-4 w-4"} animate-spin`} />
        Loading Report
      </Button>
    );
  }

  if (!report || !report.components) {
    return (
      <Button
        variant="ghost"
        size={small ? "sm" : "default"}
        disabled
        className={small ? "h-7 px-2.5 text-xs gap-1.5" : ""}
      >
        <FileText className={small ? "h-3.5 w-3.5" : "h-4 w-4"} />
        Report Unavailable
      </Button>
    );
  }

  // Using the PDFDownloadLink component with its children as a string or React element
  // instead of a render prop function to avoid type issues
  return (
    <PDFDownloadLink
      document={<PDFDocument report={report} components={report.components} />}
      fileName={`Modus_Report_${report.id}_${new Date().toISOString().split("T")[0]}.pdf`}
    >
        <PDFDownloadButton loading={isLoading} error={error} small={small} />
    </PDFDownloadLink>
  );
};