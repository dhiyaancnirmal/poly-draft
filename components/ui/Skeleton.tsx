import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-surface-highlight/50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 1, 
  className 
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            'h-4 rounded-lg',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <Skeleton className={cn('h-32 w-full rounded-2xl', className)} />
  );
};

export const SkeletonButton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <Skeleton className={cn('h-11 w-24 min-h-touch rounded-xl', className)} />
  );
};

export const SkeletonInput: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <Skeleton className={cn('h-11 w-full min-h-touch rounded-xl', className)} />
  );
};

export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md',
  className 
}) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };
  
  return (
    <Skeleton className={cn('rounded-full', sizes[size], className)} />
  );
};
