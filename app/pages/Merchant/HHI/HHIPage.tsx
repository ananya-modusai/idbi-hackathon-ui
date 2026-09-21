'use client';

import { FC } from 'react';
import { Workspace } from '@/app/layout/Workspace/Workspace';
import HHITab from './HHITab';

const HHIPage: FC = () => {
  const tabs = [
    {
      id: 'hhi-analysis',
      label: 'Herfindahl-Hirschman Index',
      content: <HHITab />
    },
  ];

  return <Workspace tabs={tabs} />;
};

export default HHIPage;
