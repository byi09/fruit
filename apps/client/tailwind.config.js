/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        apple: {
          red: '#e74c3c',
          green: '#27ae60',
          gold: '#f39c12',
        },
      },
      animation: {
        'pop': 'pop 0.3s ease-out',
        'shake': 'shake 0.4s ease-in-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-score': 'pulseScore 0.5s ease-out',
        'confetti': 'confetti 1s ease-out forwards',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.2)', opacity: '0.7' },
          '100%': { transform: 'scale(0)', opacity: '0' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseScore: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)', color: '#27ae60' },
          '100%': { transform: 'scale(1)' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0)', opacity: '1' },
          '100%': { transform: 'translateY(-100px) rotate(720deg)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
