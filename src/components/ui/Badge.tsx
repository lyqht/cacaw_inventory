import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  glow?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  glow = false,
  className = ''
}) => {
  const baseClasses = 'pixel-badge inline-flex items-center font-pixel';
  
  const variantClasses = {
    default: 'bg-retro-accent text-retro-bg-primary border-retro-accent-teal',
    success: 'bg-retro-success text-retro-bg-primary border-green-600',
    warning: 'bg-retro-warning text-retro-bg-primary border-yellow-600',
    error: 'bg-retro-error text-retro-white border-red-600'
  };
  
  const sizeClasses = {
    sm: 'px-1 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm'
  };
  
  const glowClasses = glow ? 'animate-glow-pulse' : '';
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    glowClasses,
    className
  ].join(' ');
  
  return (
    <span className={classes}>
      {children}
    </span>
  );
};