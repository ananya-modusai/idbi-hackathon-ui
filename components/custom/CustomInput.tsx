import { FC, InputHTMLAttributes } from 'react';
import { cn } from "@/lib/utils";

interface CustomInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  className?: string;
  inputSize?: 'xs' | 'sm' | 'md';
  variant?: 'default' | 'ghost' | 'outline';
  label?: string;
}

export const CustomInput: FC<CustomInputProps> = ({ 
  className = '', 
  inputSize = 'sm',
  variant = 'default',
  label,
  ...props 
}) => {
  const sizeStyles = {
    xs: 'h-6 text-xs px-1.5',
    sm: 'h-7 text-xs px-2',
    md: 'h-8 text-sm px-2.5'
  };

  const variantStyles = {
    default: 'border border-input bg-background shadow-xs',
    ghost: 'border-0 bg-transparent',
    outline: 'border border-input bg-transparent'
  };

  return (
    <div className="space-y-1">
      {label && <label className="text-sm text-gray-700">{label}</label>}
      <input
        className={cn(
          "rounded transition-colors",
          "placeholder:text-muted-foreground/60",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          sizeStyles[inputSize],
          variantStyles[variant],
          className
        )}
        {...props}
      />
    </div>
  );
}; 