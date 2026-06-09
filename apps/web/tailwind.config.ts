import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bitcoin: '#F7931A',
        'bitcoin-dark': '#E07800',
        brand: {
          50:  '#fff8ec',
          100: '#ffefd3',
          500: '#F7931A',
          600: '#e07800',
          900: '#7a3e00',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
