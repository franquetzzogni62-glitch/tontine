import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100 or current count
  max?: number;
  showLabel?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'emerald' | 'amber' | 'slate';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  showLabel = false,
  label,
  size = 'md',
  color = 'emerald',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  const colorClasses = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    slate: 'bg-slate-700 dark:bg-slate-300',
  };

  return (
    <div className={`w-full space-y-1 ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center text-xs">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {label || 'Progression'}
          </span>
          <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {percentage}%
          </span>
        </div>
      )}
      <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
};
