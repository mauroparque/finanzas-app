import type { Key, ReactNode } from 'react';
import { cn } from '../../../utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  key?: Key;
}

export const Card = ({ children, className, onClick }: CardProps) => {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-soft border border-stone-200 p-4',
        onClick && 'cursor-pointer hover:shadow-card transition-shadow duration-200',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
