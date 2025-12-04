import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ 
  className, 
  hoverable = false, 
  children, 
  ...props 
}) => {
  return (
    <div
      className={cn(
        'rounded-card border border-surface/20 bg-surface/50 backdrop-blur-sm',
        hoverable && 'hover:bg-surface/70 hover:border-surface/40 hover:shadow-lg transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className, 
  children, 
  ...props 
}) => {
  return (
    <div
      className={cn('p-4 pb-2', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className, 
  children, 
  ...props 
}) => {
  return (
    <div
      className={cn('p-4 pt-2', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className, 
  children, 
  ...props 
}) => {
  return (
    <div
      className={cn('p-4 pt-0', className)}
      {...props}
    >
      {children}
    </div>
  );
};