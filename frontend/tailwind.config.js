/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        futuristic: ['Orbitron', 'Cedarville Cursive', 'sans-serif'],
      },
      colors: {
        'aegis-neon': '#38bdf8',
        'aegis-purple': '#6366f1',
        'aegis-dark': '#181c2f',
        'aegis-panel': '#23264a',
      },
      dropShadow: {
        glow: '0 0 8px #38bdf8, 0 0 16px #6366f1',
      },
    },
  },
  plugins: [],
};
