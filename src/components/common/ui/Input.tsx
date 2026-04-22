import type { InputHTMLAttributes } from 'react';
import { cn } from '../../../utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({ label, error, className, id, ...props }: InputProps) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-stone-600 uppercase tracking-wide"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full bg-stone-100 border border-stone-200 rounded-xl px-3 py-2',
          'text-stone-800 placeholder:text-stone-400 text-sm',
          'transition-colors duration-150',
          'focus:outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100',
          error && 'border-red-400 focus:border-red-400 focus:ring-red-100',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};
