'use client';

import { FC, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Workspace } from '@/app/layout/Workspace/Workspace';
import CBNotificationsTab from './CBNotificationsTab';
import CBDashboard from './CBDashboard';
import { useActiveContextStore } from '@/app/store/activeContextStore';

interface CBPortfolioPageProps {
  merchantId?: string;
}

const CBPortfolioPage: FC<CBPortfolioPageProps> = ({ merchantId }) => {
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
      id: 'notifications',
      label: 'Notifications',
      content: (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
        >
          <CBNotificationsTab key={`notifications-${merchantId}`} merchantId={merchantId} />
        </motion.div>
      )
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      content: (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
        >
          <CBDashboard key={`dashboard-${merchantId}`} merchantId={merchantId} />
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
      <Workspace tabs={tabs} initialActiveTabId="notifications" />
    </motion.div>
  );
};

export default CBPortfolioPage;
