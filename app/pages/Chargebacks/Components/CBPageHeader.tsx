'use client';

import { FC, useEffect, useState } from 'react';
import { Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { ChargebackCase } from '../SampleData/CBCasesSampleData';
import { BubbleTag } from '@/components/custom/BubbleTag';
import { generateChargebackBubbleTags } from './CBBubbleTagSpecs';

interface CBPageHeaderProps {
  activeCase: ChargebackCase;
}

const CBPageHeader: FC<CBPageHeaderProps> = ({ activeCase }) => {
  const copyId = () => {
    navigator.clipboard.writeText(activeCase.caseId);
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
    <div>
      {activeCase && (
        <motion.div
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="flex items-center justify-between"
            variants={itemVariants}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-blue-600 leading-none uppercase">{activeCase.merchantName}</h2>
              <span className="text-gray-400 text-lg leading-none">|</span>
              <span className="text-xl font-semibold text-gray-700 leading-none">{activeCase.caseTitle}</span>
              <span className="text-sm text-gray-500 leading-none">[{activeCase.caseId}]</span>
              <button 
                onClick={copyId}
                className="text-blue-500 hover:text-blue-700 flex items-center justify-center h-4"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex items-center gap-2 text-sm text-gray-500 leading-none"
            variants={itemVariants}
          >
            {generateChargebackBubbleTags(activeCase).map((bubbleTag, index) => (
              <BubbleTag
                key={index}
                text={bubbleTag.text}
                color={bubbleTag.color}
                withBorder={bubbleTag.withBorder}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default CBPageHeader;
