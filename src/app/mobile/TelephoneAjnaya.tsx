'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import a from '@/components/zone/ajnayaPhone.module.css'
import s from './telephone.module.css'

/**
 * LE TÉLÉPHONE À TROIS ÉTATS — demandé par Chandler le 03/09/2026.
 *
 *   1. POSÉ      — il demande une zone : le téléphone apparaît dans la page,
 *                  la réponse s'écrit dedans. On voit que c'est un objet du site.
 *   2. IMMERSIF  — il touche le champ : le téléphone prend TOUT l'écran, le
 *                  clavier monte, le champ se colle juste au-dessus.
 *                  À ce moment il n'est plus sur un site : il est dans l'app.
 *   3. POSÉ      — il a écrit ou parlé : le téléphone redescend et redevient
 *                  un objet posé dans la page.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ LE CLAVIER — C'EST LA PIÈCE DIFFICILE, PAS UN DÉTAIL
 *
 * La charte range « le sursaut au moment où l'on tape » dans les défauts
 * (§ dépassement au focus d'un champ de saisie). C'est exactement ce qui arrive
 * si on ne fait rien : sur iPhone, l'ouverture du clavier ne redimensionne pas
 * la page — elle la fait GLISSER sous le clavier. Le champ part hors de vue,
 * ou saute.
 *
 * La seule mesure fiable est `window.visualViewport` :
 *   · `height`    = la hauteur qui reste visible, clavier déduit ;
 *   · `offsetTop` = de combien la page a glissé vers le haut.
 * On colle donc le téléphone à cette zone-là, et on le recalcule à chaque
 * mouvement du clavier. Aucun saut, le champ reste posé sur le clavier.
 *
 * ⚠️ REPLI SANS `visualViewport` : on retombe sur `innerHeight`. C'est moins
 * juste, mais ça ne casse pas — et surtout ça ne bloque personne dehors.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE COMPOSANT N'INVENTE AUCUNE RÉPONSE
 *
 * Le contenu des bulles arrive par `messages`. Il viendra de la Pieuvre.
 * Tant qu'elle ne répond pas, l'état honnête est « Ajnaya réfléchit », jamais
 * une phrase fabriquée ici pour boucher le trou.
 */

export type Bulle = { de: 'elle' | 'lui'; texte: string }

const INVITE = 'écris ici pour répondre...'

export default function TelephoneAjnaya({
  messages,
  enAttente = false,
  onEnvoyer,
}: {
  messages: Bulle[]
  enAttente?: boolean
  onEnvoyer?: (texte: string) => void
}) {
  const [immersif, setImmersif] = useState(false)
  const [texte, setTexte] = useState('')
  const [invite, setInvite] = useState('')

  const scene = useRef<HTMLDivElement | null>(null)
  const ecran = useRef<HTMLDivElement | null>(null)
  const app = useRef<HTMLDivElement | null>(null)
  const champ = useRef<HTMLTextAreaElement | null>(null)
  const declencheur = useRef<HTMLElement | null>(null)
  const fil = useRef<HTMLDivElement | null>(null)

  const mouvementReduit = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /* ══ L'ÉCHELLE, ÉTAT POSÉ ═════════════════════════════════════════════════
     L'écran est dessiné à 393 px puis réduit. Aucune valeur n'est recalculée
     à la main : un 19 px reste un 19 px, donc rien ne dérive.
     ⚠️ On n'écrit JAMAIS scale(0) : tant que le châssis n'a pas de largeur,
     on ne touche à rien. Sinon le téléphone est là et son contenu invisible. */
  const poserEchelle = useCallback(() => {
    if (immersif) return
    const e = ecran.current, p = app.current
    if (!e || !p) return
    const l = e.clientWidth
    if (l <= 0) return
    const k = l / 393
    p.style.transform = `scale(${k})`
    p.style.height = `${e.clientHeight / k}px`
  }, [immersif])

  useEffect(() => {
    const e = ecran.current
    if (!e) return
    poserEchelle()
    const ro = new ResizeObserver(poserEchelle)
    ro.observe(e)
    return () => ro.disconnect()
  }, [poserEchelle])

  /* ══ LE CLAVIER, ÉTAT IMMERSIF ════════════════════════════════════════════ */
  useEffect(() => {
    if (!immersif) return
    const p = app.current
    if (!p) return

    const vv = window.visualViewport

    const coller = () => {
      const h = vv ? vv.height : window.innerHeight
      const decalage = vv ? vv.offsetTop : 0
      p.style.transform = `translateY(${decalage}px)`
      p.style.height = `${h}px`
      p.style.width = '100%'
    }

    coller()
    vv?.addEventListener('resize', coller)
    vv?.addEventListener('scroll', coller)
    window.addEventListener('resize', coller)

    /* Le fond de la page ne défile plus derrière : sinon le doigt fait bouger
       le site pendant qu'il écrit dans l'app, et l'illusion tombe. */
    const avant = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const surEchap = (ev: KeyboardEvent) => { if (ev.key === 'Escape') sortir() }
    window.addEventListener('keydown', surEchap)

    /* Le focus vient APRÈS le passage en plein écran. Dans l'autre ordre,
       le clavier monte pendant que la mise en page bouge encore — et c'est
       précisément le sursaut que la charte interdit. */
    const t = window.setTimeout(() => champ.current?.focus(), 60)

    return () => {
      vv?.removeEventListener('resize', coller)
      vv?.removeEventListener('scroll', coller)
      window.removeEventListener('resize', coller)
      window.removeEventListener('keydown', surEchap)
      document.body.style.overflow = avant
      window.clearTimeout(t)
      p.style.transform = ''
      p.style.height = ''
      p.style.width = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immersif])

  /* ══ L'INVITE QUI S'ÉCRIT TOUTE SEULE ═════════════════════════════════════
     Elle ne tourne que si le champ est vide. Dès qu'il tape un caractère,
     elle s'arrête : une invite qui continue de s'animer sous son texte est
     un scintillement, pas une aide. */
  useEffect(() => {
    if (texte) { setInvite(''); return }
    if (mouvementReduit()) { setInvite(INVITE); return }

    let i = 0
    let sens: 1 | -1 = 1
    let vivant = true
    let minuteur = 0

    const tour = () => {
      if (!vivant) return
      i += sens
      setInvite(INVITE.slice(0, i))
      let pause = sens === 1 ? 55 : 28
      if (i >= INVITE.length) { sens = -1; pause = 2400 }
      else if (i <= 0) { sens = 1; pause = 700 }
      minuteur = window.setTimeout(tour, pause)
    }
    minuteur = window.setTimeout(tour, 500)
    return () => { vivant = false; window.clearTimeout(minuteur) }
  }, [texte])

  /* Le fil descend tout seul quand une bulle arrive. */
  useEffect(() => {
    const f = fil.current
    if (f) f.scrollTop = f.scrollHeight
  }, [messages, enAttente])

  const entrer = (ev: React.MouseEvent | React.FocusEvent) => {
    declencheur.current = ev.currentTarget as HTMLElement
    setImmersif(true)
  }

  function sortir() {
    setImmersif(false)
    /* Le focus revient d'où il venait. Sans ça, un lecteur d'écran repart du
       haut de la page et la personne perd sa place. */
    window.setTimeout(() => declencheur.current?.focus(), 40)
  }

  const envoyer = () => {
    const t = texte.trim()
    if (!t) return
    onEnvoyer?.(t)
    setTexte('')
    sortir()          // état 3 : le téléphone redescend et redevient un objet du site
  }

  return (
    <div ref={scene} className={`${a.racine} ${s.scene} ${immersif ? s.immersif : ''}`}>
      {/* Le voile qui coupe le site quand on entre dans l'app.
          `scrimFort` de la charte : plein écran, il coupe le monde. */}
      {immersif && <div className={s.voile} onClick={sortir} aria-hidden="true" />}

      <div className={`${a.tel} ${s.tel}`}>
        {!immersif && <img src="/demo/ajnaya-cadre.png" alt="" aria-hidden="true" onLoad={poserEchelle} />}

        {/* ⚠️ AU REPOS, TOUT L'ÉCRAN EST LA COMMANDE — ET C'EST UNE CORRECTION.
            Le téléphone est réduit (facteur ~0,62), donc le champ de saisie
            ne mesure plus que 30 px de haut à l'écran réel. La charte impose
            48 px, en prenant le plus exigeant des deux minimums parce que le
            téléphone de référence est un Galaxy A05.
            Une cible de 30 px n'est pas une cible : c'est un piège à pouce.
            On ne grossit pas le champ (ça casserait l'échelle de l'app) —
            on fait de l'écran entier la zone touchable. */}
        {!immersif && (
          <button
            type="button"
            className={s.ouvrir}
            onClick={entrer}
            aria-label="Écrire à Ajnaya"
          />
        )}

        <div ref={ecran} className={`${a.ecran} ${s.ecran}`}>
          <div ref={app} className={`${a.app} ${s.app}`}>
            <div className={a['aj-fond']} aria-hidden="true" />

            <header className={a['aj-head']}>
              <div>
                <div className={a['aj-nom']}>Ajnaya</div>
                <div className={a['aj-etat']}>{enAttente ? 'réfléchit…' : 'en ligne'}</div>
              </div>
              {immersif && (
                <button type="button" className={s.fermer} onClick={sortir} aria-label="Revenir au site">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              )}
            </header>

            <div ref={fil} className={a['aj-fil']} role="log" aria-live="polite">
              {messages.map((m, i) => (
                <div key={i} className={`${a['aj-ligne']} ${m.de === 'lui' ? a['aj-droite'] : ''}`}>
                  <div className={a['aj-bulle']}>{m.texte}</div>
                </div>
              ))}
              {enAttente && (
                <div className={a['aj-ligne']}>
                  <div className={`${a['aj-bulle']} ${s.pense}`}>
                    <span /><span /><span />
                  </div>
                </div>
              )}
            </div>

            <div className={a['aj-dock']}>
              <div className={s.rangee}>
                <div className={s.champBoite}>
                  <textarea
                    ref={champ}
                    className={`${a['aj-champ']} ${s.champ}`}
                    value={texte}
                    rows={1}
                    onChange={(e) => setTexte(e.target.value)}
                    /* En état posé, le champ n'est pas la commande : le bouton
                       qui couvre l'écran l'est. Deux commandes pour la même
                       action au même endroit, c'est un doublon au clavier. */
                    readOnly={!immersif}
                    tabIndex={immersif ? 0 : -1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer() }
                    }}
                    aria-label="Écris ta question à Ajnaya"
                    enterKeyHint="send"
                    autoComplete="off"
                    autoCorrect="off"
                  />
                  {/* L'invite est un CALQUE, pas l'attribut `placeholder`.
                      Un `placeholder` ne peut pas s'animer, et il disparaît d'un coup. */}
                  {!texte && (
                    <span className={s.invite} aria-hidden="true">
                      {invite}
                      <i className={s.curseur} />
                    </span>
                  )}
                </div>

                <button type="button" className={`${a['aj-mic']} ${s.rond}`} aria-label="Parler à Ajnaya">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3z" />
                    <path d="M18 11a1 1 0 10-2 0 4 4 0 01-8 0 1 1 0 10-2 0 6 6 0 005 5.9V19H9a1 1 0 100 2h6a1 1 0 100-2h-2v-2.1A6 6 0 0018 11z" />
                  </svg>
                </button>

                <button
                  type="button"
                  className={`${a['aj-send']} ${s.rond}`}
                  onClick={envoyer}
                  disabled={!texte.trim()}
                  aria-label="Envoyer"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h13M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
