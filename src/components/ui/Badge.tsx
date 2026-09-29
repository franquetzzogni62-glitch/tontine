import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'emerald';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  showDot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  showDot = true,
  className = '',
}) => {
  const dotColors: Record<BadgeVariant, string> = {
    success: 'bg-emerald-500',
    emerald: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    neutral: 'bg-slate-400',
  };

  const textColors: Record<BadgeVariant, string> = {
    success: 'text-emerald-700 dark:text-emerald-300',
    emerald: 'text-emerald-700 dark:text-emerald-300',
    warning: 'text-amber-700 dark:text-amber-300',
    danger: 'text-rose-700 dark:text-rose-300',
    info: 'text-sky-700 dark:text-sky-300',
    neutral: 'text-slate-600 dark:text-slate-300',
  };

  const bgColors: Record<BadgeVariant, string> = {
    success: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    emerald: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    warning: 'bg-amber-500/10 dark:bg-amber-500/20',
    danger: 'bg-rose-500/10 dark:bg-rose-500/20',
    info: 'bg-sky-500/10 dark:bg-sky-500/20',
    neutral: 'bg-slate-100 dark:bg-slate-800',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium tracking-tight ${bgColors[variant]} ${textColors[variant]} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
};
