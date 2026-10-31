/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F6F1F5',
          300: '#C9A8C0',
          700: '#714B67',
          800: '#5A3B52',
        },
        gray: {
          50: '#F9FAFB',
          300: '#D1D5DB',
          600: '#4B5563',
          900: '#111827',
        },
        success: { 50: '#F0FDF4', 300: '#86EFAC', 700: '#15803D' },
        warning: { 50: '#FFFBEB', 300: '#FCD34D', 700: '#B45309' },
        danger: { 50: '#FEF2F2', 300: '#FCA5A5', 700: '#B91C1C' },
        info: { 50: '#EFF6FF', 300: '#93C5FD', 700: '#1D4ED8' },
        darkbg: '#0A0E14',
        darksurface: '#121826',
        darkborder: '#232B3D',
        tag: {
          teal: { bg: '#CCFBF1', text: '#0F766E', bgDark: '#134E4A', textDark: '#5EEAD4' },
          amber: { bg: '#FEF3C7', text: '#B45309', bgDark: '#451A03', textDark: '#FCD34D' },
          blue: { bg: '#DBEAFE', text: '#1D4ED8', bgDark: '#1E3A5F', textDark: '#93C5FD' },
          pink: { bg: '#FCE7F3', text: '#BE185D', bgDark: '#500724', textDark: '#F9A8D4' },
          violet: { bg: '#EDE9FE', text: '#6D28D9', bgDark: '#2E1065', textDark: '#C4B5FD' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
