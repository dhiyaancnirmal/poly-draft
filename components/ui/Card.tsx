"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<"div"> {
  hoverable?: boolean;
  children: React.ReactNode;
}

export function Card({
  className,
  hoverable = false,
  children,
  ...props
}: CardProps) {
  return (
    <motion.div
      className={cn(
        'rounded-card border border-surface-highlight/50 bg-surface/60 backdrop-blur-xl shadow-card overflow-hidden',
        hoverable && 'hover:bg-surface/80 hover:border-primary/20 transition-colors duration-300',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

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