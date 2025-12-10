/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#D50000',
          50: '#fff0f0',
          100: '#ffcdcd',
          200: '#ff9b9b',
          300: '#ff6969',
          400: '#ff3737',
          500: '#ff0505',
          600: '#D50000',
          700: '#a30000',
          800: '#710000',
          900: '#3f0000',
        }
      }
    },
  },
  plugins: [],
}