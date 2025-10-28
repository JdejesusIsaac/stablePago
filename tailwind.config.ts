import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core brand palette - Arc Network
        background: '#0B0C10',
        surface: {
          DEFAULT: '#121417',
          elevated: '#1C1F24',
          hover: '#2A2D32',
        },
        border: {
          DEFAULT: '#1C1F24',
          hover: '#2A2D32',
        },
        primary: {
          DEFAULT: '#FF005C',
          hover: '#CC0049',
          foreground: '#FFFFFF',
          glow: 'rgba(255, 0, 92, 0.4)',
        },
        secondary: {
          DEFAULT: '#00F0FF',
          hover: '#00C1CC',
          foreground: '#0B0C10',
          glow: 'rgba(0, 240, 255, 0.4)',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A9B0B7',
          muted: '#6B7280',
        },
        success: {
          DEFAULT: '#00F0FF',
          glow: 'rgba(0, 240, 255, 0.3)',
        },
        error: {
          DEFAULT: '#FF005C',
          glow: 'rgba(255, 0, 92, 0.3)',
        },
        warning: {
          DEFAULT: '#FFA500',
          glow: 'rgba(255, 165, 0, 0.3)',
        },
        // Status colors for transactions
        positive: '#00F0FF',
        negative: '#FF005C',
      },
      fontFamily: {
        sans: ['Inter', 'Satoshi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.05em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.02em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
        '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        DEFAULT: '16px',
        lg: '20px',
        xl: '24px',
        '2xl': '32px',
      },
      boxShadow: {
        'glow-primary': '0 0 12px var(--tw-shadow-color)',
        'glow-primary-lg': '0 0 20px var(--tw-shadow-color)',
        'glow-secondary': '0 0 12px rgba(0, 240, 255, 0.4)',
        'glow-secondary-lg': '0 0 20px rgba(0, 240, 255, 0.4)',
        'surface': '0 0 12px rgba(0, 0, 0, 0.25)',
        'surface-elevated': '0 0 20px rgba(0, 0, 0, 0.3)',
        'card': '0 0 12px rgba(0, 0, 0, 0.25)',
      },
      backgroundImage: {
        'gradient-arc': 'linear-gradient(145deg, #0B0C10 0%, #121417 100%)',
        'gradient-card': 'linear-gradient(135deg, #121417 0%, #1C1F24 100%)',
        'gradient-glow': 'radial-gradient(circle at 50% 0%, rgba(255, 0, 92, 0.1), transparent 50%)',
        'gradient-glow-cyan': 'radial-gradient(circle at 50% 0%, rgba(0, 240, 255, 0.1), transparent 50%)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      spacing: {
        'section': '48px',
      },
      backdropBlur: {
        'arc': '12px',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scale-in': 'scale-in 0.2s ease-out',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

