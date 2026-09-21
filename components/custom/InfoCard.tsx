import React from 'react';
import { LucideIcon, Check, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { BubbleTag } from './BubbleTag';
import { ColorScheme, colorSchemes } from './CustomColorScheme';

export interface InfoCardProps {
  title: string;
  isActive: boolean;
  icon: LucideIcon;
  activeColor: ColorScheme;
  description: string;
  className?: string;
  isMatchType?: boolean;
}

const getCardStyles = (color: ColorScheme, isActive: boolean) => {
  const colorName = color.replace('-', '');
  if (isActive) {
    return `border-${colorName}-200 bg-${colorName}-50 shadow-sm`;
  }
  return 'border-gray-200 bg-gray-50';
};

const getIconStyles = (color: ColorScheme, isActive: boolean) => {
  if (isActive) {
    const colorName = color.replace('-', '');
    return `text-${colorName}-600`;
  }
  return 'text-gray-400';
};

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  isActive,
  icon: Icon,
  activeColor,
  description,
  className = '',
  isMatchType = false
}) => {
  const cardClasses = `p-4 rounded-lg border-2 transition-all duration-200 ${
    getCardStyles(activeColor, isActive)
  } ${className}`;
  
  const iconClasses = `w-5 h-5 ${getIconStyles(activeColor, isActive)}`;

  const getStatusIcon = () => {
    if (isMatchType) {
      return isActive ? <AlertTriangle size={12} /> : <CheckCircle size={12} />;
    } else {
      return isActive ? <Check size={12} /> : <X size={12} />;
    }
  };

  return (
    <div className={cardClasses}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={iconClasses} />
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <BubbleTag
          text={isActive ? (isMatchType ? "Match Found" : "Yes") : (isMatchType ? "No Match" : "No")}
          color={isActive ? activeColor : (isMatchType ? "green" : "gray")}
          hasOutsideIcon={true}
          icon={getStatusIcon()}
        />
      </div>
      <p className="text-xs text-gray-600">
        {description}
      </p>
    </div>
  );
};
