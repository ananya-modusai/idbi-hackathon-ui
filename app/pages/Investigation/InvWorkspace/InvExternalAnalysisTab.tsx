'use client';

import React, { FC, useMemo, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInvestigationCaseStore } from '@/app/store/investigation/investigationCaseStore';
import InvPageHeader from '../Components/InvPageHeader';
import {  } from '@/app/services/caseServices';
import { CustomTableView } from '@/components/custom/CustomTableView';
import { getTextColorClass, ColorScheme } from '@/components/custom/CustomColorScheme';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import { iconRegistry, valueSentimentIconMap, getIconByName, type ValueSentiment } from '@/components/custom/CustomIconScheme';
import type { LucideIcon } from 'lucide-react';
import { WebsiteAnalysisKeyValue, WebsiteAnalysisValueSentiment, WebsiteAnalysisIconName } from '../Sample Data/InvCasesSampleData';
import { EmptyState } from '@/app/pages/Investigation/Components/EmptyState';
import {
  formatFieldName,
  transformToKeyValue,
  getSocialMediaPlatforms,
  transformKeyValueData,
  getSelectedPlatformData,
  getSelectedSocialMediaData,
  getAllPlatformUrlEntries,
  type SocialMediaPlatform
} from './InvWebDataLogic';

// Helper to turn plain text URLs into clickable links while preserving newlines
const linkifyNodes = (text: string): React.ReactNode => {
  if (!text) return null;

  // Matches http(s)://... or www....
  const urlRegex = /\b(https?:\/\/[^\s]+|www\.[^\s]+)\b/g;

  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = urlRegex.exec(line)) !== null) {
      const urlText = match[0];
      const idx = match.index;

      // push text before match
      if (idx > lastIndex) {
        nodes.push(line.substring(lastIndex, idx));
      }

      // ensure href has protocol
      const href = urlText.startsWith('http') ? urlText : `https://${urlText}`;

      nodes.push(
        <a
          key={`link-${lineIdx}-${idx}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline break-words"
        >
          {urlText}
        </a>
      );

      lastIndex = idx + urlText.length;
    }

    if (lastIndex < line.length) {
      nodes.push(line.substring(lastIndex));
    }

    // add explicit line break except after last line
    if (lineIdx < lines.length - 1) {
      nodes.push(<br key={`br-${lineIdx}`} />);
    }
  });

  return <>{nodes}</>;
};

interface InvExternalAnalysisTabProps {
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
        {linkifyNodes(textToRender)}
      </div>
      {/* Visible div with truncation */}
      <div
        ref={textRef}
        className={`${baseClasses} ${!isExpanded && needsTruncation ? 'line-clamp-4' : ''}`}
      >
        {linkifyNodes(textToRender)}
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


const InvExternalAnalysisTab: FC<InvExternalAnalysisTabProps> = ({ merchantId, caseId }) => {
  const { selectedCase } = useInvestigationCaseStore();
  const showValueIcons = true;

  const [websiteDataJson, setWebsiteDataJson] = useState<any | null>(null);


  // Social media platforms configuration (derived from API data)
  const socialMediaPlatforms = useMemo(() => {
    if (!websiteDataJson) return [];
    return getSocialMediaPlatforms(websiteDataJson);
  }, [websiteDataJson]);

  // State for selected social media platform
  const [selectedSocialMediaPlatform, setSelectedSocialMediaPlatform] = useState<string>('');

  // Update state when platforms are available (defaults to first available)
  useEffect(() => {
    if (socialMediaPlatforms.length > 0) {
      if (!selectedSocialMediaPlatform || !socialMediaPlatforms.find(p => p.name === selectedSocialMediaPlatform)) {
        setSelectedSocialMediaPlatform(socialMediaPlatforms[0].name);
      }
    }
  }, [socialMediaPlatforms, selectedSocialMediaPlatform]);

  // Fetch website JSON data (Removed: deprecated API)
  useEffect(() => {
    setWebsiteDataJson(null);
  }, [caseId, selectedCase?.caseId]);

  // Get selected platform data
  const selectedPlatformData = useMemo(() => {
    return getSelectedPlatformData(socialMediaPlatforms, selectedSocialMediaPlatform);
  }, [socialMediaPlatforms, selectedSocialMediaPlatform]);

  // Get all URL entries for the selected platform
  const platformUrlEntries = useMemo(() => {
    return getAllPlatformUrlEntries(selectedPlatformData);
  }, [selectedPlatformData]);

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

  // Standard columns for key-value pair data
  const keyValueColumns = useMemo(() => {
    return [
      {
        key: 'field',
        header: 'Field',
        width: '180px',
        align: 'left' as const,
        verticalAlign: 'top' as const,
        render: (_value: string, row: Record<string, any>) => {
          const rowData = row as WebsiteAnalysisKeyValue;
          const IconComponent = websiteIconRegistry[rowData.keyIcon];
          // Format field name: capitalize first letter, replace underscores, make special words all caps
          const formattedField = formatFieldName(rowData.field, true);

          return (
            <span className="flex items-start gap-2">
              {IconComponent && (
                <IconComponent
                  className={`h-4 w-4 mt-0.5 shrink-0 ${getTextColorClass('gray')}`}
                />
              )}
              <span className={`font-bold ${getTextColorClass('gray')}`}>{formattedField}</span>
            </span>
          );
        }
      },
      {
        key: 'value',
        header: 'Value',
        width: '600px',
        align: 'left' as const,
        verticalAlign: 'top' as const,
        render: (value: string | string[], row: Record<string, any>) => {
          const rowData = row as WebsiteAnalysisKeyValue;
          const sentimentConfig =
            typedValueSentimentIconMap[rowData.valueSentiment] ?? typedValueSentimentIconMap.info;
          const ValueIcon = sentimentConfig.Icon;
          const textToRender = value ?? '-';
          // Force value icons and text to gray; keep links and show-more button blue
          const textColorClass = 'text-gray-900';

          return (
            <div className={`flex items-start gap-2`}>
              {showValueIcons && ValueIcon && (
                <ValueIcon
                  className={`h-4 w-4 mt-0.5 shrink-0 text-gray-500`}
                />
              )}
              <TruncatableText
                text={textToRender}
                textColorClass={textColorClass}
              />
            </div>
          );
        }
      }
    ];
  }, []);

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





      {/* Unified Social Media Platforms Section with Toggle */}
      {socialMediaPlatforms.length > 0 && (
        <div>
          <motion.div variants={itemVariants}>
            <SectionHeaderWithFlags
              title="Social Media Verification"
              icon={getIconByName('Users')!}
              iconColorClass="text-gray-500"
              titleColorClass="text-blue-700"
              extremeNegativeFlags={[]}
              negativeFlags={[]}
              mildNegativeFlags={[]}
              neutralFlags={[]}
              mildPositiveFlags={[]}
              positiveFlags={[]}
              flagTypeOrderList={[]}
              initialRowLimit={5}
              allowCollapse={false}
              defaultExpanded={false}
              // toggles={socialMediaPlatforms.length > 0 ? [
              //   {
              //     id: 'socialPlatform',
              //     options: socialMediaPlatforms.map(p => p.name),
              //     selectedOption: selectedSocialMediaPlatform,
              //     onOptionChange: (option: string) => setSelectedSocialMediaPlatform(option),
              //     position: 'right',
              //     size: 'normal'
              //   }
              // ] : undefined}
            />
          </motion.div>

          {/* Common Toggle for Platform Selection */}
          {socialMediaPlatforms.length > 1 && (
            <motion.div variants={itemVariants} className="mt-4 mb-2">
              <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
                {socialMediaPlatforms.map((platform) => (
                  <button
                    key={platform.name}
                    onClick={() => setSelectedSocialMediaPlatform(platform.name)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      selectedSocialMediaPlatform === platform.name
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {platform.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {platformUrlEntries.length > 0 ? (
            platformUrlEntries
              .map((urlEntry, index) => {
                // Transform data for this specific URL entry
                const urlEntryData = getSelectedSocialMediaData(urlEntry.data);
                
                if (!urlEntryData || urlEntryData.length === 0) {
                  return null;
                }

                return (
                  <motion.div key={`${urlEntry.url}-${index}`} variants={itemVariants} className="mb-2">
                    <CustomTableView
                      headerAndTotalRowBg="gray-100"
                      columns={keyValueColumns}
                      data={transformKeyValueData(urlEntryData)}
                      initialRowLimit={urlEntryData.length}
                      isExpanded={true}
                      showCSVExport={false}
                      enableAlternatingRows={true}
                      alternatingRowColor="gray"
                    />
                  </motion.div>
                );
              })
              .filter(Boolean)
          ) : (
            <motion.div variants={itemVariants}>
              <EmptyState message="No data available for selected social media platform" />
            </motion.div>
          )}
        </div>
      )}

      {socialMediaPlatforms.length === 0 && (
        <motion.div variants={itemVariants}>
          <EmptyState message="No social media platform data available" />
        </motion.div>
      )}
    </motion.div>
  );
};

export default InvExternalAnalysisTab;

