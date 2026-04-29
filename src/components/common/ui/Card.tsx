import { type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../../utils/cn';

interface CardProps extends ComponentPropsWithoutRef<'div'> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'soft' | 'card' | 'float';
}

const shadowMap = {
  none: '',
  soft: 'shadow-soft',
  card: 'shadow-card',
  float: 'shadow-float',
};

export function Card({
  children,
  padding = 'md',
  shadow = 'soft',
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-stone-200',
        padding === 'none' && 'p-0',
        padding === 'sm' && 'p-3',
        padding === 'md' && 'p-5',
        padding === 'lg' && 'p-7',
        shadowMap[shadow],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
