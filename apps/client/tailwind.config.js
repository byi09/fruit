/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", 'system-ui', '-apple-system', 'sans-serif'],
        sans: ["'Inter'", 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        bg: '#08080f',
        surface: {
          DEFAULT: '#0e0e1c',
          light: '#16213e',
          lighter: '#0f3460',
        },
        panel: {
          DEFAULT: 'rgba(255,255,255,0.035)',
          hover: 'rgba(255,255,255,0.055)',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.07)',
          bright: 'rgba(255,255,255,0.13)',
        },
        accent: {
          DEFAULT: '#e94560',
          light: '#ff6b81',
          dark: '#c23152',
          subtle: 'rgba(233, 69, 96, 0.12)',
          glow: 'rgba(233, 69, 96, 0.2)',
        },
        gold: '#f59e0b',
        emerald: {
          DEFAULT: '#10b981',
        },
        indigo: {
          accent: '#6366f1',
        },
        text: {
          DEFAULT: '#eeeef8',
          2: '#9090b8',
          3: '#44445e',
        },
        cell: {
          DEFAULT: '#131326',
          hover: '#1b1b38',
          cleared: '#09090f',
        },
      },
      animation: {
        'pop': 'pop 0.3s ease-out',
        'shake': 'shake 0.4s ease-in-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-in-fast': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-score': 'pulseScore 0.4s ease-out',
        'countdown-ring': 'countdownRing 1s linear',
        'glow': 'glow 2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
        'glow-pulse-fast': 'glowPulse 1.5s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'float-up': 'floatUp 18s linear infinite',
        'orb1': 'orb1 22s ease-in-out infinite',
        'orb2': 'orb2 26s ease-in-out infinite',
        'border-spin': 'borderSpin 4s linear infinite',
        'shimmer': 'shimmer 6s linear infinite',
        'score-kick': 'scoreKick 0.3s ease-out',
        'count-pulse': 'countPulse 0.4s ease-out',
        'particle-fly': 'particleFly 0.6s ease-out forwards',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.15)', opacity: '0.6' },
          '100%': { transform: 'scale(0)', opacity: '0' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-3px)' },
          '75%': { transform: 'translateX(3px)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        pulseScore: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        countdownRing: {
          from: { strokeDashoffset: '0' },
          to: { strokeDashoffset: '283' },
        },
        glow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '1' },
        },
        floatUp: {
          '0%': { transform: 'translateY(0) rotate(var(--r, 0deg))', opacity: '0' },
          '10%': { opacity: '0.7' },
          '90%': { opacity: '0.4' },
          '100%': { transform: 'translateY(-110vh) rotate(calc(var(--r, 0deg) + 180deg))', opacity: '0' },
        },
        orb1: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(60px,-40px) scale(1.1)' },
          '66%': { transform: 'translate(-30px,50px) scale(.95)' },
        },
        orb2: {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(-50px,30px) scale(1.05)' },
          '66%': { transform: 'translate(40px,-60px) scale(.9)' },
        },
        borderSpin: {
          to: { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        scoreKick: {
          '0%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
        countPulse: {
          '0%': { transform: 'scale(1.4)', opacity: '0' },
          '40%': { opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        particleFly: {
          '0%': { opacity: '1', transform: 'translate(0,0) scale(1)' },
          '100%': { opacity: '0', transform: 'translate(var(--dx), var(--dy)) scale(0)' },
        },
      },
      boxShadow: {
        'glass': '0 0 0 1px rgba(255, 255, 255, 0.05), 0 8px 32px rgba(0, 0, 0, 0.12)',
        'glass-lg': '0 0 0 1px rgba(255, 255, 255, 0.08), 0 16px 48px rgba(0, 0, 0, 0.2)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'card': '0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4)',
        'card-hover': '0 2px 8px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.5)',
        'board': '0 0 0 1px rgba(233,69,96,.04), 0 0 80px rgba(233,69,96,.07), 0 32px 100px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.05)',
        'accent-glow': '0 4px 20px rgba(233,69,96,.35)',
        'accent-glow-lg': '0 6px 28px rgba(233,69,96,.45)',
      },
      borderRadius: {
        'r': '14px',
        'r-sm': '9px',
        'r-lg': '20px',
      },
    },
  },
  plugins: [],
};
