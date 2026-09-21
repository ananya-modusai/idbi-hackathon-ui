'use client';

import { FC } from 'react';
import { Workspace } from '@/app/layout/Workspace/Workspace';
import MerchantWatchlistTab from './MerchantWatchlistTab';

// Page-level wrapper that owns the Workspace (tab bar + scroll container).
// Tabs are always declared here, never by the app shell - see AppContent.tsx.
const MerchantWatchlistPage: FC = () => {
  const tabs = [
    {
      id: 'watchlist',
      label: 'Watchlist',
      content: <MerchantWatchlistTab />
    },
  ];

  return <Workspace tabs={tabs} initialActiveTabId="watchlist" />;
};

export default MerchantWatchlistPage;
