'use client';

import { FC } from 'react';
import { GitBranch } from 'lucide-react';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import CapitalStructureTab from './CapitalStructureTab';
import ManagementPromotersTab from './ManagementPromotersTab';
import GroupCompaniesTab from './GroupCompaniesTab';
import PeerRelatedPartyTransactionsTab from '../PeerAnalysis/PeerRelatedPartyTransactionsTab';

const GroupManagementTab: FC = () => {
  return (
    <div className="flex flex-col gap-8">
      <CapitalStructureTab />

      <ManagementPromotersTab />

      <GroupCompaniesTab />

      <div className="mt-4">
        <SectionHeaderWithFlags
          title="Related Party Transactions"
          icon={GitBranch}
          iconColorClass="text-violet-600"
          positiveFlags={[]}
          negativeFlags={[]}
          allowCollapse={false}
        />
        <div className="mt-3">
          <PeerRelatedPartyTransactionsTab />
        </div>
      </div>
    </div>
  );
};

export default GroupManagementTab;
