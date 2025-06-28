import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'default' | 'accent';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6', // Increased minimum size for better visibility
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  const colorClasses = {
    default: 'border-retro-accent border-t-retro-accent-light [data-theme="light"]_&:border-retro-light-accent [data-theme="light"]_&:border-t-retro-light-accent-light',
    accent: 'border-retro-primary border-t-retro-primary-light [data-theme="light"]_&:border-retro-light-accent [data-theme="light"]_&:border-t-retro-light-accent-medium'
  };
  
  return (
    <div className={`${sizeClasses[size]} ${className}`} role="status" aria-label="Loading">
      <div className="relative w-full h-full">
        {/* Outer spinning ring */}
        <div className={`absolute inset-0 border-3 ${colorClasses[variant]} border-t-transparent rounded-pixel animate-spin pixel-perfect`} />
        
        {/* Inner spinning ring */}
        <div 
          className={`absolute inset-2 border-2 ${colorClasses[variant]} border-b-transparent rounded-pixel animate-spin pixel-perfect`}
          style={{ 
            animationDirection: 'reverse', 
            animationDuration: '1.5s' 
          }} 
        />
        
        {/* Center pixel dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-retro-accent [data-theme='light']_&:bg-retro-light-accent animate-pixel-pulse pixel-perfect" />
        </div>
      </div>
      
      {/* Screen reader text */}
      <span className="sr-only">Loading...</span>
    </div>
  );
};