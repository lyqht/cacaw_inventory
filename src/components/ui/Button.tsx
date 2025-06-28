import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  fullWidth?: boolean;
  glow?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  fullWidth = false,
  glow = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'pixel-button inline-flex items-center justify-center gap-2';
  
  const variantClasses = {
    primary: 'pixel-button',
    accent: 'pixel-button-accent',
    ghost: 'pixel-button-ghost',
    danger: 'bg-retro-error text-retro-white border-retro-error hover:bg-red-600 shadow-pixel'
  };
  
  const sizeClasses = {
    sm: 'px-pixel py-1 text-xs',
    md: 'px-pixel-2 py-2 text-sm',
    lg: 'px-pixel-3 py-pixel text-base'
  };
  
  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    glow ? 'pixel-glow' : '',
    className
  ].join(' ');
  
  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {Icon && iconPosition === 'left' && (
        <Icon className={`${iconSizeClasses[size]} pixel-perfect`} />
      )}
      
      {isLoading ? (
        <div className={`${iconSizeClasses[size]} bg-current rounded-pixel animate-pixel-pulse`} />
      ) : (
        children
      )}
      
      {Icon && iconPosition === 'right' && (
        <Icon className={`${iconSizeClasses[size]} pixel-perfect`} />
      )}
    </button>
  );
};