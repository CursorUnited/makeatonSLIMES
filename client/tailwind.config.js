/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F6F1F5',
          700: '#714B67',
          800: '#5A3B52',
        },
        gray: {
          50: '#F9FAFB',
          300: '#D1D5DB',
          600: '#4B5563',
          900: '#111827',
        },
        success: { 50: '#F0FDF4', 700: '#15803D' },
        warning: { 50: '#FFFBEB', 700: '#B45309' },
        danger: { 50: '#FEF2F2', 700: '#B91C1C' },
        info: { 50: '#EFF6FF', 700: '#1D4ED8' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
