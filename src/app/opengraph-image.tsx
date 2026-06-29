import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Image de partage social (Open Graph) par défaut de tout le site foreas.xyz.
// Fond = visuel cinématique « la ville qui paie » (og-bg.jpg) + scrim sombre à gauche
// pour la lisibilité + copy incrustée crisp (charte FOREAS, 0 « IA/copilote »).
// runtime nodejs = nécessaire pour lire le fichier image en bytes (fs).
export const runtime = 'nodejs'
export const alt = 'FOREAS — Gagne plus, roule moins.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const VIOLET = '#8C52FF'
const CYAN = '#00D4FF'

export default async function OpengraphImage() {
  const bg = await readFile(join(process.cwd(), 'src/app/og-bg.jpg'))
  const bgSrc = `data:image/jpeg;base64,${bg.toString('base64')}`

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', fontFamily: 'sans-serif' }}>
        {/* Fond : la ville qui paie */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bgSrc}
          width={1200}
          height={630}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* Scrim gauche→droite (le texte vit sur la zone sombre, la ville respire à droite) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            backgroundImage:
              'linear-gradient(90deg, rgba(3,4,8,0.95) 0%, rgba(3,4,8,0.78) 40%, rgba(3,4,8,0.18) 70%, rgba(3,4,8,0) 100%)',
          }}
        />
        {/* Scrim bas (pose le footer) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            backgroundImage: 'linear-gradient(0deg, rgba(3,4,8,0.85) 0%, rgba(3,4,8,0) 26%)',
          }}
        />

        {/* Contenu */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '60px 70px',
          }}
        >
          {/* Haut : wordmark + pastille plateformes */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: 6, color: '#F8FAFC', display: 'flex' }}>
              FOREAS
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 18px',
                borderRadius: 9999,
                border: '1px solid rgba(0,212,255,0.4)',
                backgroundColor: 'rgba(6,10,20,0.6)',
                color: CYAN,
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: 9999, backgroundColor: '#10B981', display: 'flex' }} />
              Uber · Bolt · Heetch · +4 — lus en direct
            </div>
          </div>

          {/* Héros + sous-titre identité */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                fontSize: 86,
                fontWeight: 800,
                letterSpacing: -3,
                lineHeight: 1.02,
                color: '#FFFFFF',
              }}
            >
              <span>Gagne plus,</span>
              <span style={{ display: 'flex' }}>
                <span>roule{' '}</span>
                <span style={{ color: CYAN }}>moins.</span>
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                fontSize: 31,
                color: '#D4DAE6',
                fontWeight: 500,
                lineHeight: 1.3,
                maxWidth: 700,
              }}
            >
              <span>Les autres acceptent à l&apos;aveugle.</span>
              <span style={{ display: 'flex' }}>
                <span>Toi, tu vois ton{' '}</span>
                <span style={{ color: '#FFFFFF', fontWeight: 700 }}>net réel</span>
                <span>{' '}avant.</span>
              </span>
            </div>
          </div>

          {/* Bas : barre dégradée + url + mécanisme */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                height: 5,
                width: 440,
                borderRadius: 9999,
                display: 'flex',
                backgroundImage: `linear-gradient(90deg, ${VIOLET}, ${CYAN})`,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', fontSize: 28, color: '#F8FAFC', fontWeight: 700 }}>foreas.xyz</div>
              <div style={{ display: 'flex', fontSize: 23, color: '#9AA3B2', fontWeight: 500 }}>
                FOREAS lit les 7 apps en direct
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
