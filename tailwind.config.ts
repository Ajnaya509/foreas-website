import type { Config } from 'tailwindcss'

/**
 * FOREAS Tailwind v2 — Aligné sur le design system de l'app FOREAS Driver
 * Source : ~/FOREAS-Clean/.claude/skills/foreas-mobile-design.md v1.0
 * Tokens TS : src/design/tokens.ts
 *
 * Site2026v41 — Refonte cohérente app/site/widget — 2026-04-28
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
        // ─── FOREAS unified palette (mirror app v2) ──────────────────────────
        // Obsidian — backgrounds multi-couches
        foreas: {
          // Aliases legacy (rétrocompat — tous pointent vers obsidian)
          deepblack: '#060610',  // ex-#050508 → aligné sur app
          black: '#060610',
          dark: '#070A14',
          navy: '#070A14',
          gray: '#111528',
          muted: 'rgba(255, 255, 255, 0.45)',
          light: '#FFFFFF',

          // Nouveaux noms canoniques (à utiliser de préférence)
          obsidian: '#060610',        // body background
          obsidianDeep: '#070A14',    // card layer 1
          obsidianLight: '#111528',   // card layer 2
        },
        // Accents signature
        accent: {
          cyan: '#00D4FF',         // primary action — alias cyanElectric
          purple: '#8C52FF',       // brand Ajnaya — alias violetRoyal
          gold: '#F5C842',         // success premium — REMPLACE ancien green
          // Legacy (rétrocompat — ne plus utiliser dans nouveau code)
          blue: '#3B82F6',
          green: '#10B981',
          magenta: '#EC4899',
        },
        // États fonctionnels
        danger: '#EF4444',
        warning: '#F5A623',
        // Texte (utilitaires)
        text: {
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
      // 11 niveaux + eyebrow (mirror app skill §3)
      fontSize: {
        // Display
        'display-xxl': ['64px', { lineHeight: '68px', letterSpacing: '-1.5px', fontWeight: '700' }],
        'display-xl': ['56px', { lineHeight: '60px', letterSpacing: '-1.2px', fontWeight: '700' }],
        'display-l': ['48px', { lineHeight: '52px', letterSpacing: '-0.8px', fontWeight: '700' }],
        // Headings
        'h1': ['36px', { lineHeight: '44px', letterSpacing: '-0.4px', fontWeight: '600' }],
        'h2': ['28px', { lineHeight: '36px', letterSpacing: '-0.3px', fontWeight: '600' }],
        'h3': ['22px', { lineHeight: '28px', letterSpacing: '-0.2px', fontWeight: '600' }],
        // Body
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-bold': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        // Labels
        'label': ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' }],
        'caption': ['12px', { lineHeight: '16px', letterSpacing: '0.2px', fontWeight: '500' }],
        'micro': ['10px', { lineHeight: '14px', letterSpacing: '0.3px', fontWeight: '600' }],
        // Eyebrow
        'eyebrow': ['11px', { lineHeight: '14px', letterSpacing: '1.5px', fontWeight: '700' }],
      },

      // ─── Spacing 4pt system (mirror app skill §3) ──────────────────────────
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
      },

      // ─── Radius (mirror app) ───────────────────────────────────────────────
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        'xxl': '24px',
        // round: 9999 reste via rounded-full Tailwind
      },

      // ─── Glow effects signature FOREAS ────────────────────────────────────
      boxShadow: {
        'glow-cyan': '0 0 16px rgba(0, 212, 255, 0.40)',
        'glow-cyan-strong': '0 0 24px rgba(0, 212, 255, 0.55)',
        'glow-violet': '0 0 16px rgba(140, 82, 255, 0.40)',
        'glow-violet-strong': '0 0 24px rgba(140, 82, 255, 0.55)',
        'glow-gold': '0 0 16px rgba(245, 200, 66, 0.30)',
        // Card shadows (3 niveaux)
        'card-sm': '0 2px 8px rgba(0, 0, 0, 0.20)',
        'card-md': '0 4px 16px rgba(0, 0, 0, 0.30)',
        'card-lg': '0 8px 24px rgba(0, 0, 0, 0.40)',
      },

      // ─── Backdrop blur (glass effect) ──────────────────────────────────────
      backdropBlur: {
        'glass': '20px',
      },

      // ─── Gradients ─────────────────────────────────────────────────────────
      backgroundImage: {
        'gradient-foreas': 'linear-gradient(90deg, #8C52FF 0%, #00D4FF 100%)',
        'gradient-accent': 'linear-gradient(90deg, #8C52FF 0%, #00D4FF 100%)',
        'gradient-gold': 'linear-gradient(135deg, #F5C842 0%, #F5A623 100%)',
        // Mesh gradient signature (équivalent app NUCLEAR static)
        'mesh-foreas': 'radial-gradient(circle at 20% 50%, rgba(140, 82, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0, 212, 255, 0.12) 0%, transparent 50%)',
      },

      // ─── Transitions duration (motion tokens skill §8) ─────────────────────
      transitionDuration: {
        'instant': '120ms',
        'fast': '220ms',
        'base': '320ms',
        'slow': '480ms',
        'cinematic': '720ms',
      },

      // ─── Animations ────────────────────────────────────────────────────────
      animation: {
        'fade-in': 'fadeIn 320ms cubic-bezier(0, 0, 0.2, 1)',
        'slide-up': 'slideUp 320ms cubic-bezier(0, 0, 0.2, 1)',
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
