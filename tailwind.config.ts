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

      // ─── Typography — Site2026v50 (Inter + Genos préservé) ─────────────────
      // Inter (next/font/google) = remplace Montserrat sur body + h1-h6 + UI
      // Genos = font-title et font-display (préserve choix créatif historique)
      //   + Genos Italic via .font-subtitle / .tagline pour subtitles
      // Letter-spacing Genos +0.02em positif (Genos est CONDENSÉE par nature)
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        // font-title et font-display = Genos (137 usages historiques préservés)
        title: ['Genos', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['Genos', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      // ─── Échelle modulaire Apple HIG (ratio 1.250 — Major Third Bringhurst) ─
      // Toutes les line-heights = multiples de 4 (baseline grid strict)
      // Letter-spacings : negative display (-2.5% à -2%), neutral body, eyebrow 12%
      fontSize: {
        // Display — Inter Display optical sizing (axis 24-72)
        'display-xxl': ['72px', { lineHeight: '76px', letterSpacing: '-2.0px', fontWeight: '900' }],
        'display-xl':  ['56px', { lineHeight: '60px', letterSpacing: '-1.5px', fontWeight: '900' }],
        'display-l':   ['40px', { lineHeight: '48px', letterSpacing: '-1.0px', fontWeight: '800' }],
        // Headings — ratio 1.25 strict
        'h1': ['34px', { lineHeight: '40px', letterSpacing: '-0.8px', fontWeight: '800' }],
        'h2': ['28px', { lineHeight: '36px', letterSpacing: '-0.6px', fontWeight: '700' }],
        'h3': ['20px', { lineHeight: '28px', letterSpacing: '-0.4px', fontWeight: '700' }],
        // Body — Inter Text optical sizing (axis 12-22), lineHeight 1.5+ Bringhurst
        'body-lg':   ['17px', { lineHeight: '28px', letterSpacing: '-0.2px', fontWeight: '500' }],
        'body':      ['15px', { lineHeight: '24px', letterSpacing: '-0.1px', fontWeight: '400' }],
        'body-bold': ['15px', { lineHeight: '24px', letterSpacing: '-0.1px', fontWeight: '700' }],
        // Labels — captions/micro
        'label':   ['13px', { lineHeight: '18px', letterSpacing: '0.1px', fontWeight: '600' }],
        'caption': ['13px', { lineHeight: '18px', letterSpacing: '0.2px', fontWeight: '500' }],
        'micro':   ['11px', { lineHeight: '16px', letterSpacing: '0.4px', fontWeight: '600' }],
        // Eyebrow — UPPERCASE, LS 12% (Lupton 5-12% canonical)
        'eyebrow': ['11px', { lineHeight: '16px', letterSpacing: '1.3px', fontWeight: '800' }],
        // Fluid display (Bringhurst clamp signature) — display-fluid scale automatically
        'display-fluid': ['clamp(2rem, 4vw + 1rem, 4.5rem)', { lineHeight: '1.05', letterSpacing: '-0.025em', fontWeight: '900' }],
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
        // Hero overlay diagonal (signature page einvoice — couches additionnelles)
        'hero-overlay': 'linear-gradient(135deg, rgba(0, 212, 255, 0.08) 0%, rgba(140, 82, 255, 0.08) 50%, transparent 100%)',
        // ─── Section backgrounds — teintes sémantiques (storytelling visuel) ───
        // Pattern app /facturation-electronique-vtc-2026 : chaque section a sa teinte
        'section-cyan': 'linear-gradient(180deg, transparent 0%, rgba(0, 212, 255, 0.04) 50%, transparent 100%)',
        'section-violet': 'linear-gradient(180deg, transparent 0%, rgba(140, 82, 255, 0.05) 50%, transparent 100%)',
        'section-orange': 'linear-gradient(180deg, transparent 0%, rgba(251, 146, 60, 0.04) 50%, transparent 100%)',
        'section-gold': 'linear-gradient(180deg, transparent 0%, rgba(245, 200, 66, 0.04) 50%, transparent 100%)',
        'section-success': 'linear-gradient(180deg, transparent 0%, rgba(16, 185, 129, 0.04) 50%, transparent 100%)',
        // Section CTA finale (gradient diagonal montant — signature einvoice)
        'section-cta': 'linear-gradient(135deg, rgba(0, 212, 255, 0.06) 0%, rgba(140, 82, 255, 0.10) 100%)',
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
