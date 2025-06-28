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
        <div className="w-full h-full rounded-full overflow-hidden shadow-pixel-lg hover:shadow-pixel-glow transition-all duration-200">
          {!imageError ? (
            <img
              src="/black_circle_360x360.png"
              alt="Made with Bolt.new"
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : (
            // Fallback: Simple Bolt logo using CSS
            <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
              <div className="text-white font-bold text-lg transform -skew-x-12">
                b
              </div>
            </div>
          )}
        </div>
      </a>
    </div>
  );
};