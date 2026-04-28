import type { Config } from 'tailwindcss'

/**
 * FOREAS Tailwind — Aligné PALETTE LIVE de l'app FOREAS Driver v110
 * Source de vérité : `~/FOREAS-Clean/src/screens/HomeScreen.tsx` const COLORS
 * Tokens TS : src/design/tokens.ts
 *
 * Site2026v42 — Refonte visuelle = même langage que l'app actuelle
 */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ─── FOREAS — Palette ACTUELLE app v110 ───────────────────────────
        foreas: {
          // Aliases legacy (rétrocompat) — pointent vers navy
          deepblack: '#080C18',
          black: '#080C18',
          dark: '#0D1526',
          navy: '#080C18',
          gray: '#0D1526',
          muted: 'rgba(255, 255, 255, 0.55)',
          light: '#FFFFFF',

          // Noms canoniques v42 (= app actuelle)
          'navy-deep': '#060A14',
          'navy-card': '#0D1526',
          'navy-mid': '#0B0F1A',
          obsidian: '#080C18',        // alias navy pour rétrocompat v41
          obsidianDeep: '#060A14',    // alias navy-deep pour rétrocompat v41
          obsidianLight: '#0D1526',   // alias navy-card pour rétrocompat v41
        },
        // Accents signature app
        accent: {
          cyan: '#00C9FF',         // CYAN APP (pas #00D4FF)
          purple: '#6C3CE0',       // VIOLET APP (pas #8C52FF)
          'purple-deep': '#A855F7', // PURPLE APP signature
          violet: '#6C3CE0',       // alias
          gold: '#FFD700',         // admin gradient start
          success: '#4ADE80',      // positive feedback
          // Legacy (rétrocompat)
          blue: '#4A90E2',
          green: '#4ADE80',
          magenta: '#EC4899',
        },
        // Glass tokens dédiés
        glass: {
          DEFAULT: 'rgba(11, 17, 32, 0.88)',     // heavy (HomeScreen)
          light: 'rgba(12, 18, 34, 0.58)',       // medium (GlassCard)
          ultra: 'rgba(255, 255, 255, 0.03)',    // ultra-light overlay
          border: '#1A2540',                      // solid border
          'border-soft': 'rgba(255, 255, 255, 0.08)',
          'border-hover': 'rgba(255, 255, 255, 0.16)',
        },
        // États
        danger: '#FF6B6B',
        warning: '#FFA500',
        // Texte
        text: {
          primary: '#FFFFFF',
          secondary: 'rgba(255, 255, 255, 0.72)',
          tertiary: 'rgba(255, 255, 255, 0.55)',
          muted: 'rgba(255, 255, 255, 0.35)',
        },
      },

      // ─── Typography ────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        title: ['Genos', 'system-ui', 'sans-serif'],
        display: ['Genos', 'system-ui', 'sans-serif'],
        body: ['Montserrat', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-xxl': ['64px', { lineHeight: '68px', letterSpacing: '-1.5px', fontWeight: '700' }],
        'display-xl': ['56px', { lineHeight: '60px', letterSpacing: '-1.2px', fontWeight: '700' }],
        'display-l': ['48px', { lineHeight: '52px', letterSpacing: '-0.8px', fontWeight: '700' }],
        'h1': ['32px', { lineHeight: '36px', letterSpacing: '-0.4px', fontWeight: '700' }],
        'h2': ['24px', { lineHeight: '28px', letterSpacing: '-0.3px', fontWeight: '600' }],
        'h3': ['20px', { lineHeight: '26px', letterSpacing: '-0.2px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-bold': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'label': ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' }],
        'caption': ['13px', { lineHeight: '18px', letterSpacing: '0.2px', fontWeight: '500' }],
        'micro': ['11px', { lineHeight: '14px', letterSpacing: '0.3px', fontWeight: '600' }],
        'eyebrow': ['11px', { lineHeight: '14px', letterSpacing: '1.5px', fontWeight: '700' }],
      },

      // ─── Spacing (system app) ──────────────────────────────────────────────
      spacing: {
        'xxs': '2px',
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',     // app: xl=24 (différent du skill v2 où xl=20)
        'xxl': '32px',
        'xxxl': '48px',
        'huge': '64px',
        'massive': '96px',
        'container': '24px',
      },

      // ─── Radius (system app : xs=2, sm=8, md=16, lg=24, xl=28, pill) ───────
      borderRadius: {
        'xs': '2px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',     // app: lg=24 (différent skill où lg=16)
        'xl': '28px',
        'xxl': '32px',
        'pill': '999px',
      },

      // ─── Glow effects signature (cyan/violet/purple app) ───────────────────
      boxShadow: {
        'glow-cyan': '0 0 12px rgba(0, 201, 255, 0.40), 0 0 24px rgba(0, 201, 255, 0.20)',
        'glow-cyan-strong': '0 0 20px rgba(0, 201, 255, 0.60), 0 0 40px rgba(0, 201, 255, 0.30)',
        'glow-violet': '0 0 12px rgba(108, 60, 224, 0.40), 0 0 24px rgba(108, 60, 224, 0.20)',
        'glow-violet-strong': '0 0 20px rgba(108, 60, 224, 0.60), 0 0 40px rgba(108, 60, 224, 0.30)',
        'glow-purple': '0 0 12px rgba(168, 85, 247, 0.40), 0 0 24px rgba(168, 85, 247, 0.20)',
        'glow-marker': '0 0 12px rgba(0, 201, 255, 0.80), 0 0 24px rgba(108, 60, 224, 0.40)',
        'glow-gold': '0 0 16px rgba(255, 215, 0, 0.30)',
        // Cards
        'card-sm': '0 2px 8px rgba(0, 0, 0, 0.20)',
        'card-md': '0 4px 16px rgba(0, 0, 0, 0.30)',
        'card-lg': '0 8px 24px rgba(0, 0, 0, 0.40)',
      },

      // ─── Backdrop blur (glass effect — heavy=50 app) ───────────────────────
      backdropBlur: {
        'glass': '24px',
        'glass-heavy': '50px',  // GlassCard intensity heavy
        'glass-light': '20px',
      },

      // ─── Gradients signature ───────────────────────────────────────────────
      backgroundImage: {
        // Gradient signature app : cyan → violet → purple (3 stops)
        'gradient-foreas': 'linear-gradient(135deg, #00C9FF 0%, #6C3CE0 50%, #A855F7 100%)',
        'gradient-foreas-h': 'linear-gradient(90deg, #00C9FF 0%, #6C3CE0 50%, #A855F7 100%)',
        'gradient-cyan-violet': 'linear-gradient(135deg, #00C9FF 0%, #6C3CE0 100%)',
        'gradient-violet-purple': 'linear-gradient(135deg, #6C3CE0 0%, #A855F7 100%)',
        'gradient-admin': 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        // Mesh radial signature (app HomeScreen marker pulse)
        'mesh-foreas': 'radial-gradient(circle at 25% 30%, rgba(0, 201, 255, 0.18) 0%, transparent 45%), radial-gradient(circle at 75% 70%, rgba(108, 60, 224, 0.15) 0%, transparent 50%), radial-gradient(circle at 50% 100%, rgba(168, 85, 247, 0.10) 0%, transparent 60%)',
        // Legacy alias
        'gradient-accent': 'linear-gradient(135deg, #00C9FF 0%, #6C3CE0 50%, #A855F7 100%)',
      },

      // ─── Transitions duration (motion app : fast 180 / normal 300 / slow 500) ─
      transitionDuration: {
        'instant': '120ms',
        'fast': '180ms',     // app fast
        'base': '300ms',     // app normal
        'slow': '500ms',     // app slow
        'cinematic': '720ms',
      },

      // ─── Animations ────────────────────────────────────────────────────────
      animation: {
        'fade-in': 'fadeIn 300ms cubic-bezier(0, 0, 0.2, 1)',
        'slide-up': 'slideUp 300ms cubic-bezier(0, 0, 0.2, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        // Pulse marker signature (HomeScreen .pr ring expansion)
        'marker-pulse': 'markerPulse 2.5s ease-out infinite',
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
        markerPulse: {
          '0%': { transform: 'translate(-50%, -50%) scale(0.4)', opacity: '1' },
          '100%': { transform: 'translate(-50%, -50%) scale(2.5)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
