'use client';

import { FC } from 'react';
import { Workspace } from '@/app/layout/Workspace/Workspace';
import MerchantWatchlistTab from './MerchantWatchlistTab';
import MerchantIndustriesTab from './MerchantIndustriesTab';
import MerchantCalculationsTab from './MerchantCalculationsTab';

const MerchantPortfolioPage: FC = () => {
  const tabs = [
    {
      id: 'watchlist',
      label: 'Watchlist',
      content: <MerchantWatchlistTab />
    },
    {
      id: 'industries',
      label: 'Industries',
      content: <MerchantIndustriesTab />
    },
    {
      id: 'calculations',
      label: 'Calculations',
      content: <MerchantCalculationsTab />
    },
  ];

  return <Workspace tabs={tabs} />;
};

export default MerchantPortfolioPage;
