import { ImageResponse } from 'next/og'

// Image de partage social (Open Graph) par défaut pour TOUT le site foreas.xyz.
// Next applique ce fichier comme og:image + twitter:image sur chaque route
// (y compris /download partagé par les chauffeurs en parrainage), sauf override
// par un opengraph-image.tsx plus spécifique.
// Charte FOREAS : noir AppleNoir + halos violet→cyan, accroche héros, quiet-tech.
export const runtime = 'edge'
export const alt = 'FOREAS — Gagne plus, roule moins. L\'IA des chauffeurs VTC.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const VIOLET = '#8C52FF'
const CYAN = '#00D4FF'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          backgroundColor: '#06080F',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Halo violet (haut-gauche) */}
        <div
          style={{
            position: 'absolute',
            top: -260,
            left: -160,
            width: 760,
            height: 760,
            borderRadius: 9999,
            backgroundImage: `radial-gradient(circle at center, ${VIOLET}55, transparent 62%)`,
          }}
        />
        {/* Halo cyan (bas-droite) */}
        <div
          style={{
            position: 'absolute',
            bottom: -320,
            right: -220,
            width: 820,
            height: 820,
            borderRadius: 9999,
            backgroundImage: `radial-gradient(circle at center, ${CYAN}44, transparent 62%)`,
          }}
        />

        {/* Haut : wordmark + pastille "en ligne" */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: 6,
              color: '#F8FAFC',
              display: 'flex',
            }}
          >
            FOREAS
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 20px',
              borderRadius: 9999,
              border: '1px solid rgba(0,212,255,0.35)',
              backgroundColor: 'rgba(0,212,255,0.08)',
              color: CYAN,
              fontSize: 24,
              fontWeight: 600,
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: 9999, backgroundColor: '#10B981', display: 'flex' }} />
            Ajnaya · en direct
          </div>
        </div>

        {/* Héros */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 92,
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 1.02,
              color: '#FFFFFF',
            }}
          >
            <span>Gagne plus,</span>
            <span>
              roule{' '}
              <span style={{ color: CYAN }}>moins.</span>
            </span>
          </div>
          <div style={{ display: 'flex', fontSize: 38, color: '#C7CEDB', fontWeight: 500, maxWidth: 920, lineHeight: 1.3 }}>
            L&apos;IA Ajnaya te dit où aller — avant de démarrer. Uber, Bolt, Heetch + 4 autres lus en direct.
          </div>
        </div>

        {/* Bas : barre dégradée + url + tag plateformes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div
            style={{
              height: 6,
              width: '100%',
              borderRadius: 9999,
              backgroundImage: `linear-gradient(90deg, ${VIOLET}, ${CYAN})`,
              display: 'flex',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', fontSize: 30, color: '#F8FAFC', fontWeight: 700, letterSpacing: 0.5 }}>
              foreas.xyz
            </div>
            <div style={{ display: 'flex', fontSize: 26, color: '#8A93A6', fontWeight: 500 }}>
              Net réel · commission déduite · en 1 seconde
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
