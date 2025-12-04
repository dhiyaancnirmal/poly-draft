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
        'animate-pulse rounded-md bg-surface',
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
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <Skeleton className={cn('h-32 w-full rounded-card', className)} />
  );
};

export const SkeletonButton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <Skeleton className={cn('h-10 w-24 min-h-touch', className)} />
  );
};

export const SkeletonInput: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <Skeleton className={cn('h-10 w-full min-h-touch', className)} />
  );
};