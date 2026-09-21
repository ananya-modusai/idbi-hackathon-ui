'use client';

import { FC } from 'react';
import { SectionHeaderWithFlags } from '@/components/custom/SectionHeaderWithFlags';
import { Eye, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProcessingQueue } from './ProcessingQueue';
import { RecentOrdersTable } from './RecentOrdersTable';

const OrderPipelineTab: FC = () => {
  return (
    <motion.div
      className="w-full max-w-full overflow-x-hidden px-2 pb-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div className="mb-4">
        <SectionHeaderWithFlags
          title="Processing Queue"
          icon={Eye}
          positiveFlags={[]}
          negativeFlags={[]}
          titleColorClass="text-blue-700"
          iconColorClass="text-blue-700"
          allowCollapse={false}
          initialRowLimit={5}
        />
      </motion.div>

      <ProcessingQueue />

      <motion.div className="mt-8 mb-4">
        <SectionHeaderWithFlags
          title="Recent Orders"
          icon={Clock}
          positiveFlags={[]}
          negativeFlags={[]}
          titleColorClass="text-black"
          iconColorClass="text-black"
          allowCollapse={false}
          initialRowLimit={10}
        />
      </motion.div>

      <RecentOrdersTable />
    </motion.div>
  );
};

export default OrderPipelineTab;
