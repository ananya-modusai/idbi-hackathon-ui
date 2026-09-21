import { FC } from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
//import { StatCard } from '@/app/pages/Merchant/MerchantInvestigation/Overview/components/StatCard';
//import { getStatCards } from '@/app/pages/Merchant/MerchantInvestigation/Overview/utils/statCardUtils';
import { KeyMetric } from '@/app/types';
//import { EmptyState } from '@/app/pages/Merchant/MerchantInvestigation/Overview/components/EmptyState';
import { Card } from '@/components/ui/card';
import { Check, Plus, X } from 'lucide-react';
import { CollapseButton } from '@/components/custom/CollapseButton';
import { Button } from '@/components/ui/button';
import { ListFilter } from 'lucide-react';
import { StatCard } from '@/app/pages/Merchant/MerchantInsolvency/Components/StatCard';
import { EmptyState } from '@/app/pages/Merchant/MerchantInsolvency/Components/EmptyState';
import { getStatCards } from '@/app/pages/Merchant/MerchantInsolvency/Components/statCardUtils';
import CustomLoader from './CustomLoader';

interface SimpleMetric {
  label: string;
  value: string | number | React.ReactNode;
  icon: string;
}

interface KeyMetricsProps {
  keyMetricList?: {
    key_metrics: Array<SimpleMetric | KeyMetric>;
  };
  hardcodedMetrics?: Array<SimpleMetric | KeyMetric>;
  isMetricsExpanded: boolean;
  setIsMetricsExpanded: (value: boolean) => void;
  showCollapse?: boolean;
  showHeader?: boolean;
  selectionMode?: boolean;
  selectedMetrics?: Set<number>;
  onSelectionChange?: (selected: boolean, metric: SimpleMetric | KeyMetric, index: number) => void;
  onToggleSelectionMode?: () => void;
  gridCols?: number; // Number of columns in the grid (default: 4)
  isLoading?: boolean;
}

export const KeyMetrics: FC<KeyMetricsProps> = ({ 
  keyMetricList, 
  hardcodedMetrics,
  isMetricsExpanded, 
  setIsMetricsExpanded,
  showCollapse = true,
  showHeader = true,
  selectionMode = false,
  selectedMetrics = new Set(),
  onSelectionChange,
  onToggleSelectionMode,
  gridCols = 4,
  isLoading = false
}) => {
  // Use either backend data or hardcoded data
  const metrics = keyMetricList?.key_metrics || hardcodedMetrics || [];
  const hasData = metrics.length > 0;

  // Grid column classes mapping
  const gridColsClass = {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
  }[gridCols] || 'lg:grid-cols-4';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const renderMetrics = () => {
    if (metrics.length === 0) return null;

    // If first metric is KeyMetric type, use getStatCards
    if ('total_amount' in metrics[0]) {
      return getStatCards(metrics[0] as KeyMetric)
        .slice(0, isMetricsExpanded ? undefined : 4)
        .map((stat, index) => (
          <div key={index} className="relative">
            {selectionMode && (
              <button
                onClick={() => onSelectionChange?.(!selectedMetrics.has(index), metrics[0], index)}
                className={`absolute -top-2 -right-2 z-10 p-1.5 rounded-full transition-colors duration-200 ${
                  selectedMetrics.has(index)
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                {selectedMetrics.has(index) ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
              </button>
            )}
            <div className={`transition-opacity duration-200 ${selectionMode && !selectedMetrics.has(index) ? 'opacity-50' : 'opacity-100'}`}>
              <StatCard {...stat} />
            </div>
          </div>
        ));
    }

    // Otherwise render SimpleMetrics
    return metrics
      .slice(0, isMetricsExpanded ? undefined : 4)
      .map((metric, index) => {
        const simpleMetric = metric as SimpleMetric;
        
        // Handle icon name - could be plain string or HTML string
        let iconName = simpleMetric?.icon;
        if (iconName?.includes('<')) {
          // Extract from HTML string like '<Wallet className="h-5 w-5 text-green-500" />'
          const iconMatch = iconName.match(/<(\w+)/);
          iconName = iconMatch ? iconMatch[1] : 'TrendingUp';
        }
        
        const IconComponent = ((iconName && (LucideIcons[iconName as keyof typeof LucideIcons] as LucideIcon)) || LucideIcons.Activity) as LucideIcon;
        
        // Extract color from HTML string or use default
        const colorMatch = simpleMetric?.icon?.match(/text-(\w+)-\d+/);
        const colorClass = colorMatch ? colorMatch[1] : 'blue';
        
        return (
          <div key={index} className="relative">
            {selectionMode && (
              <button
                onClick={() => onSelectionChange?.(!selectedMetrics.has(index), simpleMetric, index)}
                className={`absolute -top-2 -right-2 z-10 p-1.5 rounded-full transition-colors duration-200 ${
                  selectedMetrics.has(index)
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                {selectedMetrics.has(index) ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
              </button>
            )}
            <div className={`transition-opacity duration-200 ${selectionMode && !selectedMetrics.has(index) ? 'opacity-50' : 'opacity-100'}`}>
              <StatCard 
                title={simpleMetric?.label || 'N/A'}
                value={(simpleMetric?.value !== undefined && simpleMetric.value !== null && simpleMetric.value !== '') ? simpleMetric.value : '-'}
                icon={<IconComponent className={`h-5 w-5 text-${colorClass}-500`} />}
              />
            </div>
          </div>
        );
      });
  };

  const shouldShowCollapse = () => {
    if (metrics.length === 0) return false;
    if ('total_amount' in metrics[0]) {
      return getStatCards(metrics[0] as KeyMetric).length > 4;
    }
    return metrics.length > 4;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 relative"
    >
      {showHeader && (
        <div className="flex justify-between items-center border-b pb-2">
          <div className="flex items-center space-x-2">
            {selectionMode && selectedMetrics.size > 0 && (
              <span className="text-sm text-gray-500">
                ({selectedMetrics.size} selected)
              </span>
            )}
          </div>
          {/* {onToggleSelectionMode && (
            <Button
              variant={selectionMode ? "outline" : "default"}
              size="sm"
              onClick={onToggleSelectionMode}
              className="flex items-center space-x-1"
            >
              {selectionMode ? <X className="h-4 w-4 mr-1" /> : <ListFilter className="h-4 w-4 mr-1" />}
              <span>{selectionMode ? "Cancel" : "Select Metrics"}</span>
            </Button>
          )} */}
        </div>
      )}
      <motion.div variants={containerVariants}>
        {hasData ? (
          <>
            <motion.div
              initial="hidden"
              animate="visible"
              className={`grid grid-cols-1 md:grid-cols-2 ${gridColsClass} gap-4`}
            >
              {renderMetrics()}
            </motion.div>
            {showCollapse && shouldShowCollapse() && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex justify-center mt-4"
              >
                <CollapseButton
                  isExpanded={isMetricsExpanded}
                  onClick={() => setIsMetricsExpanded(!isMetricsExpanded)}
                />
              </motion.div>
            )}
          </>
        ) : (
          <Card className="p-4">
            <EmptyState message="No Key Metrics available" />
          </Card>
        )}
      </motion.div>
      {isLoading && (
        <div className="absolute inset-0 z-[100] bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl min-h-[140px]">
          <CustomLoader loading={true} specs={{ size: 'lg', color: 'blue', text: 'Loading data...' }} />
        </div>
      )}
    </motion.div>
  );
};
