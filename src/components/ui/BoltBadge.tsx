import React, { useState } from 'react';

export const BoltBadge: React.FC = () => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <a
        href="https://bolt.new"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-12 h-12 transition-all duration-200 hover:scale-110 hover:shadow-pixel-glow"
        title="Made with Bolt.new"
      >
        <div className="w-full h-full rounded-full overflow-hidden">
         
            <img
              src="/black_circle_360x360.png"
              alt="Made with Bolt.new"
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          
        </div>
      </a>
    </div>
  );
};