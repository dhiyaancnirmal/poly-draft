import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default' | 'outline';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className
}) => {
  const variants = {
    success: 'bg-success/15 text-success border border-success/30',
    warning: 'bg-warning/15 text-warning border border-warning/30',
    error: 'bg-error/15 text-error border border-error/30',
    info: 'bg-primary/15 text-primary border border-primary/30',
    default: 'bg-surface-highlight/70 text-muted border border-border/70',
    outline: 'border border-border/70 text-muted bg-transparent'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-3 py-1 text-[11px] font-semibold tracking-wide shadow-sm',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};