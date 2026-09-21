import React from 'react';
import { motion } from 'framer-motion';

interface PDFSectionWrapperProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  variants?: any;
}

export const PDFSectionWrapper: React.FC<PDFSectionWrapperProps> = ({ 
  id, 
  children, 
  className = "", 
  variants 
}) => {
  return (
    <motion.div
      id={id}
      className={`pdf-section ${className}`}
      variants={variants}
    >
      {children}
    </motion.div>
  );
};
