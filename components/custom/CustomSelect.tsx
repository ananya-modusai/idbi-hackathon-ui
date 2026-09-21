import { FC, SelectHTMLAttributes } from 'react';
import { cn } from "@/lib/utils";

interface CustomSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly string[] | { label: string; value: string; }[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CustomSelect: FC<CustomSelectProps> = ({ 
  value, 
  onValueChange, 
  options, 
  className = '',
  size = 'sm',
  ...props 
}) => {
  const sizeStyles = {
    sm: 'h-9 text-sm px-3',
    md: 'h-10 text-sm px-3',
    lg: 'h-11 text-base px-4'
  };

  return (
    <select 
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className={cn(
        "rounded-md border border-input bg-background",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors duration-200",
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {options.map((option, index) => {
        const label = typeof option === 'string' ? option : option.label;
        const value = typeof option === 'string' ? option : option.value;
        return (
          <option 
            key={index} 
            value={value}
            className="py-1"
          >
            {label}
          </option>
        );
      })}
    </select>
  );
};

export default CustomSelect; 