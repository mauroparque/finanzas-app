import { cn } from '../../../utils/cn';

type BadgeColor = 'terracotta' | 'sage' | 'navy' | 'stone' | 'amber' | 'red';

interface BadgeProps {
  label: string;
  color?: BadgeColor;
  className?: string;
}

const colorStyles: Record<BadgeColor, string> = {
  terracotta: 'bg-terracotta-100 text-terracotta-700',
  sage:       'bg-sage-100 text-sage-700',
  navy:       'bg-navy-100 text-navy-700',
  stone:      'bg-stone-100 text-stone-600',
  amber:      'bg-amber-100 text-amber-700',
  red:        'bg-red-100 text-red-700',
};

export const Badge = ({ label, color = 'stone', className }: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorStyles[color],
        className
      )}
    >
      {label}
    </span>
  );
};
