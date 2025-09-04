/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef9ff', 100: '#d9f1ff', 200: '#b9e7ff', 300: '#8bd9ff', 400: '#57c6ff',
          500: '#2bb1ff', 600: '#1793e6', 700: '#1073b4', 800: '#0f5e90', 900: '#0f4d74'
        }
      }
    }
  },
  plugins: []
};


