'use client';

import { FC, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Workspace } from '@/app/layout/Workspace/Workspace';
import CBCaseHistoryTab from './CBCaseHistoryTab';
import CBReconciliationTab from './CBReconciliationTab';
import { useActiveContextStore } from '@/app/store/activeContextStore';

interface CBWorkspacePageProps {
  merchantId?: string;
  caseId?: string;
}

const CBWorkspacePage: FC<CBWorkspacePageProps> = ({ merchantId, caseId }) => {
  const initFromUrl = useActiveContextStore(state => state.initFromUrl);

  useEffect(() => {
    initFromUrl();
  }, [initFromUrl]);

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

  const tabs = [
    {
      id: 'case-history',
      label: 'Case History',
      content: (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
        >
          <CBCaseHistoryTab key={`case-history-${caseId || merchantId}`} merchantId={merchantId} caseId={caseId} />
        </motion.div>
      )
    },
    {
      id: 'reconciliation',
      label: 'Reconciliation',
      content: (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
        >
          <CBReconciliationTab key={`reconciliation-${caseId || merchantId}`} merchantId={merchantId} caseId={caseId} />
        </motion.div>
      )
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Workspace tabs={tabs} initialActiveTabId="case-history" />
    </motion.div>
  );
};

export default CBWorkspacePage;
