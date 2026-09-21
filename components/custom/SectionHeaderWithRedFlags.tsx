import { FC, useState, useEffect, useRef } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Flag, Plus, XCircle, AlertTriangle, Info } from 'lucide-react';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { LucideIcon } from 'lucide-react';
import { RedFlag as StoreRedFlag } from '@/app/store/merchant/InvestigationRedFlagsStore';
import { getTagCategory } from '@/app/pages/Merchant/MerchantInsolvency/SampleData/syntheticTagsMapping';
import { useReportStore } from "@/app/store/report/reportStore";
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

interface SectionHeaderWithRedFlagsProps {
  redFlags: StoreRedFlag[];
  redFlag_recepient_id?: string;  // Make this optional
  title?: string;
  icon?: LucideIcon;
  iconColorClass?: string;
  showSeparator?: boolean; // control bottom separator line
  //onReport?: (reportId?: string, isNewReport?: boolean) => void; // Updated to handle report selection
  showRedFlagsInHeader?: boolean; // Control whether to show red flags in header, defaults to true
}

export const  SectionHeaderWithRedFlags: FC<SectionHeaderWithRedFlagsProps> = ({
  redFlags = [],
  redFlag_recepient_id,
  title = "Red Flags",
  icon: Icon,
  iconColorClass = "text-gray-500",
  showSeparator = true,
  // onReport,
  showRedFlagsInHeader = true
}) => {
  // Filter flags based on the recipient ID if provided, otherwise use all flags
  const filteredRedFlags = redFlag_recepient_id 
    ? redFlags.filter(flag => flag.rule_type === redFlag_recepient_id)
    : redFlags;
  
  const [isExpanded, setIsExpanded] = useState(filteredRedFlags.length > 0);
  // const { reports } = useReportStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Update isExpanded when filtered flags change
  useEffect(() => {
    setIsExpanded(filteredRedFlags.length > 0);
  }, [filteredRedFlags.length]);

  const getSeverityConfig = (severity: string) => {
    switch (severity.toLowerCase()) {
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
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'gray' as const,
          text: 'Low'
        };
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Map severity terms from the store to those used in this component
  const mapSeverity = (severity: string): 'severe' | 'high' | 'medium' | 'low' => {
    switch (severity?.toLowerCase()) {
      case 'severe':
        return 'severe';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      default:
        return 'low';
    }
  };

  // Count flags by severity
  const severeCount = filteredRedFlags.filter(flag =>
    mapSeverity(flag.severity) === 'severe').length;
  const highCount = filteredRedFlags.filter(flag =>
    mapSeverity(flag.severity) === 'high').length;
  const mediumCount = filteredRedFlags.filter(flag =>
    mapSeverity(flag.severity) === 'medium').length;
  const lowCount = filteredRedFlags.filter(flag =>
    mapSeverity(flag.severity) === 'low').length;

  // Handle report selection
  // const handleReportSelect = (reportId?: string) => {
  //   if (onReport) {
  //     if (reportId) {
  //       // Add to existing report
  //       onReport(reportId, false);
  //     } else {
  //       // Create new report
  //       onReport(undefined, true);
  //     }
  //   }
  //   setIsDropdownOpen(false);
  // };

  return (
    <div className="w-full overflow-hidden transition-all duration-200">
      <div 
        className={`flex items-center justify-between py-2 ${showSeparator ? 'border-b border-gray-200' : ''} ${showRedFlagsInHeader ? 'cursor-pointer' : ''}`}
        onClick={showRedFlagsInHeader ? toggleExpand : undefined}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className={cn("h-5 w-5", iconColorClass)} />}
          <span className="text-lg font-semibold text-blue-700">{title}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {showRedFlagsInHeader && (
            <>
              {([
                { count: severeCount, label: 'Severe', color: 'red' as const, icon: <XCircle className="h-3.5 w-3.5" /> },
                { count: highCount, label: 'High', color: 'orange' as const, icon: <XCircle className="h-3.5 w-3.5" /> },
                { count: mediumCount, label: 'Medium', color: 'yellow' as const, icon: <AlertTriangle className="h-3.5 w-3.5" /> },
                { count: lowCount, label: 'Low', color: 'blue' as const, icon: <Info className="h-3.5 w-3.5" /> },
              ]).map((f) => f.count > 0 ? (
                <BubbleTag
                  key={f.label}
                  text={f.label}
                  color={f.color}
                  hasOutsideIcon={true}
                  hasInsideNumber={true}
                  number={f.count}
                  icon={f.icon}
                />
              ) : null)}
            </>
          )}
          {/* Report dropdown menu */}
          {/* <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild onClick={(e) => {
              e.stopPropagation(); // Prevent toggling the section
              setIsDropdownOpen(!isDropdownOpen);
            }}>
              <button 
                className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                title="Add to report"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="text-xs">Report</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" onCloseAutoFocus={(e) => {
              // Prevent focus-related issues
              e.preventDefault();
            }}>
              {reports.map(report => (
                <DropdownMenuItem key={report.id} onClick={(e) => {
                  e.stopPropagation(); // Prevent event bubbling
                  handleReportSelect(report.id);
                }}>
                  {report.report_title}
                </DropdownMenuItem>
              ))}
              {reports.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation(); // Prevent event bubbling  
                handleReportSelect();
              }}>
                Create New Report...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
          {showRedFlagsInHeader && (
            isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            )
          )}
        </div>
      </div>

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
                        const mappedSeverity = mapSeverity(flag.severity);
                        const config = getSeverityConfig(mappedSeverity);
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
    </div>
  );
};

export default SectionHeaderWithRedFlags;
