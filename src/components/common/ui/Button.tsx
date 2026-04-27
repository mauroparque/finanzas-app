import { type ReactNode } from 'react';
import { cn } from '../../../utils/cn';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const variantStyles = {
  primary: 'bg-terracotta-500 text-white hover:bg-terracotta-600 active:bg-terracotta-700',
  secondary: 'bg-sage-500 text-white hover:bg-sage-600 active:bg-sage-700',
  ghost: 'bg-transparent text-stone-700 hover:bg-stone-100 active:bg-stone-200',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm rounded-xl',
  md: 'px-4 py-2 text-base rounded-xl',
  lg: 'px-6 py-3 text-lg rounded-2xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
