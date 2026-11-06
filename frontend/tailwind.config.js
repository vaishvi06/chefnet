/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFCF7',
          100: '#FAF6ED',
          200: '#F4ECE0',
          300: '#E9DEC9',
          400: '#D5C4A6',
          500: '#BBA582',
        },
        primary: {
          50: '#F2F8F3',
          100: '#E1EFE3',
          200: '#C2DEC6',
          300: '#95C59C',
          400: '#5FA46A',
          500: '#2E7D32', // ChiefNet Deep Green
          600: '#246628',
          700: '#1D5120',
          800: '#173F1A',
          900: '#0F2C12',
          950: '#061708',
        },
        saffron: {
          50: '#FFFDF5',
          100: '#FEF8E3',
          200: '#FDEEBE',
          300: '#FCDE8E',
          400: '#F8C84F',
          500: '#E89F18', // Turmeric / Saffron
          600: '#CA7E0B',
          700: '#A15B0A',
          800: '#81470F',
          900: '#6B3A11',
        },
        terracotta: {
          50: '#FDF4F2',
          100: '#FCE7E4',
          200: '#F9D3CC',
          300: '#F3B4A7',
          400: '#EA8875',
          500: '#D9583F', // Terracotta Alert
          600: '#C2410C',
          700: '#9E320A',
          800: '#7E2C0D',
          900: '#66260F',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Lora"', '"Playfair Display"', 'Georgia', 'serif']
      },
      boxShadow: {
        warm: '0 4px 20px -2px rgba(46, 125, 50, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'warm-lg': '0 10px 25px -3px rgba(46, 125, 50, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.04)',
        glow: '0 0 15px rgba(232, 159, 24, 0.35)'
      }
    }
  },
  plugins: []
};

