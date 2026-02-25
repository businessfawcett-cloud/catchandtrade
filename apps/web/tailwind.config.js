/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'poke-bg': '#0f1724',
        'poke-bg-light': '#1a2332',
        'poke-red': '#e63946',
        'poke-red-dark': '#c1121f',
        'poke-gold': '#ffd700',
        'poke-gold-dark': '#d4a500',
        'poke-text': '#ffffff',
        'poke-text-muted': '#94a3b8',
        'poke-border': '#2d3748',
        // Pokemon type colors
        'type-fire': '#f08030',
        'type-water': '#6890f0',
        'type-grass': '#78c850',
        'type-electric': '#f8d030',
        'type-psychic': '#f85888',
        'type-fighting': '#c03028',
        'type-poison': '#a040a0',
        'type-ground': '#e0c068',
        'type-rock': '#b8a038',
        'type-bug': '#a8b820',
        'type-ghost': '#705898',
        'type-dragon': '#7038f8',
        'type-dark': '#705848',
        'type-steel': '#b8b8d0',
        'type-fairy': '#ee99ac',
        'type-ice': '#98d8d8',
        'type-normal': '#a8a878',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pokeball-spin': 'pokeball-spin 1s linear infinite',
        'catch': 'catch 0.6s ease-out',
        'holo': 'holo 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pokeball-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'catch': {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '50%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '0' },
        },
        'holo': {
          '0%, 100%': { opacity: '0.5', transform: 'translateX(-100%)' },
          '50%': { opacity: '1', transform: 'translateX(100%)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(230, 57, 70, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(230, 57, 70, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}
