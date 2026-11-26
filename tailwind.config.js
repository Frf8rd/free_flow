/** @type {import('tailwindcss').Config} */
const v = (n) => `rgb(var(--fm-${n}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      // Culorile vin din variabile CSS (vezi index.css), ca tema întunecată să funcționeze peste tot
      colors: { fm: { page: v('page'), snow: v('snow'), mist: v('mist'), steel: v('steel'), graphite: v('graphite'), ink: v('ink'), slate: v('slate') } },
      boxShadow: { card: '0 1px 2px rgba(24,27,30,.04)' },
    },
  },
  plugins: [],
};
