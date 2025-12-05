import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className
}) => {
  const variants = {
    default: 'bg-accent text-accent-foreground border-transparent',
    secondary: 'bg-secondary text-secondary-foreground border-transparent',
    success: cn(
      'bg-success/15 text-success border-success/30',
      'shadow-[0_0_12px_-4px_hsl(var(--success)/0.3)]'
    ),
    warning: cn(
      'bg-warning/15 text-warning border-warning/30',
      'shadow-[0_0_12px_-4px_hsl(var(--warning)/0.3)]'
    ),
    error: cn(
      'bg-error/15 text-error border-error/30',
      'shadow-[0_0_12px_-4px_hsl(var(--error)/0.3)]'
    ),
    info: cn(
      'bg-primary/15 text-primary border-primary/30',
      'shadow-[0_0_12px_-4px_hsl(var(--primary)/0.3)]'
    ),
    outline: 'border-border/70 text-muted-foreground bg-transparent',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-[11px]',
    lg: 'px-3 py-1.5 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold tracking-wide transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};
