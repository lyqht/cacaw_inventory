import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  hoverable?: boolean;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  onClick,
  hoverable = false,
  glow = false
}) => {
  const baseClasses = 'transition-all duration-200';
  
  const variantClasses = {
    default: 'pixel-card',
    elevated: 'pixel-card-elevated',
    outlined: 'bg-transparent border-2 border-retro-accent text-retro-white'
  };
  
  const paddingClasses = {
    none: '',
    sm: 'p-pixel',
    md: 'p-pixel-2',
    lg: 'p-pixel-3'
  };
  
  const interactiveClasses = hoverable || onClick ? 
    'hover:shadow-pixel-lg hover:border-retro-accent-light cursor-pointer hover:animate-pixel-float' : '';
  
  const glowClasses = glow ? 'pixel-glow' : '';
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    interactiveClasses,
    glowClasses,
    className
  ].join(' ');
  
  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
};