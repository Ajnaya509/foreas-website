'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { setTrackingConsent, loadTrackingPixels } from '@/lib/consent'

// ═══════════════════════════════════════════════════════════════════════════
//  LES DEUX RÉGLAGES DE CHANDLER — tout le reste peut être ignoré
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ⏱️ LA VITESSE — Chandler choisit. Temps avant que le bandeau apparaisse.
 *
 *   0      = tout de suite (le plus agressif, le plus refusé)
 *   6000   = 6 secondes (défaut : il a eu le temps de voir la page)
 *   15000  = 15 secondes (le plus doux, mais beaucoup partent avant)
 *
 * Pourquoi pas tout de suite : un bandeau qui saute à la figure avant que la
 * page soit lue se ferme par réflexe, sans être lu. Attendre quelques secondes
 * fait payer un prix — certains partent avant — mais ceux qui restent lisent.
 */
const DELAI_AVANT_BANDEAU_MS = 6000

/**
 * 📝 LE TEXTE — n°10 « La vitesse », choisi par Chandler.
 * Source : FOREAS-SHARED/15_BANDEAUX_CONSENTEMENT_2026-08-28.md
 *
 * Il marche parce qu'il parle du problème du chauffeur, pas du nôtre : une
 * page qui rame lui coûte des courses. La contrepartie est immédiate et
 * vérifiable par lui.
 *
 * ⚠️ UN MOT A ÉTÉ AJOUTÉ, ET CE N'EST PAS COSMÉTIQUE. Le texte d'origine
 * disait seulement « la mesure ». Or ce bandeau ne débloque PLUS la mesure —
 * elle tourne déjà pour tout le monde, sans rien demander (dispense CNIL
 * tenue dans src/lib/mesureProduit.ts). Il ne débloque QUE les pixels Meta et
 * TikTok, c'est-à-dire de la PUBLICITÉ. Un accord obtenu en parlant de
 * « mesure » alors qu'on envoie les données à Facebook est un accord NUL, et
 * c'est exactement ce qui se plaide lors d'un contrôle. D'où « et nos
 * annonces » : quatre mots qui rendent l'accord valable sans casser l'angle.
 */
const TEXTE = {
  titre: 'Un site lent te fait perdre des courses.',
  corps: 'La mesure nous dit quelle page rame, et nos annonces. On répare.',
  accepter: 'D’accord',
}

/**
 * 🚫 OÙ IL NE S'AFFICHE JAMAIS.
 *
 * Le formulaire de paiement. Un bandeau qui surgit pendant qu'on tape un
 * numéro de carte est la meilleure façon de faire fermer l'onglet — et c'est
 * précisément l'écran qu'on essaie de faire franchir. Le visiteur reverra le
 * bandeau ailleurs sur le site ; il n'est pas perdu, il est reporté.
 */
const CHEMINS_SANS_BANDEAU = new Set(['/tarifs3', '/checkout'])

// ═══════════════════════════════════════════════════════════════════════════

export function ConsentBanner() {
  const [visible, setVisible] = useState(false)
  const bandeau = useRef<HTMLDivElement>(null)
  const chemin = usePathname()

  // Apparition différée. Le compteur ne démarre même pas sur une page exclue,
  // et il est annulé si le visiteur quitte la page avant la fin du délai.
  useEffect(() => {
    if (chemin && CHEMINS_SANS_BANDEAU.has(chemin)) return
    if (document.cookie.includes('foreas_consent=')) return

    const minuteur = setTimeout(() => setVisible(true), DELAI_AVANT_BANDEAU_MS)
    return () => clearTimeout(minuteur)
  }, [chemin])

  // ─────────────────────────────────────────────────────────────────────────
  // ⚠️ 21/08/2026 — CE BANDEAU RECOUVRAIT LE BOUTON PRINCIPAL DE /experience.
  //
  // Mesuré à 390 × 844 : le bouton « Essayer gratuitement » vit dans une barre
  // collante en bas d'écran (z-50, 78 px). Le bandeau occupe les derniers
  // pixels en z-[9999] avec pointer-events: auto. Recouvrement TOTAL, et
  // uniquement pour les visiteurs qui n'ont pas encore répondu — c'est-à-dire
  // tous les nouveaux venus, exactement ceux qu'on essaie de convertir.
  // Quelqu'un qui a déjà répondu ne le voit jamais : c'est pour ça que ça a
  // pu durer.
  //
  // On publie donc la hauteur RÉELLE du bandeau (mesurée, pas devinée : elle
  // change avec la largeur d'écran et la zone sûre de l'appareil). Deux
  // canaux, parce que deux consommateurs différents existent déjà dans le
  // dépôt et qu'aucun ne doit casser :
  //   • la variable CSS --hauteur-bandeau-consentement (barres collantes)
  //   • l'événement foreas:consent-banner-height + --consent-banner-h
  //     (mutation impérative : un calc(var(--x)) posé en className à travers
  //     une frontière d'hydratation React ne s'est PAS recalculé de façon
  //     fiable — valeur figée à la frontière initiale, vérifié au navigateur)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const racine = document.documentElement
    const publier = (h: number) => {
      racine.style.setProperty('--hauteur-bandeau-consentement', `${h}px`)
      racine.style.setProperty('--consent-banner-h', `${h}px`)
      window.dispatchEvent(
        new CustomEvent('foreas:consent-banner-height', { detail: { height: h } })
      )
    }

    if (!visible) {
      publier(0)
      return
    }

    const el = bandeau.current
    if (!el) return

    const mesurer = () => publier(el.offsetHeight)
    mesurer()

    const observateur = new ResizeObserver(mesurer)
    observateur.observe(el)
    window.addEventListener('resize', mesurer)

    return () => {
      observateur.disconnect()
      window.removeEventListener('resize', mesurer)
      publier(0)
    }
  }, [visible])

  const accepter = () => {
    setTrackingConsent(true)
    setVisible(false)
    loadTrackingPixels()
  }

  const refuser = () => {
    setTrackingConsent(false)
    setVisible(false)
  }

  if (!visible) return null

  return (
    /* paddingBottom avec env(safe-area-inset-bottom) : sur iPhone, sans ça le
       bouton tombe sous la barre de gestes et devient intappable. */
    <div
      ref={bandeau}
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#0a0a10]/95 backdrop-blur-md border-t border-white/10 px-4 pt-3.5"
      style={{ paddingBottom: 'calc(0.875rem + env(safe-area-inset-bottom, 0px))' }}
      role="dialog"
      aria-label="Publicité"
    >
      {/* relative : ancre la croix de refus dans ce bloc, en haut à droite. */}
      <div className="relative max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
        {/* ─────────────────────────────────────────────────────────────────
            LE REFUS — demandé « tout petit, presque invisible, en haut ».

            Il est discret À L'ŒIL mais reste ATTEIGNABLE AU DOIGT : le signe
            fait 11 px, la zone tapable en fait 44 (le minimum tactile). Sans
            ce décalage, la croix ne serait pas petite, elle serait ratée — et
            un visiteur qui n'arrive pas à refuser ne s'en va pas en silence,
            il signale. Sur des chauffeurs qui se méfient déjà des
            plateformes, c'est le pire résultat possible.

            ⚠️ À SAVOIR : la CNIL demande que refuser soit AUSSI SIMPLE
            qu'accepter. Une croix à 30 % d'opacité en face d'un bouton plein
            ne l'est pas. C'est un choix assumé de Chandler, pas un oubli.
            Le risque n'est pas théorique : c'est le motif de sanction le plus
            fréquent sur les bandeaux en France.
            ───────────────────────────────────────────────────────────────── */}
        <button
          onClick={refuser}
          aria-label="Refuser la publicité personnalisée"
          className="absolute -top-1 right-0 sm:-top-2 w-11 h-11 flex items-center justify-center text-white/25 hover:text-white/70 focus-visible:text-white/70 transition-colors"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
            <path
              d="M1 1L10 10M10 1L1 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* pr-12 : réserve la place de la croix pour que le texte ne passe
            jamais dessous sur mobile. */}
        <p className="text-[13px] sm:text-sm text-white/65 leading-snug sm:leading-relaxed flex-1 pr-12 sm:pr-0">
          <span className="text-white/90 font-semibold">{TEXTE.titre}</span>{' '}
          {TEXTE.corps}{' '}
          <Link
            href="/confidentialite"
            className="text-[#00D4FF] underline underline-offset-2 hover:text-cyan-300 whitespace-nowrap"
          >
            Ce qu&apos;on collecte
          </Link>
        </p>

        {/* ─────────────────────────────────────────────────────────────────
            L'ACCEPTATION — sobre, pas un pavé cyan.

            Demande de Chandler. Le raisonnement tient : un bouton qui crie
            « CLIQUE ICI » sur une cible qui se méfie des plateformes fait
            l'effet inverse de celui qu'on cherche. Le texte fait le travail
            de conviction ; le bouton n'a qu'à être clair et facile à toucher.

            h-11 = 44 px : la cible tactile minimale est gardée. Discret ne
            veut pas dire raté.
            ───────────────────────────────────────────────────────────────── */}
        <div className="flex flex-shrink-0">
          <button
            onClick={accepter}
            className="h-11 w-full sm:w-auto sm:px-7 rounded-xl border border-white/25 bg-white/[0.07] text-white/90 hover:bg-white/[0.13] hover:border-white/40 active:scale-[0.97] transition text-sm font-semibold"
          >
            {TEXTE.accepter}
          </button>
        </div>
      </div>
    </div>
  )
}
