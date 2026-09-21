'use client';

import React, { FC } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import { CustomTableView } from '@/components/custom/CustomTableView';
import { EmptyState } from '@/app/pages/Investigation/Components/EmptyState';
import { WebsiteAnalysisKeyValue } from '../../Sample Data/InvCasesSampleData';

interface WebAnalysisSectionProps {
  title: string;
  icon: LucideIcon;
  data: WebsiteAnalysisKeyValue[] | null;
  columns: any[];
  removePrefix?: boolean;
  toggleOptions?: string[];
  selectedToggleOption?: string;
  onToggleOptionChange?: (option: string) => void;
  toggles?: Array<{
    id: string;
    options: string[];
    selectedOption: string;
    onOptionChange: (option: string) => void;
    position?: 'left' | 'right';
      size?: 'normal' | 'small';
  }>;
  className?: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const WebAnalysisSection: FC<WebAnalysisSectionProps> = ({
  title,
  icon,
  data,
  columns,
  removePrefix = false,
  toggleOptions,
  selectedToggleOption,
  onToggleOptionChange,
  toggles,
  className = ''
}) => {
  const tableData = data ? data.map((row) => ({
    field: row.field,
    value: row.value,
    keyIcon: row.keyIcon,
    keyIconColor: row.keyIconColor,
    valueSentiment: row.valueSentiment,
    ...(row as any).isFrequentWords !== undefined && { isFrequentWords: (row as any).isFrequentWords }
  })) : [];

  // Note: This component is kept for potential future use, but the main component
  // handles column rendering directly for better control
  const columnsToUse = columns;

  return (
    <div className={`w-full ${className}`}>
      <motion.div variants={itemVariants}>
        <SectionHeaderWithFlags
          title={title}
          icon={icon}
          iconColorClass="text-gray-500"
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
          defaultExpanded={true}
          toggles={toggles}
        />
      </motion.div>
      
      {data && data.length > 0 ? (
        <motion.div variants={itemVariants} className="mt-4">
          <CustomTableView
            headerAndTotalRowBg="gray-100"
            columns={columnsToUse}
            data={tableData}
            initialRowLimit={tableData.length}
            isExpanded={true}
            showCSVExport={false}
            enableAlternatingRows={true}
            alternatingRowColor="gray"
            toggleOptions={toggleOptions}
            selectedToggleOption={selectedToggleOption}
            onToggleOptionChange={onToggleOptionChange}
            togglePosition="right"
          />
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="mt-4">
          <EmptyState message={`No data available for ${title}`} />
        </motion.div>
      )}
    </div>
  );
};

