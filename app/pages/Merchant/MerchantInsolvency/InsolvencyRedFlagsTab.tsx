'use client';

import { FC, useEffect, useState, useMemo, useRef } from 'react';
import { AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInvestigationRedFlagsStore } from '@/app/store/merchant/InvestigationRedFlagsStore';
import { useMerchantIdStore } from '@/app/store/merchant/merchantIdStore';
import { useArtifactStore } from '@/app/store/artifact/artifactStore';
import { useActiveContext } from '@/app/layout/ActiveContext/useActiveContext';
import InsolvencyPageHeader from './Components/InsolvencyPageHeader';
import CustomLoader from '@/components/custom/CustomLoader';
import { getTagCategory } from './SampleData/syntheticTagsMapping';
import { ReportableSection } from '@/app/pages/ReportGeneration/utils/ReportSectionHelpers';
import { SectionHeaderWithRedFlags } from '@/components/custom/SectionHeaderWithRedFlags';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { ColorScheme, getColorClasses } from '@/components/custom/CustomColorScheme';
import CustomList from '@/components/custom/CustomList/customList';
import CustomListItem, { CustomListItemProps } from '@/components/custom/CustomList/customListItem';
import { format } from 'date-fns';
import RedFlagsPDFTemplate from './Report/RedFlags/RedFlagsPDFTemplate';
import { generateRedFlagsPDF } from './Report/utils/pdfUtils';
import { industryService } from '@/app/services/industryServices';

// Define severity filter options
const severityOptions = [
  { value: 'severe', label: 'Severe' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
];

interface RedFlag {
  id: string;
  description?: string;
  severity?: string;
  rule_type?: string;
  rule_name?: string;
  rule_code?: string;
  created_at?: string;
  metric_values?: Record<string, number | string>;
}

// Dynamic icon mapping based on category
interface CustomListItem {
  itemID: string;
  title: string;
  subtitle?: string;
  bottomLeftContent?: React.ReactNode;
  bottomRightContent?: React.ReactNode;
  topRightContent?: React.ReactNode;
  originalData: RedFlag;
  icon?: React.ElementType;
  themeColor?: string;
  timelineIcon?: React.ElementType;
  timelineDatetime?: string;
}

const categoryIconMap: Record<string, React.ElementType> = {
  'audit': AlertCircle,
  'legal': AlertCircle,
  'operational': AlertTriangle,
  'financial': AlertCircle,
  'reputation': AlertCircle,
  'industry': AlertCircle,
  'annual_report': AlertCircle,
  'company': AlertCircle,
  'other': AlertTriangle
};

// Dynamic color mapping based on category
const categoryColorMap: Record<string, string> = {
  'audit': 'text-orange-600',
  'legal': 'text-red-600',
  'operational': 'text-amber-600',
  'financial': 'text-emerald-600',
  'reputation': 'text-purple-600',
  'industry': 'text-blue-600',
  'annual_report': 'text-pink-600',
  'company': 'text-blue-600',
  'other': 'text-gray-600'
};

// Function to get category and display info for a rule type
const getCategoryInfo = (ruleType: string) => {
  const category = getTagCategory(ruleType).toLowerCase().replace('_', '');
  return {
    category,
    label: getTagCategory(ruleType),
    icon: categoryIconMap[category] || categoryIconMap.other,
    color: categoryColorMap[category] || categoryColorMap.other
  };
};

// Export a hook to access the red flags data from other components
export const useInsolvencyRedFlags = () => {
  const { flagsList } = useInvestigationRedFlagsStore();
  
  const severityOrder: Record<string, number> = {
    'severe': 0,
    'high': 1,
    'medium': 2,
    'low': 3,
    'unknown': 4
  };
  
  // Guard against undefined/null or non-array values
  const safeList = Array.isArray(flagsList) ? flagsList : [];
  return [...safeList].sort((a, b) => {
    const severityA = (a.severity?.toLowerCase() || 'unknown').trim();
    const severityB = (b.severity?.toLowerCase() || 'unknown').trim();
    
    const orderA = severityOrder[severityA] ?? severityOrder.unknown;
    const orderB = severityOrder[severityB] ?? severityOrder.unknown;
    
    return orderA - orderB;
  });
};

interface InsolvencyRedFlagsTabProps {
  merchantId: string;
}

const InsolvencyRedFlagsTab: FC<InsolvencyRedFlagsTabProps> = ({ merchantId }) => {
  const { 
    fetchFlagsList,
    filterSeverities,
    setFilterSeverities
  } = useInvestigationRedFlagsStore();
  const rawFlagsList = useInsolvencyRedFlags();
  const { selectedMerchantId, merchantIdList } = useMerchantIdStore();
  const { activeContexts } = useActiveContext();
  const artifactStore = useArtifactStore();
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [merchantIndustry, setMerchantIndustry] = useState<{ industry: string; risk_segment: string } | null>(null);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);
  // Selected date/version from page header (used as runDate for PDFs)
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  const merchantIdToUse = merchantId || activeContexts?.merchant || selectedMerchantId;
  const activeMerchant = merchantIdList.find(m => m.id === merchantIdToUse);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Map store flags to component flags
  const flagsList = useMemo(() => {
    return rawFlagsList.map(flag => ({
      id: flag.id,
      description: flag.description,
      severity: flag.severity,
      rule_type: flag.rule_type,
      created_at: flag.created_at,
      rule_name: flag.rule_name,
      rule_code: flag.rule_code,
      metric_values: flag.metric_values || undefined
    }));
  }, [rawFlagsList]);

  useEffect(() => {
    if (merchantIdToUse) {
      fetchFlagsList(merchantIdToUse);
    }
  }, [fetchFlagsList, merchantIdToUse]);

  // Fetch merchant industry data
  useEffect(() => {
    const fetchMerchantIndustry = async () => {
      if (activeMerchant?.id) {
        const industryData = await industryService.getMerchantIndustry(activeMerchant.id);
        setMerchantIndustry(industryData);
      }
    };

    fetchMerchantIndustry();
  }, [activeMerchant?.id]);

  const handleRefresh = async () => {
    if (merchantId) {
      setIsLoading(true);
      await fetchFlagsList(merchantId);
      setIsLoading(false);
    }
  };

  // Handle PDF generation
  const handleGenerateReport = async () => {
    if (!activeMerchant || !pdfTemplateRef.current) {
      console.error('Missing required data for PDF generation');
      return;
    }

    try {
      await generateRedFlagsPDF(
        pdfTemplateRef.current,
        activeMerchant.legalName,
        merchantIndustry, // Pass the industry object
        activeMerchant.cin || activeMerchant.id, // Pass the CIN
        {
          filename: `${activeMerchant.legalName.replace(/[^a-z0-9]/gi, ' ')} Red Flags Report.pdf`
          , runDate: selectedDate || null
        }
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // Get unique categories for dropdown
  const categoryOptions = useMemo(() => {
    const categories = flagsList.map(flag => getTagCategory(flag.rule_type || ''));
    const uniqueCategories = Array.from(new Set(categories));
    return uniqueCategories.map(category => ({
      value: category.toLowerCase().replace('_', ''),
      label: category
    }));
  }, [flagsList]);

  // Prepare report data
  const reportData = useMemo(() => {
    return {
      title: "Insolvency Red Flags Analysis",
      redFlags: rawFlagsList,
      totalFlags: rawFlagsList.length,
      severityBreakdown: {
        severe: rawFlagsList.filter(flag => flag.severity?.toLowerCase() === 'severe').length,
        high: rawFlagsList.filter(flag => flag.severity?.toLowerCase() === 'high').length,
        medium: rawFlagsList.filter(flag => flag.severity?.toLowerCase() === 'medium').length,
        low: rawFlagsList.filter(flag => flag.severity?.toLowerCase() === 'low').length,
      },
      categoryBreakdown: categoryOptions.reduce((acc, category) => {
        acc[category.value] = rawFlagsList.filter(flag => 
          getTagCategory(flag.rule_type || '').toLowerCase().replace('_', '') === category.value
        ).length;
        return acc;
      }, {} as Record<string, number>),
      merchantId: merchantId,
      dataSource: merchantId ? 'Live Data' : 'Sample Data'
    };
  }, [rawFlagsList, categoryOptions, merchantId]);

  // Handle section report
  const handleSectionReport = (reportId?: string, isNewReport?: boolean) => {
    console.log(`Handling red flags report`, {
      reportId,
      isNewReport,
      dataKeys: Object.keys(reportData)
    });

    const reportSectionRef = document.querySelector(`[data-report-section="insolvency-red-flags"]`);

    if (reportSectionRef) {
      if (reportId) {
        // Add to existing report
        const event = new CustomEvent('add-to-report', {
          detail: { type: 'insolvency-red-flags', data: reportData, reportId },
          bubbles: true
        });
        reportSectionRef.dispatchEvent(event);
      } else if (isNewReport) {
        // Create new report
        const event = new CustomEvent('generate-report', {
          detail: { type: 'insolvency-red-flags', data: reportData },
          bubbles: true
        });
        reportSectionRef.dispatchEvent(event);
      }
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'severe':
      case 'critical':
        return {
          icon: AlertTriangle,
          color: 'red' as ColorScheme,
          text: severity === 'severe' ? 'Severe' : 'Severe'
        };
      case 'high':
        return {
          icon: AlertTriangle,
          color: 'orange' as ColorScheme,
          text: 'High'
        };
      case 'medium':
        return {
          icon: AlertTriangle,
          color: 'yellow' as ColorScheme,
          text: 'Medium'
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'gray' as ColorScheme,
          text: 'Low'
        };
    }
  };

  // Convert flags to CustomList items
  const listItems = useMemo(() => {
    return rawFlagsList.map(flag => {
      const severityConfig = getSeverityConfig(flag.severity || 'medium');
      const flagType = flag.rule_type || '';
      const ruleTypeInfo = getCategoryInfo(flagType);

      const formattedDate = flag.created_at 
        ? format(new Date(flag.created_at), 'dd/M/yyyy • h:mm aaa')
        : 'No date';

      return {
        itemID: flag.id,
        title: flag.rule_name ? flag.rule_name : `${ruleTypeInfo.label} Red Flag`,
        subtitle: undefined,
        leftContent: (
          <div className="text-sm text-gray-500 font-mono min-w-[180px]">
            {formattedDate}
          </div>
        ),
        bottomLeftContent: (
          <div className="text-sm text-gray-600">
            {flag.description || 'No description available'}
          </div>
        ),
        bottomRightContent: undefined,
        // (
        //   <span className="text-xs text-gray-400 font-mono">
        //     {flag.rule_code || 'No code'}
        //   </span>
        // ),
        topRightContent: (
          <div className="flex items-center gap-2">
            <BubbleTag
              text={severityConfig.text}
              color={severityConfig.color}
              icon={<severityConfig.icon className="w-3.5 h-3.5" />}
              hasOutsideIcon={true}
            />
            <BubbleTag text={ruleTypeInfo.label} color={"blue" as ColorScheme} />
          </div>
        ),
        originalData: flag,
        icon: AlertTriangle,
        themeColor: getColorClasses(severityConfig.color),
        timelineIcon: AlertTriangle,
        timelineDatetime: flag.created_at,
      };
    });
  }, [rawFlagsList]);

  // Filter functions
  interface RedFlag {
    id: string;
    description?: string;
    severity?: string;
    rule_type?: string;
    rule_name?: string;
    rule_code?: string;
    created_at?: string;
    metric_values?: Record<string, number | string>;
  }

  const severityFilterFunction = (item: CustomListItemProps, selectedValues: string[]) => {
    if (selectedValues.length === 0) return true;
    const severity = (item.originalData as RedFlag).severity?.toLowerCase() || 'unknown';
    return selectedValues.includes(severity);
  };

  const categoryFilterFunction = (item: CustomListItemProps, selectedValues: string[]) => {
    if (selectedValues.length === 0) return true;
    const flagType = (item.originalData as RedFlag).rule_type || '';
    const category = getCategoryInfo(flagType).category;
    return selectedValues.includes(category);
  };

  const searchFilterFunction = (item: CustomListItemProps, selectedValues: string[]) => {
    const query = selectedValues[0] || '';
    if (!query.trim()) return true;

    const searchQuery = query.toLowerCase();
    const flag = item.originalData as RedFlag;

    return Boolean(
      flag.description?.toLowerCase().includes(searchQuery) ||
      flag.rule_name?.toLowerCase().includes(searchQuery) ||
      flag.rule_code?.toLowerCase().includes(searchQuery) ||
      flag.rule_type?.toLowerCase().includes(searchQuery) ||
      flag.severity?.toLowerCase().includes(searchQuery)
    );
  };

  // Get severity config for styling
  // const getSeverityConfig = (severity: string) => {
  //   switch (severity.toLowerCase()) {
  //     case 'severe':
  //     case 'critical':
  //       return {
  //         icon: AlertTriangle,
  //         color: 'red' as ColorScheme,
  //         text: severity === 'severe' ? 'Severe' : 'Critical'
  //       };
  //     case 'high':
  //       return {
  //         icon: AlertTriangle,
  //         color: 'orange' as ColorScheme,
  //         text: 'High'
  //       };
  //     case 'medium':
  //       return {
  //         icon: AlertTriangle,
  //         color: 'yellow' as ColorScheme,
  //         text: 'Medium'
  //       };
  //     default:
  //       return {
  //         icon: AlertTriangle,
  //         color: 'gray' as ColorScheme,
  //         text: 'Low'
  //       };
  //   }
  // };

  // Handle item click to open in artifact tab
  // const handleItemClick = (item: CustomListItemProps) => {
  //   const flag = item.originalData as RedFlag;
  //   if (!flag) return;

  //   const artifactId = `red-flag-${flag.id}`;
  //   const existingTab = artifactStore.tabs.find(tab => tab.id === artifactId);

  //   if (existingTab) {
  //     artifactStore.forceActivateTab(artifactId);
  //   } else {
  //     artifactStore.addTab({
  //       id: artifactId,
  //       title: `Red Flag - ${flag.description?.substring(0, 50)}...`,
  //       renderArtifact: () => (
  //         <div className="space-y-4 p-4">
  //           {/* Add detailed red flag content here */}
  //         </div>
  //       )
  //     });
  //   }

  //   artifactStore.setCollapsed(false);
  // };

  return (
    <motion.div
      className="space-y-6 px-2 min-w-0"
      variants={itemVariants}
      initial="hidden"
      animate="visible"
    >
      {activeMerchant ? (
        <InsolvencyPageHeader
          activeMerchant={activeMerchant}
          sections={[
            { id: 'red-flags-overview', title: 'Red Flags Overview' },
            { id: 'red-flags-details', title: 'Red Flags Details' }
          ]}
          onGenerateReport={handleGenerateReport}
          onDateChange={(date) => setSelectedDate(date)}
        />
      ) : (
        <CustomLoader 
          loading={true}
          specs={{
            type: 'spinner',
            size: 'lg',
            color: 'blue',
            text: 'Loading merchant information...'
          }}
        />
      )}
      
      {/* <ReportableSection type="insolvency-red-flags" data={reportData}> */}
        <SectionHeaderWithRedFlags
          redFlags={rawFlagsList}
          title="Insolvency Red Flags"
          icon={AlertTriangle}
          iconColorClass="text-red-600"
          // onReport={handleSectionReport}
          showRedFlagsInHeader={false}
        />
        
        <div className="mt-4">
          <CustomList
            items={listItems}
            //onItemClick={handleItemClick}
            loading={isLoading}
            loaderSpecs={{
              size: 'lg',
              color: 'red',
              type: 'spinner',
              text: 'Loading red flags...',
              textColor: 'red'
            }}
            showTimeline={true}
            showTimelineVisuals={false}
            showTimelineDatetime={true}
            disableInternalSorting={true}
            showToggleOptionCounts={true}
            primaryFilterGroup={[
            {
              id: 'severity',
              label: 'Severity',
              type: 'togglebuttons',
              options: severityOptions,
              selectedValues: filterSeverities,
              onFilterChange: setFilterSeverities,
              filterFunction: severityFilterFunction,
              showLabel: true,
            },
            {
              id: 'category',
              label: 'Category',
              type: 'multiselect',
              options: categoryOptions,
              selectedValues: selectedCategories,
              onFilterChange: setSelectedCategories,
              filterFunction: categoryFilterFunction,
              showLabel: true,
            },
            {
              id: 'search',
              label: 'Search',
              type: 'searchbar',
              options: [],
              selectedValues: [],
              onFilterChange: () => {},
              filterFunction: searchFilterFunction,
              showLabel: false,
              searchPlaceholder: 'Search red flags...',
              onSearchChange: setSearchQuery,
            }
          ]}
          emptyState={{
            icon: AlertTriangle,
            title: 'No red flags found',
            description: 'Try changing your filters or search query.'
          }}
        />
        </div>
      {/* </ReportableSection> */}

      {/* Hidden PDF Template */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={pdfTemplateRef}>
          {activeMerchant && (
            <RedFlagsPDFTemplate
              activeMerchant={activeMerchant}
              redFlags={rawFlagsList.map(flag => ({
                id: flag.id,
                description: flag.description,
                severity: flag.severity,
                rule_type: flag.rule_type,
                rule_name: flag.rule_name,
                rule_code: flag.rule_code,
                created_at: flag.created_at,
                metric_values: flag.metric_values ? Object.fromEntries(
                  Object.entries(flag.metric_values).map(([key, value]) => [
                    key, 
                    typeof value === 'string' && !isNaN(Number(value)) ? Number(value) : value
                  ])
                ) : undefined
              }))}
              merchantIndustry={merchantIndustry}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default InsolvencyRedFlagsTab;
