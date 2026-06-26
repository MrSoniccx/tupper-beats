/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta base girly
        'rosa':     '#FFB6C1',
        'lavanda':  '#E6D7FF',
        'dorado':   '#FFD700',
        'perla':    '#FAFAFA',
        'ciruela':  '#9B5DE5',
        'marron':   '#A0522D',
        // Paleta Hogwarts
        'hw-dorado':  '#C9A84C',
        'hw-granate': '#740001',
        'hw-crema':   '#F5E6C8',
        'hw-negro':   '#1A1A2E',
        'hw-oro':     '#F0C040',
      },
      fontFamily: {
        magic:    ['"UnifrakturMaguntia"', 'cursive'],
        medieval: ['"MedievalSharp"', 'serif'],
        sans:     ['"Inter"', 'sans-serif'],
      },
      animation: {
        'float':        'float 3s ease-in-out infinite',
        'glow':         'glow 2s ease-in-out infinite alternate',
        'candle':       'candle 4s ease-in-out infinite',
        'particle':     'particle 6s linear infinite',
        'slide-in':     'slideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-in':      'fadeIn 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        glow: {
          'from': { boxShadow: '0 0 5px #C9A84C, 0 0 10px #C9A84C' },
          'to':   { boxShadow: '0 0 20px #C9A84C, 0 0 40px #C9A84C, 0 0 60px #C9A84C' },
        },
        candle: {
          '0%, 100%': { transform: 'translateX(0) rotate(0deg)', opacity: '0.9' },
          '25%':      { transform: 'translateX(2px) rotate(1deg)', opacity: '1' },
          '75%':      { transform: 'translateX(-2px) rotate(-1deg)', opacity: '0.8' },
        },
        particle: {
          '0%':   { transform: 'translateY(100vh) rotate(0deg)', opacity: '0' },
          '10%':  { opacity: '1' },
          '90%':  { opacity: '1' },
          '100%': { transform: 'translateY(-10vh) rotate(720deg)', opacity: '0' },
        },
        slideIn: {
          '0%':   { transform: 'translateX(120%) scale(0.8)', opacity: '0' },
          '100%': { transform: 'translateX(0) scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'parchment': "url('/assets/hogwarts/parchment.png')",
        'great-hall': "url('/assets/hogwarts/great-hall.jpg')",
      },
      boxShadow: {
        'gold':   '0 0 15px rgba(201,168,76,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        'magic':  '0 0 30px rgba(201,168,76,0.8), 0 0 60px rgba(201,168,76,0.4)',
        'girly':  '0 8px 32px rgba(155,93,229,0.2)',
      },
    },
  },
  plugins: [],
}
