import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'ghost' | 'danger' | 'warning';
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
  const baseClasses = 'pixel-button inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  
  const variantClasses = {
    primary: 'bg-retro-primary text-retro-white border-retro-primary hover:bg-retro-primary-light hover:border-retro-primary-light shadow-pixel hover:shadow-pixel-lg active:shadow-none active:translate-x-0.5 active:translate-y-0.5',
    accent: 'bg-retro-accent text-retro-bg-primary border-retro-accent hover:bg-retro-accent-light hover:border-retro-accent-light shadow-pixel hover:shadow-pixel-lg active:shadow-none active:translate-x-0.5 active:translate-y-0.5',
    ghost: 'bg-retro-bg-secondary text-retro-accent border-retro-accent hover:bg-retro-accent hover:text-retro-bg-primary hover:border-retro-accent-light shadow-pixel hover:shadow-pixel-lg active:shadow-none active:translate-x-0.5 active:translate-y-0.5',
    danger: 'bg-retro-error text-retro-white border-retro-error hover:bg-red-600 hover:border-red-500 shadow-pixel hover:shadow-pixel-lg active:shadow-none active:translate-x-0.5 active:translate-y-0.5',
    warning: 'bg-retro-warning text-retro-bg-primary border-retro-warning hover:bg-yellow-400 hover:border-yellow-400 shadow-pixel hover:shadow-pixel-lg active:shadow-none active:translate-x-0.5 active:translate-y-0.5'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[32px]', // Ensure minimum 32px height
    md: 'px-4 py-3 text-base min-h-[40px]', // Ensure minimum 40px height
    lg: 'px-6 py-4 text-lg min-h-[48px]'   // Ensure minimum 48px height
  };
  
  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
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
        <Icon className={`${iconSizeClasses[size]} pixel-perfect flex-shrink-0`} />
      )}
      
      {isLoading ? (
        <div className={`${iconSizeClasses[size]} bg-current rounded-pixel animate-pixel-pulse flex-shrink-0`} />
      ) : (
        children && <span className="truncate">{children}</span>
      )}
      
      {Icon && iconPosition === 'right' && (
        <Icon className={`${iconSizeClasses[size]} pixel-perfect flex-shrink-0`} />
      )}
    </button>
  );
};