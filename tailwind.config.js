/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        float: 'float 2s ease-in-out infinite',
        pop: 'pop 0.3s ease-out forwards',
        shine: 'shine 2s infinite',
        glow: 'glow 1.5s ease-in-out infinite',
        rippleOut: 'rippleOut 0.5s ease-out forwards',
        particleAnimation: 'particleAnimation 0.6s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) scale(0.95)' },
          '50%': { transform: 'translateY(-4px) scale(1)' },
        },
        pop: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0)', opacity: '0' },
        },
        shine: {
          '0%': { transform: 'translateX(-100%) translateY(-100%) rotate(45deg)' },
          '100%': { transform: 'translateX(100%) translateY(100%) rotate(45deg)' },
        },
        glow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.8))' },
          '50%': { filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.9))' },
        },
        rippleOut: {
          '0%': { transform: 'scale(0.3)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        particleAnimation: {
          '0%': { transform: 'translate(0, 0)', opacity: '1' },
          '100%': { transform: 'translate(var(--x), var(--y))', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
