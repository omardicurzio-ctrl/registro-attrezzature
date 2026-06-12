/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bordeaux: {
          DEFAULT: '#5B2B47',
          dark: '#432135',
        },
        gold: {
          DEFAULT: '#B08D5C',
          light: '#D9C5A8',
        },
      },
    },
  },
  plugins: [],
};
