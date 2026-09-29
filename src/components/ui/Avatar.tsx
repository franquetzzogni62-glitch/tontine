import React from 'react';
import { getInitials } from '../../utils/formatters';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  // Deterministic palette
  const colors = [
    'bg-emerald-600 text-white',
    'bg-amber-600 text-white',
    'bg-sky-600 text-white',
    'bg-violet-600 text-white',
    'bg-teal-600 text-white',
    'bg-rose-600 text-white',
    'bg-slate-700 text-white',
  ];

  const colorIndex =
    Math.abs(
      name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    ) % colors.length;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full shrink-0 overflow-hidden font-semibold select-none shadow-xs border border-white/20 dark:border-slate-800 ${sizeClasses[size]} ${
        src ? 'bg-slate-200 dark:bg-slate-700' : colors[colorIndex]
      } ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image load fails
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};
