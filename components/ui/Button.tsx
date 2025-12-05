"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]';

    const variants = {
      primary: 'bg-primary text-primary-foreground active:brightness-90',
      secondary: 'bg-secondary text-secondary-foreground active:brightness-90',
      outline: 'border border-border bg-transparent text-foreground active:bg-accent',
      ghost: 'bg-transparent text-muted-foreground active:bg-accent',
      destructive: 'bg-destructive text-destructive-foreground active:brightness-90',
    };

    const sizes = {
      sm: 'px-3 py-2 text-xs min-h-[36px]',
      md: 'px-4 py-2.5 text-sm min-h-[44px]',
      lg: 'px-6 py-3 text-base min-h-[52px]',
      icon: 'h-10 w-10 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          loading && 'opacity-70 cursor-wait',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
