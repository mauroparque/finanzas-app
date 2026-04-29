import { type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../../utils/cn';

interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  variant?: 'default' | 'terracotta' | 'sage' | 'navy' | 'warning' | 'success';
}

const variantStyles = {
  default: 'bg-stone-100 text-stone-700',
  terracotta: 'bg-terracotta-50 text-terracotta-700',
  sage: 'bg-sage-50 text-sage-700',
  navy: 'bg-navy-50 text-navy-700',
  warning: 'bg-amber-50 text-amber-700',
  success: 'bg-emerald-50 text-emerald-700',
};

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
