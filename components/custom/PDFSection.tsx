import React from 'react';
import styles from '@/styles/pdf.module.css';

interface PDFSectionProps {
  children: React.ReactNode;
  className?: string;
  type: 'executive-summary' | 'metrics' | 'company' | 'industry';
}

export const PDFSection: React.FC<PDFSectionProps> = ({
  children,
  className = '',
  type
}) => {
  const getTypeClass = () => {
    switch (type) {
      case 'executive-summary':
        return styles['pdf-executive-summary'];
      case 'metrics':
        return styles['pdf-metrics-grid'];
      case 'company':
      case 'industry':
        return styles['pdf-section'];
      default:
        return '';
    }
  };

  return (
    <div className={`${styles['pdf-ready']} ${getTypeClass()} ${className}`}>
      {children}
    </div>
  );
};
