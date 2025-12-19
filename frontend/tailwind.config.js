/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Magenta - Main brand color (#C03A7A)
        primary: {
          DEFAULT: '#C03A7A',
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#C03A7A', // Base
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        // Accent Deep Purple (#5B2D8B)
        accent: {
          DEFAULT: '#5B2D8B',
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5B2D8B', // Base
          900: '#4c1d95',
        },
        // Success Green - Positive states (Keeping consistent)
        success: {
          DEFAULT: '#22C55E',
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
        // Dark - Black scale for text and dark sections (#0E0E12)
        dark: {
          DEFAULT: '#0E0E12',
          50: '#F4F4F6', // Light text color as lightest
          100: '#e5e5e7',
          200: '#d1d1d6',
          300: '#9ca3af',
          400: '#6b7280',
          500: '#4b5563',
          600: '#374151',
          700: '#282834', // Lighter background
          800: '#1c1c24', // Card background
          900: '#0E0E12', // Main background
          950: '#050507',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-in-up': 'slideInUp 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(220, 38, 38, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(220, 38, 38, 0.6)' },
        },
      },
      boxShadow: {
        'glow-red': '0 0 20px rgba(220, 38, 38, 0.3)',
        'glow-orange': '0 0 20px rgba(249, 115, 22, 0.3)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.3)',
      },
    },
  },
  plugins: [],
}