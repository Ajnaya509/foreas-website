'use client'

import { useLayoutEffect, useRef, useState } from 'react'

/**
 * FeatureScreens — les écrans produit des 4 features restantes.
 *
 * ⚠️ LA CONTRAINTE QUI COMMANDE TOUT LE RESTE (audit Fable) : ces écrans sont dessinés à
 * l'échelle 430×932 puis RÉDUITS dans un cadre de ~170px sur mobile → facteur 0,395.
 * Un texte de 14px de design s'affiche donc à 5,5px réels : illisible. Seuil réel ≈ 10px,
 * donc **aucun texte sous 26px de design**. C'est ce qui a tué la première version : toute la
 * charge de preuve (0,00 € de commission, +15 min, la provision) était invisible pour 80 % du
 * trafic — joli en maquette, mort sur un vrai téléphone.
 *
 * D'où la règle de composition, alignée sur le design « Fiches Store » de Chandler
 * (« chaque visuel fonctionne comme une affiche : une idée, une émotion, moins de 8 mots ») :
 *   1 eyebrow · 1 titre court · 1 signature visuelle · 1 preuve GÉANTE · 1 phrase d'Ajnaya.
 * Rien d'autre. Le reste est texture.
 *
 * La phrase d'Ajnaya en bas de chaque écran n'est pas décorative : elle fait du CTA
 * « Discuter avec Ajnaya » la SUITE d'une conversation déjà commencée, pas un démarrage à froid.
 *
 * Tokens (DESIGN_SYSTEM_MASTER §0, qui prime) : fond app #0B0F1E (Obsidian réel, pas un noir
 * inventé) · verre rgba(17,21,40,.88) · titres Genos · UI/eyebrow Inter · corps #FFFFFF ·
 * #F8FAFC réservé aux display · cyan #5EE7FF · or #E8A23D (hexagones H3).
 */

export type ScreenKind = 'zone' | 'voice' | 'direct' | 'compta'

const SCREEN_W = 430
const SCREEN_H = 932

/* ─── Échelle de tailles : le minimum absolu est 26 (≈10px réels à 170px de cadre) ─────────── */
const T = {
  eyebrow: 26,
  title: 58,
  proofHuge: 96,
  proofBig: 72,
  ajnaya: 30,
} as const

const GENOS = "var(--font-genos), 'Genos', sans-serif"
const INTER = "var(--font-inter), 'Inter', system-ui, sans-serif"
const OBSIDIAN = '#0B0F1E'
const GLASS = 'rgba(17,21,40,.88)'
const GLASS_BORDER = '1px solid rgba(255,255,255,.08)'
const CYAN = '#5EE7FF'
const GOLD = '#E8A23D'

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: SCREEN_W, height: SCREEN_H, position: 'relative', overflow: 'hidden', background: OBSIDIAN }}>
      {children}
    </div>
  )
}

/**
 * Met l'écran 430×932 à l'échelle de son cadre.
 * ResizeObserver et non CSS pur : `scale(calc(100cqw / 430))` est invalide (diviser une longueur
 * par un nombre ne donne pas un facteur d'échelle) — vérifié, le navigateur ignore la règle.
 * L'observateur ne se déclenche qu'au redimensionnement, jamais au scroll : zéro coût par frame.
 */
function ScaledScreen({ children }: { children: React.ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useLayoutEffect(() => {
    const el = hostRef.current
    if (!el) return
    const apply = () => {
      const w = el.clientWidth
      if (w > 0) setScale(w / SCREEN_W)
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={hostRef} className="relative h-full w-full overflow-hidden">
      <div
        style={{
          position: 'absolute', top: 0, left: 0, width: SCREEN_W, height: SCREEN_H,
          transformOrigin: 'top left', transform: `scale(${scale})`,
          visibility: scale === 0 ? 'hidden' : 'visible',
        }}
      >
        {children}
      </div>
    </div>
  )
}

/** Tête d'écran : eyebrow + titre. Le dégradé garantit que le titre n'est jamais sur du visuel nu. */
function Head({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 430,
          background: `linear-gradient(180deg,${OBSIDIAN} 42%,rgba(11,15,30,.9) 70%,transparent 100%)`,
        }}
      />
      <div style={{ position: 'relative', padding: '84px 40px 0', zIndex: 2 }}>
        <div style={{ fontFamily: INTER, fontSize: T.eyebrow, fontWeight: 800, letterSpacing: '.22em', color: CYAN }}>
          {eyebrow}
        </div>
        <div style={{ fontFamily: GENOS, fontSize: T.title, fontWeight: 700, lineHeight: 1.04, letterSpacing: '-0.02em', marginTop: 22, color: '#F8FAFC' }}>
          {title}
        </div>
      </div>
    </>
  )
}

/**
 * La phrase d'Ajnaya, en bas de chaque écran : c'est elle qui transforme le CTA
 * « Discuter avec Ajnaya » en « continuer » plutôt qu'en « commencer ».
 */
function AjnayaLine({ text }: { text: string }) {
  return (
    <div style={{ position: 'absolute', left: 40, right: 40, bottom: 68, zIndex: 3 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, background: GLASS, border: GLASS_BORDER, borderRadius: 28, padding: '24px 26px' }}>
        <span
          style={{
            width: 44, height: 44, flex: 'none', borderRadius: '50%',
            background: 'linear-gradient(135deg,#8C52FF,#5EE7FF)',
          }}
          aria-hidden
        />
        <div style={{ fontFamily: INTER, fontSize: T.ajnaya, fontWeight: 500, lineHeight: 1.42, color: '#FFFFFF' }}>
          {text}
        </div>
      </div>
    </div>
  )
}

/** Grille de rues — texture de fond « carte ». */
function StreetGrid() {
  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        background:
          'repeating-linear-gradient(75deg, transparent 0 52px, rgba(255,255,255,.045) 52px 53px),' +
          'repeating-linear-gradient(-12deg, transparent 0 60px, rgba(255,255,255,.035) 60px 61px)',
      }}
    />
  )
}

/* ═══ ZONE — « La zone s'allume. Ton appli sonne après. » ═══════════════════════════════════ */
function ZoneScreen() {
  return (
    <Screen>
      <StreetGrid />
      {/* hexagones H3 : la signature « zone » de la marque */}
      <svg viewBox={`0 0 ${SCREEN_W} ${SCREEN_H}`} style={{ position: 'absolute', inset: 0, width: SCREEN_W, height: SCREEN_H }}>
        <polygon points="215,300 271,332 271,396 215,428 159,396 159,332" fill="rgba(196,141,44,.42)" stroke={GOLD} strokeWidth="2.4" />
        <polygon points="103,364 159,396 159,460 103,492 47,460 47,396" fill="rgba(196,141,44,.20)" stroke="rgba(232,162,61,.65)" strokeWidth="1.8" />
        <polygon points="327,364 383,396 383,460 327,492 271,460 271,396" fill="rgba(196,141,44,.14)" stroke="rgba(232,162,61,.5)" strokeWidth="1.6" />
      </svg>
      <Head eyebrow="OÙ ÇA PAIE" title="Arrive avant la demande." />
      {/* LA preuve, en géant : le créneau. Lisible même réduit. */}
      <div style={{ position: 'absolute', top: 540, left: 40, right: 40, zIndex: 2 }}>
        <div style={{ fontFamily: INTER, fontSize: T.eyebrow, fontWeight: 800, letterSpacing: '.18em', color: 'rgba(255,255,255,.5)' }}>OPÉRA · DANS</div>
        <div style={{ fontFamily: GENOS, fontSize: T.proofHuge, fontWeight: 700, letterSpacing: '-0.03em', color: CYAN, lineHeight: 1, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
          15 min
        </div>
      </div>
      <AjnayaLine text="Opéra monte dans 15 min. Bouge." />
    </Screen>
  )
}

/* ═══ VOICE — « Ajnaya parle. Toi, tu conduis. » ════════════════════════════════════════════ */
function VoiceScreen() {
  const bars = [40, 84, 132, 68, 108, 52, 148, 90, 62, 116, 46, 96]
  return (
    <Screen>
      <StreetGrid />
      <Head eyebrow="MAINS SUR LE VOLANT" title="Elle répond. Tu conduis." />
      {/* onde vocale — grande, donc encore lisible comme forme une fois réduite */}
      <div style={{ position: 'absolute', top: 430, left: 40, right: 40, zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, height: 170 }}>
          {bars.map((h, i) => (
            <span
              key={i}
              style={{
                width: 10, height: h, borderRadius: 5,
                background: 'linear-gradient(180deg,#5EE7FF 0%,#8C52FF 100%)',
                opacity: 0.4 + (h / 148) * 0.6,
              }}
            />
          ))}
        </div>
      </div>
      <AjnayaLine text="Gare de Lyon. 20 minutes." />
    </Screen>
  )
}

/* ═══ DIRECT — « Une course à 25 € ? 25 € pour toi. » ══════════════════════════════════════ */
function DirectScreen() {
  return (
    <Screen>
      <StreetGrid />
      <Head eyebrow="CLIENT DIRECT" title="Ce client est à toi." />
      <div style={{ position: 'absolute', top: 370, left: 40, right: 40, zIndex: 2 }}>
        {/* la preuve : le montant entier, et la commission à zéro — les deux en géant */}
        <div style={{ background: GLASS, border: GLASS_BORDER, borderRadius: 32, padding: '30px 32px' }}>
          <div style={{ fontFamily: INTER, fontSize: T.eyebrow, fontWeight: 800, letterSpacing: '.18em', color: 'rgba(255,255,255,.5)' }}>LA COURSE</div>
          <div style={{ fontFamily: GENOS, fontSize: T.proofBig, fontWeight: 700, letterSpacing: '-0.03em', color: '#F8FAFC', lineHeight: 1.05, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
            25,00 €
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,.09)', margin: '24px 0' }} />
          <div style={{ fontFamily: INTER, fontSize: T.eyebrow, fontWeight: 800, letterSpacing: '.18em', color: 'rgba(255,255,255,.5)' }}>COMMISSION</div>
          <div style={{ fontFamily: GENOS, fontSize: T.proofBig, fontWeight: 700, letterSpacing: '-0.03em', color: CYAN, lineHeight: 1.05, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
            0,00 €
          </div>
        </div>
      </div>
      <AjnayaLine text="Sarah a réservé. 25 € pour toi." />
    </Screen>
  )
}

/* ═══ COMPTA — guardrail légal : « se calcule », JAMAIS « on fait ta compta » ni « met de côté »
   (dire que l'app déplace de l'argent serait faux ET juridiquement risqué). ═══════════════════ */
function ComptaScreen() {
  const R = 118, C = 2 * Math.PI * R, pct = 0.72
  return (
    <Screen>
      <StreetGrid />
      <Head eyebrow="ZÉRO SAISIE" title="Le trimestre ne surprend plus." />
      <div style={{ position: 'absolute', top: 380, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
        <div style={{ position: 'relative', width: 300, height: 300 }}>
          <svg width="300" height="300" viewBox="0 0 300 300">
            <circle cx="150" cy="150" r={R} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="18" />
            <circle
              cx="150" cy="150" r={R} fill="none" stroke={GOLD} strokeWidth="18" strokeLinecap="round"
              strokeDasharray={`${C * pct} ${C}`} transform="rotate(-90 150 150)"
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: GENOS, fontSize: T.proofBig, fontWeight: 700, letterSpacing: '-0.02em', color: '#F8FAFC', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              1 240 €
            </div>
            <div style={{ fontFamily: INTER, fontSize: T.eyebrow, fontWeight: 600, color: 'rgba(255,255,255,.55)', marginTop: 12 }}>
              provision calculée
            </div>
          </div>
        </div>
      </div>
      <AjnayaLine text="Octobre est déjà provisionné." />
    </Screen>
  )
}

export default function FeatureScreen({ kind }: { kind: ScreenKind }) {
  const screen =
    kind === 'zone' ? <ZoneScreen /> :
    kind === 'voice' ? <VoiceScreen /> :
    kind === 'direct' ? <DirectScreen /> :
    <ComptaScreen />
  return <ScaledScreen>{screen}</ScaledScreen>
}

export { SCREEN_W, SCREEN_H }
