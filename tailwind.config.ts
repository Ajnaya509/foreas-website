import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // FOREAS Dark Sovereign Palette - Subtle dark blue like app
        foreas: {
          deepblack: '#050508',  // Noir profond
          black: '#08080d',      // Noir avec touche bleu subtile
          dark: '#0a0a12',       // Bleu nuit très foncé
          navy: '#0c0c16',       // Bleu nuit subtil
          gray: '#111118',       // Gris bleuté
          muted: '#7A7A90',      // Gris bleu muted
          light: '#F9FAFB',
        },
        accent: {
          cyan: '#00D4FF',
          blue: '#3B82F6',
          purple: '#8C52FF',
          magenta: '#EC4899',
          green: '#10B981',
        },
      },
      fontFamily: {
        // FOREAS Typography Hierarchy
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        title: ['Genos', 'system-ui', 'sans-serif'],
        display: ['Genos', 'system-ui', 'sans-serif'],
        body: ['Montserrat', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-foreas': 'linear-gradient(90deg, #8C52FF 0%, #00D4FF 100%)',
        'gradient-accent': 'linear-gradient(90deg, #8C52FF 0%, #00D4FF 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
