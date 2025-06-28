import React from 'react';

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Cardboard Crate */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-4">
        <svg
          viewBox="0 0 16 8"
          className="w-full h-full pixel-perfect"
          style={{ imageRendering: 'pixelated' }}
        >
          {/* Main crate body - cardboard brown */}
          <rect x="0" y="2" width="16" height="6" fill="#8B4513" />
          
          {/* Top of crate - lighter brown */}
          <rect x="0" y="0" width="16" height="2" fill="#A0522D" />
          
          {/* Crate planks - vertical lines */}
          <rect x="3" y="0" width="1" height="8" fill="#654321" />
          <rect x="7" y="0" width="1" height="8" fill="#654321" />
          <rect x="11" y="0" width="1" height="8" fill="#654321" />
          
          {/* Horizontal support beams */}
          <rect x="0" y="3" width="16" height="1" fill="#654321" />
          <rect x="0" y="6" width="16" height="1" fill="#654321" />
          
          {/* Corner reinforcements */}
          <rect x="0" y="0" width="1" height="8" fill="#654321" />
          <rect x="15" y="0" width="1" height="8" fill="#654321" />
          
          {/* Crate markings/labels */}
          <rect x="2" y="4" width="2" height="1" fill="#654321" />
          <rect x="6" y="4" width="4" height="1" fill="#654321" />
          <rect x="12" y="4" width="2" height="1" fill="#654321" />
          
          {/* Side shadows for depth */}
          <rect x="14" y="2" width="2" height="6" fill="#5D4037" />
          <rect x="0" y="7" width="16" height="1" fill="#5D4037" />
          
          {/* Nail/screw details */}
          <rect x="1" y="1" width="1" height="1" fill="#2F1B14" />
          <rect x="14" y="1" width="1" height="1" fill="#2F1B14" />
          <rect x="1" y="5" width="1" height="1" fill="#2F1B14" />
          <rect x="14" y="5" width="1" height="1" fill="#2F1B14" />
        </svg>
      </div>
      
      {/* Animated Bird Sprite */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-bird-hop">
        <svg
          viewBox="0 0 16 16"
          className="w-full h-full pixel-perfect"
          style={{ imageRendering: 'pixelated' }}
        >
          {/* Bird body */}
          <rect x="4" y="6" width="8" height="6" fill="#ADD8E6" />
          <rect x="3" y="7" width="1" height="4" fill="#ADD8E6" />
          <rect x="12" y="7" width="1" height="4" fill="#ADD8E6" />
          
          {/* Bird head */}
          <rect x="6" y="4" width="4" height="4" fill="#87CEEB" />
          <rect x="5" y="5" width="1" height="2" fill="#87CEEB" />
          <rect x="10" y="5" width="1" height="2" fill="#87CEEB" />
          
          {/* Beak */}
          <rect x="4" y="6" width="2" height="1" fill="#FFFF00" />
          
          {/* Eye */}
          <rect x="7" y="5" width="1" height="1" fill="#000080" />
          
          {/* Wing detail */}
          <rect x="8" y="7" width="2" height="3" fill="#4682B4" />
          
          {/* Feet */}
          <rect x="6" y="12" width="1" height="1" fill="#FFFF00" />
          <rect x="9" y="12" width="1" height="1" fill="#FFFF00" />
          
          {/* Wing highlight */}
          <rect x="5" y="8" width="1" height="2" fill="#B0E0E6" />
          
          {/* Tail feathers */}
          <rect x="11" y="8" width="2" height="1" fill="#4682B4" />
          <rect x="12" y="9" width="2" height="1" fill="#4682B4" />
        </svg>
      </div>
    </div>
  );
};