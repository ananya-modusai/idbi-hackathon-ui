'use client';

import { FC, useEffect } from 'react';
import { Workspace } from '@/app/layout/Workspace/Workspace';
import MerchantAlertsTab from './MerchantAlertsTab';
import { useActiveContextStore } from '@/app/store/activeContextStore';

interface MerchantAlertsPageProps {
  merchantId?: string;
}

const MerchantAlertsPage: FC<MerchantAlertsPageProps> = ({ merchantId }) => {
  const initFromUrl = useActiveContextStore(state => state.initFromUrl);

  useEffect(() => {
    initFromUrl();
  }, [initFromUrl]);

  const tabs = [
    {
      id: 'alerts',
      label: 'Notifications',
      content: <MerchantAlertsTab key={`alerts-${merchantId}`} merchantId={merchantId} />
    }
  ];

  return <Workspace tabs={tabs} initialActiveTabId="alerts" />;
};

export default MerchantAlertsPage;
