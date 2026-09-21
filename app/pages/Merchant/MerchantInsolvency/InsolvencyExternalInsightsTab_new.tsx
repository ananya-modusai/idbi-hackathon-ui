'use client';

import { FC, useMemo } from 'react';
import { ExternalInsightsComponent, insolvencyExternalInsightsConfig } from '@/components/custom/ExternalInsights';
import { useMerchantIdStore } from '@/app/store/merchant/merchantIdStore';
import { useActiveContext } from '@/app/layout/ActiveContext/useActiveContext';

const InsolvencyExternalInsightsTab: FC = () => {
  const { selectedMerchantId } = useMerchantIdStore();
  const { activeContexts } = useActiveContext();
  
  // Get merchant ID from context or store
  const merchantId = useMemo(() => 
    activeContexts?.merchant || selectedMerchantId, 
    [activeContexts, selectedMerchantId]
  );

  return (
    <ExternalInsightsComponent 
      config={insolvencyExternalInsightsConfig}
      contextId={merchantId || undefined}
    />
  );
};

export default InsolvencyExternalInsightsTab;
