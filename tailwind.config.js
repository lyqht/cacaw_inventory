/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'pixel': ['"Press Start 2P"', 'monospace'],
        'pixel-sans': ['"Pixelify Sans"', 'sans-serif'],
      },
      colors: {
        retro: {
          // Primary navy theme with improved contrast
          primary: '#000080',
          'primary-light': '#0000CC',
          'primary-dark': '#000066',
          
          // Accent gradient colors with better visibility
          accent: {
            light: '#ADD8E6',
            DEFAULT: '#87CEEB',
            medium: '#4682B4',
            teal: '#008080',
            'teal-dark': '#006666',
          },
          
          // Background colors
          bg: {
            primary: '#000033',
            secondary: '#000044',
            tertiary: '#000055',
          },
          
          // UI colors with improved contrast
          success: '#00FF00',
          warning: '#FFFF00',
          error: '#FF0000',
          white: '#FFFFFF',
          
          // Gray scale for UI elements
          gray: {
            100: '#F0F0F0',
            200: '#E0E0E0',
            300: '#C0C0C0',
            400: '#A0A0A0',
            500: '#808080',
            600: '#606060',
            700: '#404040',
            800: '#202020',
            900: '#101010',
          }
        }
      },
      spacing: {
        'pixel': '8px',
        'pixel-2': '16px',
        'pixel-3': '24px',
        'pixel-4': '32px',
        'pixel-6': '48px',
        'pixel-8': '64px',
      },
      borderRadius: {
        'pixel': '0px', // Sharp pixel corners
        'pixel-sm': '2px',
        'pixel-md': '4px',
      },
      boxShadow: {
        'pixel': '3px 3px 0px 0px rgba(0, 0, 0, 0.8)',
        'pixel-lg': '5px 5px 0px 0px rgba(0, 0, 0, 0.8)',
        'pixel-glow': '0 0 12px rgba(173, 216, 230, 0.8)',
        'pixel-inner': 'inset 2px 2px 4px rgba(0, 0, 0, 0.5)',
        // Enhanced button shadows for better visibility
        'pixel-button': '2px 2px 0px 0px rgba(0, 0, 0, 0.9)',
        'pixel-button-hover': '4px 4px 0px 0px rgba(0, 0, 0, 0.9)',
      },
      animation: {
        'bird-hop': 'bird-hop 2s ease-in-out infinite',
        'pixel-pulse': 'pixel-pulse 1s ease-in-out infinite',
        'cursor-blink': 'cursor-blink 1s step-end infinite',
        'pixel-float': 'pixel-float 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'button-press': 'button-press 0.1s ease-in-out',
        'container-resize': 'container-resize 0.3s ease-in-out',
      },
      keyframes: {
        'bird-hop': {
          '0%, 100%': { 
            transform: 'translateY(0px) scale(1)',
            animationTimingFunction: 'ease-out'
          },
          '25%': { 
            transform: 'translateY(-8px) scale(1.1)',
            animationTimingFunction: 'ease-in'
          },
          '50%': { 
            transform: 'translateY(-4px) scale(1.05)',
            animationTimingFunction: 'ease-out'
          },
          '75%': { 
            transform: 'translateY(-2px) scale(1.02)',
            animationTimingFunction: 'ease-in'
          },
        },
        'pixel-pulse': {
          '0%, 100%': { 
            opacity: '1',
            transform: 'scale(1)'
          },
          '50%': { 
            opacity: '0.7',
            transform: 'scale(0.98)'
          },
        },
        'cursor-blink': {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        'pixel-float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'glow-pulse': {
          '0%, 100%': { 
            boxShadow: '0 0 8px rgba(173, 216, 230, 0.4)',
          },
          '50%': { 
            boxShadow: '0 0 16px rgba(173, 216, 230, 0.8)',
          },
        },
        'button-press': {
          '0%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(2px, 2px)' },
        },
        'container-resize': {
          '0%': { 
            transform: 'scale(1)',
            opacity: '0.8'
          },
          '50%': { 
            transform: 'scale(1.02)',
            opacity: '0.9'
          },
          '100%': { 
            transform: 'scale(1)',
            opacity: '1'
          },
        },
      },
      backgroundImage: {
        'pixel-grid': `
          linear-gradient(rgba(173, 216, 230, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(173, 216, 230, 0.1) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'pixel-grid': '8px 8px',
      },
      // Minimum touch target sizes for accessibility
      minHeight: {
        'touch': '44px',
        'button': '32px',
      },
      minWidth: {
        'touch': '44px',
        'button': '32px',
      },
      // Custom aspect ratios for responsive containers
      aspectRatio: {
        '3/2': '3 / 2',
        '4/3': '4 / 3',
        '16/9': '16 / 9',
      },
    },
  },
  plugins: [],
};