/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#184070',
        'navy-dark': '#0F2C4E',
        sand: '#F5F7FA',
        ink: '#18283B',

        border: '#DFE5ED',
        'border-strong': '#D0D5DD',
        muted: '#667085',

        success: { DEFAULT: '#12B76A', bg: '#ECFDF3', text: '#027A48' },
        warning: { DEFAULT: '#F79009', bg: '#FFFAEB', text: '#B54708' },
        danger: { DEFAULT: '#F04438', bg: '#FEF3F2', text: '#B42318' },
        info: { DEFAULT: '#2E90FA', bg: '#EFF8FF', text: '#175CD3' },
      },
      fontFamily: {
        display: ['Inter', 'Segoe UI', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
