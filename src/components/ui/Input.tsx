import React, { useState } from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  showCursor?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  showCursor = false,
  className = '',
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const inputClasses = [
    'pixel-input',
    Icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : '',
    fullWidth ? 'w-full' : '',
    error ? 'border-retro-error focus:border-retro-error focus:ring-retro-error' : '',
    isFocused && showCursor ? 'cursor-pixel' : '',
    className
  ].join(' ');
  
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-pixel text-retro-accent mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className={`absolute inset-y-0 ${iconPosition === 'left' ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none`}>
            <Icon className="w-4 h-4 text-retro-accent pixel-perfect" />
          </div>
        )}
        
        <input
          className={inputClasses}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </div>
      
      {error && (
        <p className="mt-1 text-xs text-retro-error font-pixel-sans animate-pixel-pulse">
          {error}
        </p>
      )}
    </div>
  );
};