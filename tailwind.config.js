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
          // Primary colors - reversed for light theme
          primary: '#ADD8E6',
          'primary-light': '#B8E0F0',
          'primary-dark': '#87CEEB',
          
          // Accent colors - navy for text and interactive elements
          accent: {
            light: '#4169E1',    // Royal blue for better contrast
            DEFAULT: '#000080',   // Navy for primary text/icons
            medium: '#191970',    // Midnight blue for emphasis
            teal: '#006666',      // Dark teal for borders
            'teal-dark': '#004444', // Darker teal for active states
          },
          
          // Background colors - light theme
          bg: {
            primary: '#F0F8FF',    // Alice blue - very light
            secondary: '#E6F3FF',  // Lighter blue
            tertiary: '#D6EBFF',   // Medium light blue
          },
          
          // UI colors with proper contrast for light theme
          success: '#006400',     // Dark green for visibility
          warning: '#B8860B',     // Dark goldenrod for contrast
          error: '#DC143C',       // Crimson for errors
          white: '#FFFFFF',
          
          // Gray scale for UI elements - adjusted for light theme
          gray: {
            100: '#F8F9FA',
            200: '#E9ECEF',
            300: '#DEE2E6',
            400: '#CED4DA',
            500: '#ADB5BD',
            600: '#6C757D',
            700: '#495057',
            800: '#343A40',
            900: '#212529',
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
        'pixel': '3px 3px 0px 0px rgba(0, 0, 128, 0.3)',
        'pixel-lg': '5px 5px 0px 0px rgba(0, 0, 128, 0.3)',
        'pixel-glow': '0 0 12px rgba(0, 0, 128, 0.4)',
        'pixel-inner': 'inset 2px 2px 4px rgba(0, 0, 128, 0.1)',
        // Enhanced button shadows for light theme
        'pixel-button': '2px 2px 0px 0px rgba(0, 0, 128, 0.4)',
        'pixel-button-hover': '4px 4px 0px 0px rgba(0, 0, 128, 0.4)',
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
            boxShadow: '0 0 8px rgba(0, 0, 128, 0.3)',
          },
          '50%': { 
            boxShadow: '0 0 16px rgba(0, 0, 128, 0.5)',
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
          linear-gradient(rgba(0, 0, 128, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 0, 128, 0.1) 1px, transparent 1px)
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