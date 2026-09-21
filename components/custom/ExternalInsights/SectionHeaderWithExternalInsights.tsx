import { FC, useState, useEffect } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Flag, Plus, Check, X } from 'lucide-react';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { LucideIcon } from 'lucide-react';
import { RedFlag as StoreRedFlag } from '@/app/store/merchant/InvestigationRedFlagsStore';
import { getTagCategory } from '@/app/pages/Merchant/MerchantInsolvency/SampleData/syntheticTagsMapping';
import { useReportStore } from "@/app/store/report/reportStore";
import { useArtifactStore } from '@/app/store/artifact/artifactStore';
import { useInvestigatorDetailsStore } from '@/app/store/login/InvestigatorDetailsStore';
import { v4 as uuidv4 } from 'uuid';
import { CreateReportDialog } from '@/app/pages/ReportGeneration/utils/CreateReportDialog';
import { ReportArtifact } from '@/app/pages/ReportGeneration/utils/ReportArtifact';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Use a local RedFlag type that extends the store type
type RedFlag = StoreRedFlag & {
  text?: string;
  category?: string;
}

interface SectionHeaderWithExternalInsightsProps {
  redFlags: StoreRedFlag[];
  redFlag_recepient_id?: string;
  title?: string;
  icon?: LucideIcon;
  iconColorClass?: string;
  showRedFlagsInHeader?: boolean;
  // External Insights specific props
  selectionMode: boolean;
  selectedCount: number;
  contextId?: string;
  onToggleSelectionMode: () => void;
  getSelectedInsights: () => any[];
  onReportComplete: () => void; // Called after adding to report to clear selections
}

export const SectionHeaderWithExternalInsights: FC<SectionHeaderWithExternalInsightsProps> = ({
  redFlags = [],
  redFlag_recepient_id,
  title = "External Insights",
  icon: Icon,
  iconColorClass = "text-gray-500",
  showRedFlagsInHeader = true,
  selectionMode,
  selectedCount,
  contextId,
  onToggleSelectionMode,
  getSelectedInsights,
  onReportComplete
}) => {
  // Ensure redFlags is an array and filter based on recipient ID if provided
  const initialRedFlags = Array.isArray(redFlags) ? redFlags : [];
  const filteredRedFlags = redFlag_recepient_id 
    ? initialRedFlags.filter(flag => flag.rule_type === redFlag_recepient_id)
    : initialRedFlags;
  
  const [isExpanded, setIsExpanded] = useState(filteredRedFlags.length > 0);
  const { reports, createNewReport, addComponentToReport, fetchReportDetails } = useReportStore();
  const { addTab, setActiveTabId, setCollapsed } = useArtifactStore();
  const { investigatorEmail } = useInvestigatorDetailsStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReportTitle, setNewReportTitle] = useState('');

  // Update isExpanded when filtered flags change
  useEffect(() => {
    setIsExpanded(filteredRedFlags.length > 0);
  }, [filteredRedFlags.length]);

  const getRiskSegmentConfig = (riskSegment: string) => {
    switch (riskSegment?.toLowerCase()) {
      case 'severe':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'red' as const,
          text: 'Severe'
        };
      case 'high':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'orange' as const,
          text: 'High'
        };
      case 'medium':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'yellow' as const,
          text: 'Medium'
        };
      case 'low':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'gray' as const,
          text: 'Low'
        };
      default:
        // If no severity is provided, assume medium as default
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'yellow' as const,
          text: 'Medium'
        };
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Map risk segment terms from the store to those used in this component
  const mapRiskSegment = (risk_segment: string): 'severe' | 'high' | 'medium' | 'low' => {
    switch (risk_segment?.toLowerCase()) {
      case 'severe':
        return 'severe';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium'; // Default to medium if severity is not specified
    }
  };

  // Count flags by severity
  const severeCount = filteredRedFlags.filter(flag =>
    mapRiskSegment(flag.severity) === 'severe').length;
  const highCount = filteredRedFlags.filter(flag =>
    mapRiskSegment(flag.severity) === 'high').length;
  const mediumCount = filteredRedFlags.filter(flag =>
    mapRiskSegment(flag.severity) === 'medium').length;
  const lowCount = filteredRedFlags.filter(flag =>
    mapRiskSegment(flag.severity) === 'low').length;

  // Handle adding to existing report
  const handleAddToExistingReport = async (reportId: string) => {
    const selectedInsights = getSelectedInsights();
    if (selectedInsights.length === 0) return;

    try {
      let report = reports.find(r => r.id === reportId);
      if (!report?.components) {
        report = await fetchReportDetails(reportId);
      }

      const reportComponent = {
        frontend_component_id: uuidv4(),
        component_type: 'external-insights' as const,
        data: {
          title: 'External Insights Analysis',
          insights: selectedInsights,
          contextId,
          dataSource: contextId ? 'Live Data' : 'Sample Data',
          totalSelected: selectedInsights.length
        }
      };

      const updatedReport = await addComponentToReport(reportId, reportComponent);
      
      if (updatedReport) {
        addTab({
          id: `report-${reportId}`,
          title: `Report: ${updatedReport.report_title}`,
          renderArtifact: () => <ReportArtifact report={updatedReport} />
        });
        setActiveTabId(`report-${reportId}`);
        setCollapsed(false);
      }

      onReportComplete();
    } catch (error) {
      console.error('Error adding to report:', error);
    }
    setIsDropdownOpen(false);
  };

  // Handle creating new report
  const handleCreateNewReport = async () => {
    const selectedInsights = getSelectedInsights();
    if (selectedInsights.length === 0) return;

    try {
      const newReport = await createNewReport(newReportTitle, investigatorEmail);
      
      const reportComponent = {
        frontend_component_id: uuidv4(),
        component_type: 'external-insights' as const,
        data: {
          title: 'External Insights Analysis',
          insights: selectedInsights,
          contextId,
          dataSource: contextId ? 'Live Data' : 'Sample Data',
          totalSelected: selectedInsights.length
        }
      };

      const updatedReport = await addComponentToReport(newReport.id, reportComponent);
      
      if (updatedReport) {
        addTab({
          id: `report-${newReport.id}`,
          title: `Report: ${updatedReport.report_title}`,
          renderArtifact: () => <ReportArtifact report={updatedReport} />
        });
        setActiveTabId(`report-${newReport.id}`);
        setCollapsed(false);
      }

      onReportComplete();
      setIsDialogOpen(false);
      setNewReportTitle('');
    } catch (error) {
      console.error('Error creating new report:', error);
    }
  };

  return (
    <div className="w-full overflow-hidden transition-all duration-200">
      <div 
        className={`flex items-center justify-between py-2 border-b border-gray-200 ${showRedFlagsInHeader ? 'cursor-pointer' : ''}`}
        onClick={showRedFlagsInHeader ? toggleExpand : undefined}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className={cn("h-5 w-5", iconColorClass)} />}
          <span className="text-lg font-semibold text-gray-900">{title}</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Red Flags Display */}
          {showRedFlagsInHeader && (
            <>
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-xs text-gray-500">{severeCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-xs text-gray-500">{highCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-xs text-gray-500">{mediumCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-500">{lowCount}</span>
              </div>
            </>
          )}

          {/* Selection Mode Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelectionMode();
              }}
              variant={selectionMode ? "default" : "outline"}
              size="sm"
            >
              {selectionMode ? (
                <>
                  <X className="h-4 w-4 mr-1" />
                  Exit
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Select
                </>
              )}
            </Button>

            {selectionMode && (
              <span className="text-sm text-gray-600 font-medium">
                {selectedCount} selected
              </span>
            )}
          </div>

          {/* Report Dropdown - only show when items are selected */}
          {/* {selectionMode && selectedCount > 0 && (
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
              }}>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Add to Report
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" onCloseAutoFocus={(e) => {
                e.preventDefault();
              }}>
                {reports.map(report => (
                  <DropdownMenuItem key={report.id} onClick={(e) => {
                    e.stopPropagation();
                    handleAddToExistingReport(report.id);
                  }}>
                    {report.report_title}
                  </DropdownMenuItem>
                ))}
                {reports.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  setNewReportTitle(`External Insights - ${new Date().toLocaleDateString()}`);
                  setIsDialogOpen(true);
                  setIsDropdownOpen(false);
                }}>
                  Create New Report...
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )} */}

          {/* Expand/Collapse indicator */}
          {showRedFlagsInHeader && (
            isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )
          )}
        </div>
      </div>

            {/* Red Flags Content */}
      {showRedFlagsInHeader && (
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#f9f7f0]"
            >
              <div className="p-2">
                {filteredRedFlags.length === 0 ? (
                  <div className="text-gray-500 text-center py-3 px-4 text-sm">No red flags detected.</div>
                ) : (
                  <table className="w-full table-auto">
                    <tbody>
                      {filteredRedFlags.map((flag) => {
                        const mappedRiskSegment = mapRiskSegment(flag.severity);
                        const config = getRiskSegmentConfig(mappedRiskSegment);
                        // Use the rule_type to get a readable category name
                        const categoryText = getTagCategory(flag.rule_type);
                        
                        return (
                          <tr key={flag.id} className="border-b border-gray-200/30 last:border-b-0">
                            <td className="py-2 px-2 align-middle w-1">
                              <div className="flex justify-end">
                                <BubbleTag
                                  text={config.text}
                                  color={config.color}
                                />
                              </div>
                            </td>
                            <td className="py-2 px-3 text-left text-sm text-gray-600 flex-grow">
                              {flag.description}
                            </td>
                            <td className="py-2 px-2 align-middle w-auto">
                              <div className="flex justify-end">
                                <BubbleTag
                                  text={categoryText}
                                  color="blue"
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Create Report Dialog */}
      <CreateReportDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCreateReport={handleCreateNewReport}
        reportTitle={newReportTitle}
        onReportTitleChange={setNewReportTitle}
      />
    </div>
  );
}; 