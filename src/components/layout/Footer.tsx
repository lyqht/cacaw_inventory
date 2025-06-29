import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="text-center py-pixel-2 text-retro-accent-light font-pixel-sans text-xs border-t border-retro-accent border-opacity-20">
      <p>
        Built by{' '}
        <a 
          href="https://github.com/lyqht" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-retro-accent hover:underline"
        >
          Estee Tey
        </a>{' '}
        &{' '}
        <a 
          href="https://www.linkedin.com/in/tiang-teck-tan-88a2b9158/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-retro-accent hover:underline"
        >
          Tan Tiang Teck
        </a>
        😸
      </p>
    </footer>
  );
};