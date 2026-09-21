'use client';

import { FC } from 'react';
import { motion } from 'framer-motion';

interface CBDashboardProps {
  merchantId?: string;
}

const CBDashboard: FC<CBDashboardProps> = ({ merchantId }) => {
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
      className="space-y-6 px-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-semibold mb-4">Chargeback Dashboard</h2>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <p className="text-gray-600">Dashboard content will be implemented here.</p>
      </motion.div>
    </motion.div>
  );
};

export default CBDashboard;
