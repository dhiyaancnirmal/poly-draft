import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className
}) => {
  const variants = {
    success: 'bg-success/20 text-success border border-success/30',
    warning: 'bg-warning/20 text-warning border border-warning/30',
    error: 'bg-red-500/20 text-red-500 border border-red-500/30',
    info: 'bg-primary/20 text-primary border border-primary/30',
    default: 'bg-surface/50 text-muted border border-surface/30'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide shadow-sm',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};