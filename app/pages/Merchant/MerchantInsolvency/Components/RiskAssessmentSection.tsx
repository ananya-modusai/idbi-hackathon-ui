import { FC, useMemo, useState } from 'react';
import { AlertTriangle, AlertOctagon, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { TabSectionHeading } from '@/components/custom/TabSectionHeading';
import { CustomCard } from '@/components/custom/CustomCard';
import { ToggleTabs } from '@/components/custom/ToggleTabs';
import { RiskAssessment } from '@/app/types';
import { calculateRiskScore, getRiskLevel, redFlagsData } from '@/app/data/hardcodeddata/sampleRedFlagsData';
import { RiskIndicator } from './RiskIndicator';

type ComparisonType = 'all_merchants' | 'business_category';

interface RiskAssessmentProps {
  riskAssessment: RiskAssessment | null;
  keyMetricList: {
    key_metrics: Array<{
      business_category: string;
    }>;
  };
}

export const RiskAssessmentSection: FC<RiskAssessmentProps> = ({ riskAssessment, keyMetricList }) => {
  if (!riskAssessment) return null;

  const [comparisonType, setComparisonType] = useState<ComparisonType>('all_merchants');

  const getScore = () => {
    return comparisonType === 'all_merchants' 
      ? Number(riskAssessment.overall.percentile) 
      : Number(riskAssessment.business_category.percentile);
  };

  const riskScore = useMemo(() => calculateRiskScore(redFlagsData.flags), [redFlagsData.flags]);
  const riskLevel = useMemo(() => getRiskLevel(riskScore), [riskScore]);

  // Use quartiles from the data instead of mock values
  const getRiskScoreLabels = () => {
    const quartiles = comparisonType === 'all_merchants' 
      ? riskAssessment.overall.quartiles 
      : riskAssessment.business_category.quartiles;

    return {
      'P0': quartiles.q0,
      'P25': quartiles.q1,
      'P50': quartiles.q2,
      'P75': quartiles.q3,
      'P100': riskAssessment.overall.max_score
    };
  };

  const getRiskIcon = (riskLevel: string | null) => {
    if (!riskLevel) return <ShieldCheck className="h-4 w-4 text-gray-500" />;
    switch (riskLevel.toLowerCase()) {
      case 'high':
      case 'severe': return <AlertOctagon className="h-4 w-4 text-red-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <ShieldCheck className="h-4 w-4 text-green-500" />;
    }
  };

  const getRiskColor = (riskLevel: string | null) => {
    if (!riskLevel) return "text-gray-600";
    switch (riskLevel.toLowerCase()) {
      case 'severe': return "text-red-600";
      case 'high': return "text-orange-600";
      case 'medium': return "text-yellow-600";
      default: return "text-green-600";
    }
  };

  const getRiskBgColor = (riskLevel: string | null) => {
    if (!riskLevel) return "bg-gray-100";
    switch (riskLevel.toLowerCase()) {
      case 'severe': return "bg-red-100";
      case 'high': return "bg-orange-100";
      case 'medium': return "bg-yellow-100";
      default: return "bg-green-100";
    }
  };

  const getPercentileText = () => {
    const percentile = comparisonType === 'all_merchants'
      ? riskAssessment.overall.percentile
      : riskAssessment.business_category.percentile;
    
    const businessCategory = keyMetricList?.key_metrics[0]?.business_category || 'same business category';
    
    const baseText = 'Higher risk than ';
    const comparisonText = comparisonType === 'all_merchants'
      ? '% of all merchants'
      : `% of ${businessCategory} merchants`;
    
    return `${baseText}${percentile} ${comparisonText}`;
  };

  // Animation variants
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

  return (
    <motion.div
      className="space-y-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* <TabSectionHeading icon={AlertTriangle} iconColorClass="text-red-500">
        Overall Risk Assessment
      </TabSectionHeading> */}
      <CustomCard className="p-4">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${getRiskBgColor(riskLevel)} ${getRiskColor(riskLevel)}`}>
                <span className="text-base font-semibold">
                  {riskScore || 0}
                </span>
              </div>
              
              <div className="flex items-center gap-2">                
                <span className={`text-sm font-medium ${getRiskColor(riskLevel)}`}>
                  {riskLevel} Risk Merchant
                </span>
                {getRiskIcon(riskAssessment.risk_level)}
                <span className="text-xs text-gray-600">
                  ({getPercentileText()})
                </span>
              </div>
            </div>
            <ToggleTabs
              value={comparisonType}
              onValueChange={(value) => setComparisonType(value as ComparisonType)}
              options={[
                { value: 'all_merchants', label: 'All merchants' },
                { value: 'business_category', label: "Business category" }
              ]}
            />
          </div>
          
          <div className="space-y-4">
            <div>
              <RiskIndicator
                score={riskScore || 0} 
                type="risk-score" 
                min={0} 
                max={1000}
                labelsFirst={true} 
                riskScoreLabels={getRiskScoreLabels()}
                comparisonType={comparisonType}
              />
            </div>
          </div>
        </div>
      </CustomCard>
    </motion.div>
  );
};