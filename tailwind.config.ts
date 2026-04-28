import type { Config } from 'tailwindcss'

/**
 * FOREAS Tailwind — Aligné tokens v2 canonical de l'app FOREAS Driver
 * Source : `~/FOREAS-Clean/src/design/tokens.v2.ts` + skill foreas-mobile-design.md
 * Tokens TS : `src/design/tokens.ts` (single source of truth)
 *
 * Site2026v43 — Refonte FOREAS-Grade (cognition × émotion × conversion)
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
        // ─── FOREAS — Palette v2 canonique (mirror app `tokens.v2.ts`) ──────
        foreas: {
          // Aliases legacy (rétrocompat code existant) → pointent vers obsidian
          deepblack: '#060610',
          black: '#060610',
          dark: '#070A14',
          navy: '#070A14',
          gray: '#111528',
          muted: 'rgba(255, 255, 255, 0.45)',
          light: '#FFFFFF',

          // Noms canoniques (à utiliser de préférence)
          obsidian: '#060610',
          'obsidian-deep': '#070A14',
          'obsidian-light': '#111528',
        },
        // Accents signature
        accent: {
          cyan: '#00D4FF',
          'cyan-ice': '#6DEAFF',
          'cyan-deep': '#00A3CC',
          purple: '#8C52FF',
          'purple-deep': '#6C3CE0',
          'purple-mist': '#B494FF',
          violet: '#8C52FF',         // alias
          gold: '#F5C842',
          'gold-radiant': '#FFD659',
          // Legacy
          blue: '#3B82F6',
          green: '#10B981',
          magenta: '#EC4899',
        },
        // Glass — 3 niveaux empilables (signature glassmorphism)
        glass: {
          high: 'rgba(17, 21, 40, 0.88)',
          mid: 'rgba(17, 21, 40, 0.72)',
          low: 'rgba(17, 21, 40, 0.55)',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-high': 'rgba(255, 255, 255, 0.18)',
        },
        // États sémantiques
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
        // Texte
        text: {
          hero: '#F8FAFC',
          primary: '#FFFFFF',
          secondary: 'rgba(255, 255, 255, 0.72)',
          tertiary: 'rgba(255, 255, 255, 0.45)',
          muted: 'rgba(255, 255, 255, 0.28)',
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
      // 13 niveaux + eyebrow — mirror app TYPO_V2
      fontSize: {
        // Display — letterSpacing négatif (resserrement = autorité)
        'display-xxl': ['56px', { lineHeight: '60px', letterSpacing: '-2.0px', fontWeight: '900' }],
        'display-xl':  ['42px', { lineHeight: '48px', letterSpacing: '-1.5px', fontWeight: '900' }],
        'display-l':   ['32px', { lineHeight: '38px', letterSpacing: '-1.0px', fontWeight: '800' }],
        // Headings
        'h1': ['24px', { lineHeight: '30px', letterSpacing: '-0.6px', fontWeight: '800' }],
        'h2': ['20px', { lineHeight: '26px', letterSpacing: '-0.4px', fontWeight: '700' }],
        'h3': ['17px', { lineHeight: '22px', letterSpacing: '-0.2px', fontWeight: '700' }],
        // Body
        'body-lg':   ['16px', { lineHeight: '22px', letterSpacing: '-0.1px', fontWeight: '500' }],
        'body':      ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-bold': ['14px', { lineHeight: '20px', fontWeight: '700' }],
        // Labels
        'label':   ['12px', { lineHeight: '16px', letterSpacing: '0.2px',  fontWeight: '600' }],
        'caption': ['11px', { lineHeight: '14px', letterSpacing: '0.15px', fontWeight: '500' }],
        'micro':   ['10px', { lineHeight: '13px', letterSpacing: '0.5px',  fontWeight: '600' }],
        // Eyebrow — UPPERCASE LS 2.5 (signature)
        'eyebrow': ['10px', { lineHeight: '14px', letterSpacing: '2.5px', fontWeight: '800' }],
      },

      // ─── Spacing 4pt system ────────────────────────────────────────────────
      spacing: {
        'xxs': '2px',
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        'xxl': '24px',
        'xxxl': '32px',
        'huge': '48px',
        'massive': '64px',
        'section': '96px',          // section vertical padding desktop
        'section-mobile': '64px',   // section vertical padding mobile
      },

      // ─── Radius (mirror app v2) ────────────────────────────────────────────
      borderRadius: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        'xxl': '24px',
      },

      // ─── Shadows + glows signature ─────────────────────────────────────────
      boxShadow: {
        'glow-cyan': '0 0 24px rgba(0, 212, 255, 0.40)',
        'glow-cyan-strong': '0 0 40px rgba(0, 212, 255, 0.55)',
        'glow-violet': '0 0 24px rgba(140, 82, 255, 0.40)',
        'glow-violet-strong': '0 0 40px rgba(140, 82, 255, 0.55)',
        'glow-gold': '0 0 24px rgba(245, 200, 66, 0.30)',
        'glow-marker': '0 0 12px rgba(0, 212, 255, 0.80), 0 0 24px rgba(140, 82, 255, 0.40)',
        'card-sm': '0 2px 8px rgba(0, 0, 0, 0.20)',
        'card-md': '0 4px 16px rgba(0, 0, 0, 0.30)',
        'card-lg': '0 8px 26px rgba(0, 0, 0, 0.40)',
      },

      // ─── Backdrop blur (glass effects) ─────────────────────────────────────
      backdropBlur: {
        'glass-light': '20px',
        'glass': '24px',
        'glass-heavy': '50px',  // signature GlassCard
      },

      // ─── Gradients signature ───────────────────────────────────────────────
      backgroundImage: {
        // Hero 3-stops — signature FOREAS
        'gradient-foreas': 'linear-gradient(135deg, #00D4FF 0%, #8C52FF 50%, #B494FF 100%)',
        'gradient-foreas-h': 'linear-gradient(90deg, #00D4FF 0%, #8C52FF 50%, #B494FF 100%)',
        // Royal — violet pure (Ajnaya brand)
        'gradient-royal': 'linear-gradient(135deg, #8C52FF 0%, #6C3CE0 100%)',
        // Ice — cyan pure (info)
        'gradient-ice': 'linear-gradient(135deg, #00D4FF 0%, #6DEAFF 100%)',
        // Gold — premium / success
        'gradient-gold': 'linear-gradient(135deg, #F5C842 0%, #FFD659 100%)',
        // Mesh radial signature (background hero subtil)
        'mesh-foreas': 'radial-gradient(ellipse 120% 60% at 50% -10%, rgba(0, 212, 255, 0.12) 0%, transparent 50%), radial-gradient(ellipse 100% 70% at 80% 50%, rgba(140, 82, 255, 0.10) 0%, transparent 45%), radial-gradient(ellipse 80% 50% at 30% 100%, rgba(180, 148, 255, 0.08) 0%, transparent 50%)',
        // Legacy alias (rétrocompat code existant)
        'gradient-accent': 'linear-gradient(90deg, #8C52FF 0%, #00D4FF 100%)',
      },

      // ─── Transitions duration (motion canonical) ───────────────────────────
      transitionDuration: {
        'instant': '120ms',
        'fast': '220ms',
        'base': '320ms',
        'slow': '480ms',
        'cinematic': '720ms',
      },

      // ─── Transition timing (Bezier précis, banni `ease`) ───────────────────
      transitionTimingFunction: {
        'standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'emphasized': 'cubic-bezier(0.2, 0, 0, 1)',
        'decelerate': 'cubic-bezier(0, 0, 0.2, 1)',
        'accelerate': 'cubic-bezier(0.4, 0, 1, 1)',
        'sharp': 'cubic-bezier(0.4, 0, 0.6, 1)',
        'apple': 'cubic-bezier(0.16, 1, 0.3, 1)',  // signature entrée
        'bouncy': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      // ─── Animations ────────────────────────────────────────────────────────
      animation: {
        'fade-in': 'fadeIn 320ms cubic-bezier(0, 0, 0.2, 1)',
        'slide-up': 'slideUp 320ms cubic-bezier(0, 0, 0.2, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'marker-pulse': 'markerPulse 2.5s ease-out infinite',
        // Ink drift (signature InkGradientButton — 30s cycle organique)
        'ink-drift': 'inkDrift 30s ease-in-out infinite',
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
          '0%':   { transform: 'translate(-50%, -50%) scale(0.4)', opacity: '1' },
          '100%': { transform: 'translate(-50%, -50%) scale(2.5)', opacity: '0' },
        },
        inkDrift: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg) scale(1)' },
          '25%':      { transform: 'translate(-12px, -3px) rotate(-2deg) scale(1.04)' },
          '50%':      { transform: 'translate(8px, 4px) rotate(2deg) scale(0.98)' },
          '75%':      { transform: 'translate(15px, -2px) rotate(1deg) scale(1.06)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
