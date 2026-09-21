'use client';

import React, { FC, useMemo, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { KeyMetrics } from '@/components/custom/KeyMetrics';
import { useInvestigationCaseStore } from '@/app/store/investigation/investigationCaseStore';
import InvPageHeader from '../Components/InvPageHeader';
import {
  invThreeWayMatchData,
  CellDataValue,
  RedFlag,
  WebsiteAnalysisValueSentiment,
  WebsiteAnalysisIconName,
  KeyValueWithIcons
  , CaseThreeWayMatchData
} from '../Sample Data/InvCasesSampleData';
import { fetchThreeWayMatch, fetchExternalInsights } from '@/app/services/caseServices';
import { CustomTableView } from '@/components/custom/CustomTableView';
import { getTextColorClass, ColorScheme } from '@/components/custom/CustomColorScheme';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import { iconRegistry, valueSentimentIconMap, getIconByName } from '@/components/custom/CustomIconScheme';
import type { LucideIcon } from 'lucide-react';
import CustomLoader from '@/components/custom/CustomLoader';
import { EmptyState } from '@/app/pages/Investigation/Components/EmptyState';

interface InvMerchantAnalysisTabProps {
  merchantId?: string;
  caseId?: string;
}

// Component for truncating text with show more/less toggle
const TruncatableText: FC<{
  text: string | string[];
  textColorClass: string;
  isSummary?: boolean;
  additionalClassName?: string;
}> = ({ text, textColorClass, isSummary = false, additionalClassName = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Measure if content exceeds 4 lines
    const checkTruncation = () => {
      if (measureRef.current && textRef.current) {
        const fullHeight = measureRef.current.scrollHeight;
        const lineHeight = parseFloat(getComputedStyle(measureRef.current).lineHeight) || 20;
        const maxHeight = lineHeight * 4;
        setNeedsTruncation(fullHeight > maxHeight);
      }
    };

    // Check immediately and after a short delay to account for layout
    checkTruncation();
    const timeoutId = setTimeout(checkTruncation, 100);
    
    return () => clearTimeout(timeoutId);
  }, [text]);

  const textToRender = Array.isArray(text) ? text.join('\n') : text;
  const fontClass = additionalClassName.includes('font-') ? '' : 'font-normal';
  const baseClasses = `whitespace-pre-wrap ${fontClass} ${textColorClass} ${additionalClassName}`;

  return (
    <div className="w-full relative">
      {/* Hidden div to measure full height */}
      <div
        ref={measureRef}
        className={`${baseClasses} invisible absolute`}
        style={{ width: textRef.current?.offsetWidth || '100%' }}
      >
        {textToRender}
      </div>
      {/* Visible div with truncation */}
      <div
        ref={textRef}
        className={`${baseClasses} ${!isExpanded && needsTruncation ? 'line-clamp-4' : ''}`}
      >
        {textToRender}
      </div>
      {needsTruncation && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 underline text-sm mt-1 cursor-pointer"
          type="button"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
};

// Component for column header with circular badge
const ColumnHeaderWithBadge: FC<{ letter: string; title: string }> = ({ letter, title }) => {
  return (
    <div className="flex items-center gap-2">
      <span>{title}</span>
      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-xs font-medium">
        {letter}
      </div>
    </div>
  );
};

const InvMerchantAnalysisTab: FC<InvMerchantAnalysisTabProps> = ({ merchantId, caseId }) => {
  const { selectedCase } = useInvestigationCaseStore();
  // Temporary toggle to show/hide Datapoint column
  const [showDatapointColumn] = useState(true);
  // Control value icons visibility via code (set to false to hide icons)
  const showValueIcons = true;

  const threeWayMatchData = useMemo(() => {
    if (!caseId || !invThreeWayMatchData[caseId]) {
      return null;
    }
    return invThreeWayMatchData[caseId];
  }, [caseId]);

  // Live API data (overrides the sample data when available)
  const [liveThreeWayMatchData, setLiveThreeWayMatchData] = useState<CaseThreeWayMatchData | null>(null);
  const [threeWayLoading, setThreeWayLoading] = useState(false);
  const [threeWayError, setThreeWayError] = useState<string | null>(null);

  // Live external insights (used for header flags)
  const [liveExternalInsights, setLiveExternalInsights] = useState<any | null>(null);
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalError, setExternalError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const id = caseId || selectedCase?.caseId;
    if (!id) return;

    setThreeWayLoading(true);
    setThreeWayError(null);

    fetchThreeWayMatch(id)
      .then((resp) => {
        if (!mounted) return;
        if (resp && resp.data) {
          const shaped: CaseThreeWayMatchData = {
            caseId: resp.caseId || id,
            analysisCategory: resp.analysisCategory,
            data: resp.data,
            redFlags: resp.redFlags || []
          } as CaseThreeWayMatchData;

          setLiveThreeWayMatchData(shaped);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('[InvMerchantAnalysisTab] fetchThreeWayMatch error', err);
        setThreeWayError(String(err ?? 'Unknown error'));
      })
      .finally(() => {
        if (!mounted) return;
        setThreeWayLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [caseId, selectedCase?.caseId]);

  // Key metrics expansion state for the Summary Only section
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);

  // Fetch external-insights for flags (prefer this for section header)
  useEffect(() => {
    let mounted = true;
    const id = caseId || selectedCase?.caseId;
    if (!id) return;

    setExternalLoading(true);
    setExternalError(null);

    fetchExternalInsights(id)
      .then((resp) => {
        if (!mounted) return;
        if (resp && (resp.redFlags || resp.data)) {
          setLiveExternalInsights(resp);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('[InvMerchantAnalysisTab] fetchExternalInsights error', err);
        setExternalError(String(err ?? 'Unknown error'));
      })
      .finally(() => {
        if (!mounted) return;
        setExternalLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [caseId, selectedCase?.caseId]);

  // Transform red flags to match SectionHeaderWithFlags format
  const transformedFlags = useMemo(() => {
    // Prefer external insights redFlags for the section header; fall back to three-way match (live or sample)
    const source = (liveExternalInsights && liveExternalInsights.redFlags) ? liveExternalInsights : (liveThreeWayMatchData || threeWayMatchData);
    if (!source || !source.redFlags) {
      return {
        extremeNegativeFlags: [],
        negativeFlags: [],
        mildNegativeFlags: [],
        neutralFlags: [],
        mildPositiveFlags: [],
        positiveFlags: []
      };
    }

    const extremeNegativeFlags: any[] = [];
    const negativeFlags: any[] = [];
    const mildNegativeFlags: any[] = [];
    const neutralFlags: any[] = [];

    source.redFlags.forEach((redFlag: RedFlag) => {
      // Map severity from RedFlag to SectionHeaderWithFlags format
      // Only High, Medium, and Low severities for red flags
      const severityMap: Record<string, 'high' | 'medium' | 'low'> = {
        'High': 'high',
        'Medium': 'medium',
        'Low': 'low'
      };

      const transformedFlag = {
        id: redFlag.code,
        description: `${redFlag.redFlag}. ${redFlag.reasoning}`,
        isPositive: false,
        category: redFlag.code,
        severity: (severityMap[redFlag.severity] || 'medium') as 'severe' | 'high' | 'medium' | 'low' | 'neutral' | 'good' | 'veryGood'
      };

      // Group by severity - all red flags are negative
      if (redFlag.severity === 'High') {
        negativeFlags.push(transformedFlag);
      } else if (redFlag.severity === 'Medium') {
        mildNegativeFlags.push(transformedFlag);
      } else if (redFlag.severity === 'Low') {
        neutralFlags.push(transformedFlag);
      } else {
        neutralFlags.push(transformedFlag);
      }
    });

    return {
      extremeNegativeFlags,
      negativeFlags,
      mildNegativeFlags,
      neutralFlags,
      mildPositiveFlags: [],
      positiveFlags: []
    };
  }, [liveExternalInsights, liveThreeWayMatchData, threeWayMatchData]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Use centralized icon registry
  const websiteIconRegistry = iconRegistry as Record<WebsiteAnalysisIconName, LucideIcon>;
  
  // Use centralized sentiment icon map
  const typedValueSentimentIconMap = valueSentimentIconMap as Record<WebsiteAnalysisValueSentiment, { Icon: LucideIcon; color: ColorScheme }>;

  // Helper function to format insight with sentiment icon before title
  const formatInsight = (
    type: string,
    value: string,
    sentiment?: WebsiteAnalysisValueSentiment
  ): React.ReactNode => {
    // Get sentiment icon if available
    const sentimentConfig = sentiment && typedValueSentimentIconMap
      ? typedValueSentimentIconMap[sentiment]
      : null;
    const SentimentIcon = sentimentConfig ? sentimentConfig.Icon : null;
    const sentimentColorClass = sentimentConfig ? getTextColorClass(sentimentConfig.color) : '';
    
    return (
      <div className="flex items-start gap-2">
        {SentimentIcon && (
          <SentimentIcon
            className={`h-4 w-4 mt-0.5 shrink-0 ${sentimentColorClass}`}
          />
        )}
        <div className="flex items-start gap-2">
          <span className="font-bold">{type}</span>
          <span>:</span>
          <span>{value}</span>
        </div>
      </div>
    );
  };

  const isValueWithIcons = (
    value: string | string[] | KeyValueWithIcons
  ): value is KeyValueWithIcons => {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      'value' in value
    );
  };

  const normalizeCellEntryValue = (
    value: string | string[] | KeyValueWithIcons
  ): KeyValueWithIcons => {
    if (isValueWithIcons(value)) {
      return value;
    }
    return { value };
  };

  const renderCellData = (data: CellDataValue): React.ReactNode => {
    if (typeof data !== 'object' || data === null) {
      return null;
    }

    const entries = Object.entries(data);

    return (
      <div>
        {entries.map(([key, rawValue], index) => {
          const normalizedValue = normalizeCellEntryValue(rawValue);
          const KeyIconComponent = normalizedValue.keyIcon
            ? websiteIconRegistry[normalizedValue.keyIcon as WebsiteAnalysisIconName]
            : null;
          const keyIconColorClass = getTextColorClass(normalizedValue.keyIconColor ?? 'gray');
          const sentimentConfig = normalizedValue.valueSentiment
            ? typedValueSentimentIconMap[normalizedValue.valueSentiment]
            : valueSentimentIconMap.info;
          const valueColorClass = getTextColorClass(sentimentConfig.color);
          const ValueIcon = sentimentConfig.Icon;
          const valueContent = normalizedValue.value;

          return (
            <div key={index}>
              {index > 0 && <div className="h-px bg-gray-200 my-3"></div>}

              <div className="flex items-start gap-2">
                {KeyIconComponent && (
                  <KeyIconComponent
                    className={`h-4 w-4 mt-0.5 shrink-0 ${keyIconColorClass}`}
                  />
                )}
                <div className={`font-bold ${getTextColorClass('gray')}`}>{key}:</div>
              </div>

              <div className="mt-1 flex items-start gap-2">
                {showValueIcons && ValueIcon && (
                  <ValueIcon className={`h-4 w-4 mt-0.5 shrink-0 ${valueColorClass}`} />
                )}
                <TruncatableText
                  text={valueContent}
                  textColorClass={valueColorClass}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Transform data for CustomTableView
  const tableData = useMemo(() => {
    const source = liveThreeWayMatchData || threeWayMatchData;
    if (!source || !source.data) return [];

    return source.data.map((row: any) => ({
      datapoint: row.datapoint,
      merchantData: row.merchantData,
      mcaData: row.mcaData,
      websiteData: row.websiteData,
    }));
  }, [liveThreeWayMatchData, threeWayMatchData]);

  const columns = useMemo(() => {
    const baseColumns = [
      {
        key: 'merchantData',
        header: <ColumnHeaderWithBadge letter="A" title="Merchant Data" />,
        minWidth: '250px',
        align: 'left' as const,
        verticalAlign: 'top' as const,
        render: (value: CellDataValue) => renderCellData(value)
      },
      {
        key: 'mcaData',
        header: <ColumnHeaderWithBadge letter="B" title="MCA Fetch" />,
        minWidth: '250px',
        align: 'left' as const,
        verticalAlign: 'top' as const,
        render: (value: CellDataValue) => renderCellData(value)
      },
      {
        key: 'websiteData',
        header: <ColumnHeaderWithBadge letter="C" title="Website Data" />,
        minWidth: '250px',
        align: 'left' as const,
        verticalAlign: 'top' as const,
        render: (value: CellDataValue) => renderCellData(value)
      }
    ];

    // Conditionally add Datapoint column based on toggle
    if (showDatapointColumn) {
      return [
        {
          key: 'datapoint',
          header: 'Datapoint',
          minWidth: '120px',
          align: 'left' as const,
          verticalAlign: 'top' as const,
          render: (value: string) => <span className="font-medium">{value}</span>
        },
        ...baseColumns
      ];
    }

    return baseColumns;
  }, [showDatapointColumn]);

  const hasActiveCase = useMemo(() => Boolean(caseId || selectedCase?.caseId), [caseId, selectedCase?.caseId]);

  return (
    <motion.div
      className="space-y-6 px-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {selectedCase && (
        <motion.div variants={itemVariants}>
          <InvPageHeader activeCase={selectedCase} />
        </motion.div>
      )}

      {/* Summary Only section showing key metrics */}
      {selectedCase && (
        <motion.div variants={itemVariants}>
          <SectionHeaderWithFlags
            title="Summary"
            icon={getIconByName('FileText') || undefined}
            iconColorClass="text-blue-600"
            titleColorClass="text-blue-700"
            extremeNegativeFlags={[]}
            negativeFlags={[]}
            mildNegativeFlags={[]}
            neutralFlags={[]}
            mildPositiveFlags={[]}
            positiveFlags={[]}
            flagTypeOrderList={['extremeNegative', 'negative', 'mildNegative', 'neutral', 'mildPositive', 'positive']}
            initialRowLimit={5}
            allowCollapse={false}
            defaultExpanded={false}
          />
          <div className="bg-white pt-3 pb-4 space-y-4 border-b border-gray-200">
            {/* Build simple metrics from selectedCase.keyStats with sensible fallbacks */}
            {(() => {
              const ks = selectedCase.keyStats || {} as any;
              const summaryOnlyMetrics = [
                { label: 'Type', value: ks.orgType || 'Private Limited', icon: 'Users' },
                { label: 'Location', value: ks.state || 'Telangana', icon: 'MapPin' },
                { label: 'GST', value: (ks.gstFlag === true ? 'Y' : (ks.gstFlag === false ? 'N' : '-')), icon: 'ShieldCheck' },
                { label: 'GMV (i)', value: ks.gmvI?? '0', icon: 'DollarSign' },
                { label: 'Failed GMV (i)', value: ks.failedGmvI?? '0', icon: 'X' },
                { label: 'IPG GMV(i)', value: ks.ipgGmvI?? '0', icon: 'CreditCard' },
                { label: 'Transaction count', value: ks.transactionCount ?? '0', icon: 'Activity' },
                { label: 'Distinct Cards', value: ks.distinctCards ?? '0', icon: 'CreditCard' }
              ];

              return (
                <KeyMetrics
                  hardcodedMetrics={summaryOnlyMetrics}
                  isMetricsExpanded={isMetricsExpanded}
                  setIsMetricsExpanded={setIsMetricsExpanded}
                  showCollapse={true}
                  showHeader={false}
                />
              );
            })()}
          </div>
        </motion.div>
      )}

      {/* {selectedCase && (
        <motion.div variants={itemVariants} className="space-y-0">
          <SectionHeaderWithFlags
            title="Summary"
            icon={getIconByName('FileText') || undefined}
            iconColorClass="text-blue-600"
            titleColorClass="text-blue-700"
            extremeNegativeFlags={[]}
            negativeFlags={[]}
            mildNegativeFlags={[]}
            neutralFlags={[]}
            mildPositiveFlags={[]}
            positiveFlags={[]}
            flagTypeOrderList={['extremeNegative', 'negative', 'mildNegative', 'neutral', 'mildPositive', 'positive']}
            initialRowLimit={5}
            allowCollapse={false}
            defaultExpanded={false}
          />
          <div className="bg-white pt-3 pb-4 px-4 space-y-4 border-b border-gray-200">
              {selectedCase.keyStats && (
                <div className="text-sm text-gray-700">
                  <p className="mb-2">
                    The merchant is a <span className="font-semibold">{selectedCase.keyStats.orgType || '_____'}</span> organization 
                    located in <span className="font-semibold">{selectedCase.keyStats.state || '_____'}</span>, 
                    operating as a <span className="font-semibold">{selectedCase.keyStats.merchantType || '_____'}</span> merchant. 
                    The merchant was onboarded on <span className="font-semibold">{selectedCase.keyStats.onboardedOn || '_____'}</span>, 
                    with MCC Code <span className="font-semibold">{selectedCase.keyStats.mccCode || '_____'}</span> - 
                    <span className="font-semibold">{selectedCase.keyStats.mccDescription || '_____'}</span>, 
                    and has a Total GMV of <span className="font-semibold">{selectedCase.keyStats.totalGMV || '_____'}</span>.
                  </p>
                </div>
              )}
              {selectedCase.insightsSummary && selectedCase.insightsSummary.length > 0 && (
                <div className="text-sm text-gray-700 space-y-0">
                  {selectedCase.insightsSummary.map((insight, index) => (
                    <div key={index}>
                      {formatInsight(insight.type, insight.value, insight.valueSentiment)}
                    </div>
                  ))}
                </div>
              )}
              {!selectedCase.keyStats && (!selectedCase.insightsSummary || selectedCase.insightsSummary.length === 0) && (
                <div className="text-sm text-gray-500 text-center py-2">
                  No data found
                </div>
              )}
            </div>
        </motion.div>
      )} */}

      <motion.div variants={itemVariants}>
        <SectionHeaderWithFlags
          title="Three-Way Match"
          icon={getIconByName('Flag') || undefined}
          iconColorClass="text-blue-600"
          titleColorClass="text-blue-700"
          extremeNegativeFlags={transformedFlags.extremeNegativeFlags}
          negativeFlags={transformedFlags.negativeFlags}
          mildNegativeFlags={transformedFlags.mildNegativeFlags}
          neutralFlags={transformedFlags.neutralFlags}
          mildPositiveFlags={transformedFlags.mildPositiveFlags}
          positiveFlags={transformedFlags.positiveFlags}
          flagTypeOrderList={['extremeNegative', 'negative', 'mildNegative', 'neutral', 'mildPositive', 'positive']}
          initialRowLimit={5}
          allowCollapse={true}
          defaultExpanded={true}
        />
      </motion.div>
      
  {(liveThreeWayMatchData || threeWayMatchData) && (liveThreeWayMatchData || threeWayMatchData)!.data.length > 0 ? (
        <motion.div variants={itemVariants}>
          <CustomTableView
            headerAndTotalRowBg="gray-100"
            columns={columns}
            data={tableData}
            initialRowLimit={tableData.length}
            isExpanded={true}
            showCSVExport={false}
            enableAlternatingRows={true}
            alternatingRowColor="gray"
          />
        </motion.div>
      ) : (
        <>
          {threeWayLoading || externalLoading ? (
            <motion.div variants={itemVariants}>
              <CustomLoader loading={true} specs={{ text: 'Loading three-way match...' }} />
            </motion.div>
          ) : (liveThreeWayMatchData || threeWayMatchData) && (liveThreeWayMatchData || threeWayMatchData)!.data.length > 0 ? (
            <motion.div variants={itemVariants}>
              <CustomTableView
                headerAndTotalRowBg="gray-100"
                columns={columns}
                data={tableData}
                initialRowLimit={tableData.length}
                isExpanded={true}
                showCSVExport={false}
                enableAlternatingRows={true}
                alternatingRowColor="gray"
              />
            </motion.div>
          ) : (
            <motion.div variants={itemVariants}>
              <EmptyState message="No data available for Three-Way Match" />
              {merchantId && <p className="text-sm text-gray-500 mt-2">Merchant ID: {merchantId}</p>}
              {caseId && <p className="text-sm text-gray-500 mt-2">Case ID: {caseId}</p>}
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default InvMerchantAnalysisTab;

