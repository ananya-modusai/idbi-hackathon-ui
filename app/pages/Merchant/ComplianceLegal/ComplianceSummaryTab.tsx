'use client';

import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { useActiveContext } from '@/app/layout/ActiveContext/useActiveContext';
import { useMerchantIdStore } from '@/app/store/merchant/merchantIdStore';
import InsolvencyPageHeader from '@/app/pages/Merchant/MerchantInsolvency/Components/InsolvencyPageHeader';
import CustomLoader from '@/components/custom/CustomLoader';
import { KeyMetrics } from '@/components/custom/KeyMetrics';
import { complianceKeyMetrics } from './complianceSampleData';
import GstnDetailsTab from '@/app/pages/Merchant/MerchantInsolvency/GstnDetailsTab';
import GstFilingTrendSection from './GstFilingTrendSection';
import GstReturnsSection from './GstReturnsSection';
import GstComplianceSection from './GstComplianceSection';
import EpfoComplianceSection from './EpfoComplianceSection';
import LitigationSection from './LitigationSection';
import MsmeDelaysSection from './MsmeDelaysSection';

interface ComplianceSummaryTabProps {
  merchantId?: string;
}

const ComplianceSummaryTab: FC<ComplianceSummaryTabProps> = ({ merchantId: propMerchantId }) => {
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);
  const { activeContexts } = useActiveContext();
  const { merchantIdList, selectedMerchantId } = useMerchantIdStore();

  const merchantId = propMerchantId || activeContexts?.merchant || selectedMerchantId;
  const activeMerchant = merchantIdList.find(m => m.id === merchantId);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div
      className="space-y-10 px-2 min-w-0"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {activeMerchant ? (
        <InsolvencyPageHeader
          activeMerchant={activeMerchant}
          sections={[]}
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

      <KeyMetrics
        hardcodedMetrics={complianceKeyMetrics}
        isMetricsExpanded={isMetricsExpanded}
        setIsMetricsExpanded={setIsMetricsExpanded}
        showHeader={false}
        gridCols={4}
      />

      <GstnDetailsTab />
      <GstFilingTrendSection />
      <GstReturnsSection />
      <GstComplianceSection />
      <EpfoComplianceSection />
      <LitigationSection />
      <MsmeDelaysSection />
    </motion.div>
  );
};

export default ComplianceSummaryTab;
