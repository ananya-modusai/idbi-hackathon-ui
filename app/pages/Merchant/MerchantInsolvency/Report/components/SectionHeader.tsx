import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  Icon?: LucideIcon | null;
  className?: string;
}

const SectionHeader: React.FC<Props> = ({ title, Icon = null, className = '' }) => {
  return (
    <div className={`pdf-section-header ${className}`.trim()}>
      {/* {Icon && <Icon className="pdf-section-icon" />} */}
      <h2 className="pdf-section-title">{title}</h2>
    </div>
  );
};

export default SectionHeader;
