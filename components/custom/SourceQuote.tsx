import React from 'react';
import { FileText, Quote, Globe, LucideIcon } from 'lucide-react';
import CustomListItem, { CustomListItemProps } from './CustomList/customListItem';
import { getColorClasses } from './CustomColorScheme';

export interface SourceQuoteData {
  id: string;
  sourceSentence: string;
  pageNumber?: number;
  topSummary?: string;
  sourceName?: string;
  sourceType?: 'pdf' | 'website';
  sectionName?: string;
  sourceUrl?: string;
}

export interface SourceQuoteProps {
  data: SourceQuoteData;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  mainLeftIcon?: LucideIcon;
}

const SourceQuote: React.FC<SourceQuoteProps> = ({
  data,
  onClick,
  selected = false,
  disabled = false,
  className = '',
  mainLeftIcon
}) => {
  const {
    id,
    sourceSentence,
    pageNumber,
    topSummary,
    sourceName,
    sourceType,
    sectionName,
  } = data;

  // Get appropriate icon based on source type
  const getSourceIcon = () => {
    return sourceType === 'pdf' ? FileText : Globe;
  };

  // Get subtitle text based on source type
  const getSubtitleText = () => {
    if (!sourceName) return '';
    if (sourceType === 'pdf') {
      return sourceName;
    }
    return sourceName;
  };

  // Get bottom left content based on source type
  const getBottomLeftContent = () => {
    if (sourceType === 'pdf') {
      if (pageNumber) {
        return (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <FileText className="w-3 h-3" />
            <span>Page {pageNumber}</span>
          </div>
        );
      } else {
        return (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <FileText className="w-3 h-3" />
            <span>PDF Document</span>
          </div>
        );
      }
    }
    return (
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Globe className="w-3 h-3" />
        <span>Website</span>
      </div>
    );
  };

  // Transform data to CustomListItem props
  const listItemProps: CustomListItemProps = {
    itemID: id,
    title: topSummary,
    subtitle: getSubtitleText(),
    leftMainIcon: mainLeftIcon || Quote,
    themeColor: getColorClasses('blue'),
    mainContent: (
      <div className="bg-gray-50 border-l-4 border-blue-200 pl-3 py-2 rounded-r-md">
        <p className="text-sm text-gray-700 italic leading-relaxed">
          "{sourceSentence}"
        </p>
      </div>
    ),
    bottomLeftContent: sourceType ? getBottomLeftContent() : undefined,
    bottomRightContent: sectionName ? (
      <div className="text-xs text-gray-500">
        {sectionName}
      </div>
    ) : undefined,
    onClick,
    selected,
    disabled,
    className
  };

  return <CustomListItem {...listItemProps} />;
};

export default SourceQuote;

// Sample data for demonstration
export const sampleSourceQuotes: SourceQuoteData[] = [
  {
    id: 'quote-1',
    sourceSentence: 'The issuer shall ensure that all material information is disclosed in the prospectus as per SEBI regulations.',
    pageNumber: 15,
    topSummary: 'Material disclosure requirements for prospectus',
    sourceName: 'SEBI_ICDR_Regulations_2023.pdf',
    sourceType: 'pdf',
    sectionName: 'Chapter 3 - Disclosure Requirements'
  },
  {
    id: 'quote-2',
    sourceSentence: 'This is a minimal quote with only required fields.',
  },
  {
    id: 'quote-3',
    sourceSentence: 'Another example with some optional fields.',
    topSummary: 'Optional summary',
    sourceType: 'website'
  }
];
