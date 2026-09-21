import { FC, PropsWithChildren } from 'react';
import { cn } from "@/lib/utils";
import { LucideIcon } from 'lucide-react';

interface TabSectionHeadingProps extends PropsWithChildren {
  className?: string;
  icon?: LucideIcon;
  iconColorClass?: string;
  showSeparator?: boolean;
}

export const TabSectionHeading: FC<TabSectionHeadingProps> = ({ 
  children, 
  className,
  icon: Icon,
  iconColorClass = "text-gray-500",
  showSeparator = false
}) => {
  return (
    <div className={cn(
      "relative flex items-center gap-2 pb-3 pt-4",
      showSeparator && "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gray-200"
    )}>
      {Icon && <Icon className={cn("h-5 w-5", iconColorClass)} />}
      <h3 className={cn(
        "text-lg font-semibold text-gray-900",
        className
      )}>
        {children}
      </h3>
    </div>
  );
};
