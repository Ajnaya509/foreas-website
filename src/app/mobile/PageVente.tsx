'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ESSAI_JOURS,
  PRIX_ANNUEL_CENTIMES,
  PRIX_MENSUEL_CENTIMES,
  formaterEuros,
} from '@/lib/offre'
import s from './pagevente.module.css'

/**
 * LA PAGE DE VENTE — tout ce qui vit SOUS le hero.
 *
 * Portée depuis `public/page-vente.html`, qui reste la maquette de référence :
 * on y corrige au pixel, puis on reporte ici. Les deux doivent rester d'accord.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI A ÉTÉ MESURÉ SUR UN VRAI IPHONE, ET QUI COMMANDE LE CODE
 *
 * · Les vidéos n'ont PAS d'attribut `controls`. Safari pose sinon un énorme
 *   bouton de lecture gris au CENTRE de l'affiche — pile sur le montant et le
 *   verdict, c'est-à-dire sur la seule chose que l'image doit prouver.
 * · La pastille de lecture suit l'événement `playing`, jamais le clic. Au
 *   premier appui sur une vidéo pas encore chargée, la lecture peut ne jamais
 *   démarrer ; cacher la pastille au clic annoncerait une lecture qui n'a pas
 *   lieu.
 * · L'animation du calcul s'observe sur la CARTE, pas sur la section, et avec
 *   un seuil bas : la section fait plus d'un écran de haut, donc un seuil de
 *   35 % ne peut jamais être atteint sur un téléphone.
 * · Une preuve dont le fichier manque supprime son bloc — jamais un cadre vide
 *   (charte §14). Mais elle ne supprime la SECTION que si celle-ci ne porte
 *   aucun bouton : une règle de sécurité qui ferme une porte de vente est pire
 *   que le défaut qu'elle corrige.
 *
 * ⚠️ AUCUN MONTANT N'EST ÉCRIT DANS CE FICHIER. Tout vient de `src/lib/offre.ts`.
 */

const MENSUEL = formaterEuros(PRIX_MENSUEL_CENTIMES)
const ANNUEL = formaterEuros(PRIX_ANNUEL_CENTIMES)
/** Douze mois au mois, moins l'année : la soustraction que le chauffeur peut refaire. */
const ECONOMIE = formaterEuros(PRIX_MENSUEL_CENTIMES * 12 - PRIX_ANNUEL_CENTIMES)

export default function PageVente() {
  const racine = useRef<HTMLDivElement | null>(null)
  const [mois, poserMois] = useState(true)

  /* ── LE CARROUSEL : une seule vidéo joue à la fois ─────────────────────── */
  useEffect(() => {
    const r = racine.current
    if (!r) return
    const clips = Array.from(r.querySelectorAll<HTMLButtonElement>(`.${s.clip}`))
    const defaire: Array<() => void> = []

    clips.forEach((c) => {
      const v = c.querySelector('video')
      if (!v) return
      const auClic = () => {
        if (!v.paused) { v.pause(); return }
        clips.forEach((a) => {
          const b = a.querySelector('video')
          if (b && b !== v) { b.pause(); a.classList.remove(s.joue) }
        })
        const j = v.play()
        if (j && j.catch) j.catch(() => c.classList.remove(s.joue))
      }
      const enLecture = () => c.classList.add(s.joue)
      const enPause = () => c.classList.remove(s.joue)
      c.addEventListener('click', auClic)
      v.addEventListener('playing', enLecture)
      v.addEventListener('pause', enPause)
      defaire.push(() => {
        c.removeEventListener('click', auClic)
        v.removeEventListener('playing', enLecture)
        v.removeEventListener('pause', enPause)
        v.pause()
      })
    })
    return () => defaire.forEach((f) => f())
  }, [])

  /* ── LA BASCULE ANDROID / IPHONE ───────────────────────────────────────── */
  useEffect(() => {
    const r = racine.current
    if (!r) return
    const a = r.querySelector<HTMLButtonElement>('#o-android')
    const i = r.querySelector<HTMLButtonElement>('#o-iphone')
    const pa = r.querySelector<HTMLElement>('#p-android')
    const pi = r.querySelector<HTMLElement>('#p-iphone')
    if (!a || !i || !pa || !pi) return

    const choisir = (android: boolean) => {
      a.setAttribute('aria-selected', String(android))
      i.setAttribute('aria-selected', String(!android))
      pa.hidden = !android
      pi.hidden = android
    }
    const versAndroid = () => choisir(true)
    const versIphone = () => choisir(false)
    /* Un onglet se pilote aussi au clavier — c'est le contrat du rôle `tab`. */
    const auClavier = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
      e.preventDefault()
      const autre = e.currentTarget === a ? i : a
      autre.focus()
      choisir(autre === a)
    }
    a.addEventListener('click', versAndroid)
    i.addEventListener('click', versIphone)
    a.addEventListener('keydown', auClavier)
    i.addEventListener('keydown', auClavier)
    return () => {
      a.removeEventListener('click', versAndroid)
      i.removeEventListener('click', versIphone)
      a.removeEventListener('keydown', auClavier)
      i.removeEventListener('keydown', auClavier)
    }
  }, [])

  /* ── LA SEULE ANIMATION DE TOUTE LA PAGE ───────────────────────────────── */
  useEffect(() => {
    const r = racine.current
    if (!r) return
    const c = r.querySelector<HTMLElement>('#calcul')
    if (!c) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { c.classList.add(s.joue); return }
    if (!('IntersectionObserver' in window)) { c.classList.add(s.joue); return }
    /* ⚠️ ON OBSERVE LA CARTE, PAS LA SECTION, ET AVEC UN SEUIL BAS.
       Mesuré : la section fait plus d'un écran de haut. Un seuil de 35 % lui
       demande d'être visible à 35 % D'ELLE-MÊME, ce qui n'arrive jamais sur
       un téléphone. L'animation ne se déclenchait pas, et rien ne le signalait :
       le calcul restait simplement invisible, à opacité zéro. */
    const cible = c.querySelector(`.${s['carte-sombre']}`) ?? c
    const o = new IntersectionObserver((e) => {
      if (e[0].isIntersecting) { c.classList.add(s.joue); o.disconnect() }
    }, { threshold: 0.2 })
    o.observe(cible)
    return () => o.disconnect()
  }, [])

  /* ── UNE PREUVE ABSENTE NE LAISSE JAMAIS UN CADRE VIDE ─────────────────── */
  useEffect(() => {
    const r = racine.current
    if (!r) return
    const retirer = (img: HTMLImageElement) => {
      const f = img.closest('figure')
      if (f && f.getAttribute('data-preuve') === 'figure') { f.remove(); return }
      const sec = img.closest('section')
      if (sec) sec.remove()
    }
    const defaire: Array<() => void> = []
    r.querySelectorAll('img').forEach((img) => {
      /* ⚠️ L'ÉCOUTEUR SEUL NE SUFFIT PAS : si l'image a déjà échoué avant que
         cet effet tourne, l'événement `error` est passé et ne reviendra pas. */
      if (img.complete && img.naturalWidth === 0) { retirer(img); return }
      const enErreur = () => retirer(img)
      img.addEventListener('error', enErreur)
      defaire.push(() => img.removeEventListener('error', enErreur))
    })
    return () => defaire.forEach((f) => f())
  }, [])

  return (
    <div className={s.vente} ref={racine}>
      {/* ▲▲▲ LE HERO ACTUEL EST AU-DESSUS. IL NE BOUGE PAS. ▲▲▲ */}

      {/* ═════════════ MODULE 1 — LE VERDICT ═════════════ */}

      <section className={`${s.scene} ${s.gifle} ${s.halo}`}>
        <p className={s.sur}>Le verdict</p>
        <h2>Uber ne te dira jamais<br />de refuser une course.<br />C’est exactement<br />le problème.</h2>
      </section>

      <section className={s.scene}>
        <p className={`${s.sur} ${s["sur-gris"]}`}>Ce qui se passe vraiment</p>
        <h2>Le prix s’affiche.<br />Le coût, non.</h2>
        <p>Une course arrive. Tu as quelques secondes. Le montant est écrit, les
           minutes aussi. Ce que personne ne calcule : ce qu’il te reste de l’heure.</p>

        <figure data-preuve="figure" style={{ margin: '22px 0 0' }}>
          <img src="/demo/uber-proposition.jpg" width="607" height="732"
               alt="Une proposition de course reçue sur Uber : 10,89 €, sept minutes d’approche, 5,6 kilomètres de course"
               style={{ width: '100%', borderRadius: '18px', display: 'block', border: '1px solid var(--filet)' }} />
          <div className={s.manque}>
            <p><span>Ce que l’écran dit</span><b>10,89 €</b></p>
            <p className={s.pile}><span>Ce qu’il ne dit pas</span><b className={s.creux}>ce qu’il te reste de l’heure</b></p>
          </div>
          <p className={s.tampon}>Capture d’une vraie proposition. Les adresses du client sont masquées.</p>
        </figure>
      </section>

      <section className={s.scene} id="calcul">
        <p className={s.sur}>Le calcul</p>
        <h2>Trois lignes. Un mot.</h2>

        <div className={s["carte-sombre"]} style={{ marginTop: '22px' }}>
          <div className={s.meta}><span>FOREAS Driver</span><span>Estimation</span></div>
          <div className={s.calcul}>
            <div className={s.l}><span>Elle paie</span><b>34,07 €</b></div>
            <div className={s.l}><span>Elle te prend</span><b>82 min</b></div>
            <div className={s.l}><span>Approche + route · 0,25 €/km</span><b>− 7,77 €</b></div>
            <div className={`${s.l} ${s.t}`}><span>Ça fait</span><b>19 €/h</b></div>
            <div className={s.l}><span>Ton seuil</span><b>24 €/h</b></div>
          </div>
          <div className={s.verdict}><span className={`${s.pastille} ${s.non}`}></span><span className={s.mot}>À laisser</span></div>
          <p className={s.raison}>75 min estimées jusqu’à CDG. Le montant ne paie pas le temps pris.</p>
          <p className={s.tampon}>Démonstration · local · 82 min · net 26,30 € · seuil 24 €/h</p>
        </div>

        <p className={s.porte}>On ne devine pas ta commission.<br />On compte ton temps et tes kilomètres.</p>
      </section>

      <section className={`${s.scene} ${s.halo} ${s["halo-g"]}`}>
        <p className={s.sur}>La preuve</p>
        <h2>Voici l’écran, tel quel.</h2>
        <p>Dix propositions réelles. Cinq que FOREAS te dit de prendre, cinq qu’il te
           dit de laisser. Le calcul est écrit dans l’image.</p>

        <div className={s.rail} role="group" aria-label="Dix verdicts en démonstration">
          <button className={s.clip} type="button" aria-label="Lire la démonstration — Course à 12,40 € — à prendre"><video src="/demo/verdict/01-1240-prendre.mp4" poster="/demo/verdict/01-1240-prendre.jpg" muted playsInline preload="metadata" loop aria-hidden></video><span className={s.lire} aria-hidden></span></button>
          <button className={s.clip} type="button" aria-label="Lire la démonstration — Course à 34,07 € — à laisser"><video src="/demo/verdict/07-3407-laisser.mp4" poster="/demo/verdict/07-3407-laisser.jpg" muted playsInline preload="metadata" loop aria-hidden></video><span className={s.lire} aria-hidden></span></button>
          <button className={s.clip} type="button" aria-label="Lire la démonstration — Course à 21,90 € — à prendre"><video src="/demo/verdict/04-2190-prendre.mp4" poster="/demo/verdict/04-2190-prendre.jpg" muted playsInline preload="metadata" loop aria-hidden></video><span className={s.lire} aria-hidden></span></button>
          <button className={s.clip} type="button" aria-label="Lire la démonstration — Course à 15,80 € — à laisser"><video src="/demo/verdict/02-1580-laisser.mp4" poster="/demo/verdict/02-1580-laisser.jpg" muted playsInline preload="metadata" loop aria-hidden></video><span className={s.lire} aria-hidden></span></button>
          <button className={s.clip} type="button" aria-label="Lire la démonstration — Course à 24,60 € — à prendre"><video src="/demo/verdict/05-2460-prendre.mp4" poster="/demo/verdict/05-2460-prendre.jpg" muted playsInline preload="metadata" loop aria-hidden></video><span className={s.lire} aria-hidden></span></button>
          <button className={s.clip} type="button" aria-label="Lire la démonstration — Course à 18,70 € — à laisser"><video src="/demo/verdict/03-1870-laisser.mp4" poster="/demo/verdict/03-1870-laisser.jpg" muted playsInline preload="metadata" loop aria-hidden></video><span className={s.lire} aria-hidden></span></button>
          <button className={s.clip} type="button" aria-label="Lire la démonstration — Course à 31,50 € — à prendre"><video src="/demo/verdict/08-3150-prendre.mp4" poster="/demo/verdict/08-3150-prendre.jpg" muted playsInline preload="metadata" loop aria-hidden></video><span className={s.lire} aria-hidden></span></button>
          <button className={s.clip} type="button" aria-label="Lire la démonstration — Course à 27,80 € — à laisser"><video src="/demo/verdict/06-2780-laisser.mp4" poster="/demo/verdict/06-2780-laisser.jpg" muted playsInline preload="metadata" loop aria-hidden></video><span className={s.lire} aria-hidden></span></button>
          <button className={s.clip} type="button" aria-label="Lire la démonstration — Course à 39,80 € — à prendre"><video src="/demo/verdict/10-3980-prendre.mp4" poster="/demo/verdict/10-3980-prendre.jpg" muted playsInline preload="metadata" loop aria-hidden></video><span className={s.lire} aria-hidden></span></button>
          <button className={s.clip} type="button" aria-label="Lire la démonstration — Course à 46,20 € — à laisser"><video src="/demo/verdict/09-4620-laisser.mp4" poster="/demo/verdict/09-4620-laisser.jpg" muted playsInline preload="metadata" loop aria-hidden></video><span className={s.lire} aria-hidden></span></button>
        </div>
        <p className={s["aide-rail"]}>Fais glisser · touche pour lancer</p>
        <p className={s.tampon}>Démonstration. Chaque image porte son calcul et son seuil.</p>
      </section>

      <section className={s.scene}>
        <p className={s.sur}>Sur ton téléphone</p>
        <h2>Android lit tout seul.<br />iPhone, non.</h2>

        <div className={s.bascule} role="tablist" aria-label="Choisis ton téléphone">
          <button role="tab" id="o-android" aria-controls="p-android" aria-selected="true">Android</button>
          <button role="tab" id="o-iphone"  aria-controls="p-iphone"  aria-selected="false">iPhone</button>
        </div>

        <div role="tabpanel" id="p-android" aria-labelledby="o-android">
          <ol className={s.pas}>
            <li>Tu autorises la lecture de l’écran, une seule fois.</li>
            <li>La course arrive sur ta plateforme.</li>
            <li>Le verdict s’affiche par-dessus.</li>
          </ol>
        </div>
        <div role="tabpanel" id="p-iphone" aria-labelledby="o-iphone" hidden>
          <ol className={s.pas}>
            <li>La course arrive sur ta plateforme.</li>
            <li>Tu tapes deux fois au dos du téléphone.</li>
            <li>Le verdict s’affiche.</li>
          </ol>
        </div>

        <div className={s.franc}>Sur iPhone, c’est toi qui déclenches. Apple ne laisse pas le
          choix, et on préfère te le dire ici.</div>
        <div className={s.franc}>Si le tarif ou la distance manque, aucun verdict ne s’affiche.</div>
      </section>

      <section className={s.scene}>
        <p className={s.sur}>Une journée</p>
        <h2>Douze courses.<br />Trois refusées.</h2>

        <div className={s["carte-sombre"]} style={{ marginTop: '22px' }}>
          <div className={s.meta}><span>Exemple de journée</span><span>Démonstration</span></div>
          <p style={{ marginTop: '16px', fontSize: '1.375rem', letterSpacing: '6px', lineHeight: '1.2', display: 'flex', flexWrap: 'wrap' }} aria-label="Neuf courses prises, trois laissées">
            <span style={{ color: '#10B981' }}>●●●</span><span style={{ color: '#FF4D4D' }}>○</span><span style={{ color: '#10B981' }}>●●●●</span><span style={{ color: '#FF4D4D' }}>○</span><span style={{ color: '#10B981' }}>●●</span><span style={{ color: '#FF4D4D' }}>○</span>
          </p>
          <div className={s.calcul} style={{ marginTop: '14px' }}>
            <div className={s.l} style={{ opacity: '1', transform: 'none' }}><span>Temps rendu</span><b>1 h 10</b></div>
            <div className={s.l} style={{ opacity: '1', transform: 'none' }}><span>Kilomètres non offerts</span><b>34</b></div>
          </div>
          <p className={s.tampon}>Exemple construit. Ce ne sont pas les chiffres d’un chauffeur.</p>
        </div>

        <a className={s.cta} href="/wa?s=pain&a=11&p=/&i=verdict&o=fin_module_verdict">Demande-lui pour ta course</a>
        <div><a className={s.sortie} href="#vitrine">Ou continue à lire</a></div>
      </section>

      {/* ═════════════ MODULE 2 — TA VITRINE ═════════════ */}

      <section className={`${s.scene} ${s.gifle} ${s.halo} ${s["halo-g"]}`} id="vitrine">
        <p className={s.sur}>Ta vitrine</p>
        <h2>Ton meilleur client<br />ne peut pas te rappeler.</h2>
        <p>Il rouvre l’appli. Il tombe sur quelqu’un d’autre.</p>
      </section>

      <section className={s.scene}>
        <p className={`${s.sur} ${s["sur-gris"]}`}>Ce qui change</p>
        <h2>Ta voiture devient<br />ton commerce.</h2>
        <p className={s.grand}>Il descend rue de Rivoli. Il scanne l’autocollant collé au dos
           de ton siège. Jeudi, il te reprend directement.</p>
      </section>

      <section className={s.scene} id="autocollant">
        <p className={s.sur}>L’autocollant</p>
        <h2>Il scanne.<br />Il te retrouve.</h2>
        <figure data-preuve="section" style={{ margin: '22px 0 0' }}>
          <img src="/demo/autocollant.jpg" width="880" height="722" alt="Un autocollant FOREAS avec un QR code, collé au dos d’un appuie-tête dans une voiture"
               style={{ width: '100%', borderRadius: '18px', display: 'block', border: '1px solid var(--filet)' }} />
        </figure>
        <p>Commandé depuis l’app, livré chez toi.</p>
        <p className={s.tampon}>Objet réel. Photo prise dans une voiture en service.</p>
      </section>

      <section className={`${s.scene} ${s.halo}`}>
        <p className={s.sur}>Ouvre-la maintenant</p>
        <h2>La page existe déjà.<br />Regarde.</h2>
        <p style={{ fontFamily: 'var(--titre)', fontSize: '1.5rem', fontWeight: '700', color: 'var(--cyan)', letterSpacing: '-.3px', marginTop: '20px', wordBreak: 'break-all' }}>
           foreas.xyz/c/chauffeur-wi20</p>
        <a className={s.lien} href="https://foreas.xyz/c/chauffeur-wi20" target="_blank" rel="noopener">Ouvrir la page dans un autre onglet</a>
        <p className={s.tampon}>Page en ligne. Adresse vérifiée le 4 septembre 2026.</p>
      </section>

      <section className={s.scene}>
        <p className={`${s.sur} ${s["sur-gris"]}`}>Ce qu’elle ne fait pas</p>
        <h2>Elle ne te trouve<br />pas de clients.</h2>
        <p>Elle garde ceux que tu as déjà. La réservation arrive chez toi, pas chez une
           plateforme. Personne ne te promet du volume.</p>
        <div className={s.franc}>Le paiement par carte marche une fois ton compte de paiement
          ouvert. Tant qu’il ne l’est pas, ton client réserve et te règle comme
          d’habitude.</div>
      </section>

      <section className={s.scene}>
        <p className={s.sur}>Un cas simple</p>
        <h2>Un client.<br />Une fois par semaine.</h2>
        <div className={s["carte-sombre"]} style={{ marginTop: '22px' }}>
          <div className={s.meta}><span>Exemple</span><span>Démonstration</span></div>
          <div className={s.faits} style={{ marginTop: '12px' }}>
            <div className={s.f}><span className={s.n}>01</span><div><p>Il te reprend le lundi.</p></div></div>
            <div className={s.f}><span className={s.n}>02</span><div><p>Quatre courses par mois.</p></div></div>
            <div className={s.f}><span className={s.n}>03</span><div><p>Aucune ne passe par une plateforme.</p></div></div>
          </div>
          <p className={s.tampon}>Exemple. Aucun montant n’est avancé.</p>
        </div>

        <a className={s.cta} href="/wa?s=mobile_fonction&f=site&p=/&i=clientele&o=fin_module_vitrine">Demande-lui ta page</a>
        <div><a className={s.sortie} href="#carnet">Ou continue à lire</a></div>
      </section>

      {/* ═══ S13 · LE CARROUSEL DE TÉMOIGNAGES ═══
           Il n’est PAS ici, et c’est volontaire. La liste des accords de droit à
           l’image est vide : sur-titre, titre, compteur, lien ET conteneur restent
           absents. Zéro preuve → zéro espace vide réservé (§14 de la charte).
           Le jour où les six accords sont signés, la section s’insère ICI, entre la
           vitrine et le carnet, sans qu’aucune autre ligne ne bouge. */}

      {/* ═════════════ MODULE 3 — LE CARNET ═════════════ */}

      <section className={`${s.scene} ${s.gifle} ${s.halo}`} id="carnet">
        <p className={s.sur}>Le carnet</p>
        <h2>Ton comptable<br />reçoit le mois.<br />Toi, t’as juste roulé.</h2>
      </section>

      <section className={s.scene}>
        <p className={`${s.sur} ${s["sur-gris"]}`}>Le dimanche soir</p>
        <h2>La boîte à chaussures.</h2>
        <p className={s.grand}>Trois mois de tickets dans un sac sous le siège. Un dimanche
           entier à trier. Et la question qui revient : combien je vais devoir.</p>
      </section>

      <section className={s.scene}>
        <p className={s.sur}>Trois gestes</p>
        <h2>Photo. Total. PDF.</h2>
        <div className={s.faits}>
          <div className={s.f}><span className={s.n}>01</span><div>
            <h4>Tu photographies le ticket à la pompe.</h4>
            <p>Le montant et la date se lisent.</p></div></div>
          <div className={s.f}><span className={s.n}>02</span><div>
            <h4>Tu vois ce que tu as encaissé, tes charges, ce qui reste.</h4>
            <p>Ça bouge au fil des courses, pas en fin de mois.</p></div></div>
          <div className={s.f}><span className={s.n}>03</span><div>
            <h4>Tu exportes le mois. Tu l’envoies.</h4>
            <p>Un fichier, un envoi, c’est fini.</p></div></div>
        </div>
        <p className={s.tampon}>Les chiffres viennent de ce que tu enregistres. Rien n’est deviné.</p>
      </section>

      <section className={`${s.scene} ${s.halo} ${s["halo-g"]}`}>
        <p className={s.sur}>L’URSSAF</p>
        <h2>Vois ce que tu devras.<br />Avant.</h2>
        <div className={s["carte-sombre"]} style={{ marginTop: '22px' }}>
          <div className={s.meta}><span>Simulation</span><span>Démonstration</span></div>
          <div className={s.calcul} style={{ marginTop: '14px' }}>
            <div className={s.l} style={{ opacity: '1', transform: 'none' }}><span>Encaissé ce mois-ci</span><b>3 845 €</b></div>
            <div className={`${s.l} ${s.t}`} style={{ opacity: '1', transform: 'none' }}><span>Tu devras environ</span><b>823 €</b></div>
          </div>
          <div className={s.franc} style={{ marginTop: '16px' }}>C’est une simulation. FOREAS n’écrit
            rien à ta place, et <b style={{ color: 'inherit' }}>ton argent ne bouge pas de ton compte</b>.</div>
          <p className={s.tampon}>Simulation. Taux publics.</p>
        </div>
      </section>

      <section className={s.scene}>
        <p className={s.sur}>Un mois</p>
        <h2>Un fichier.<br />Tu l’envoies.</h2>
        {/* ⚠️ ICI L’ABSENCE NE TUE QUE LA FIGURE, PAS LA SECTION.
             Mesuré : quand la section entière disparaissait, elle emportait son
             bouton — la page tombait de cinq portes à quatre, sans que rien ne le
             signale. Une règle de sécurité qui supprime une porte de vente est pire
             que le défaut qu’elle corrige. */}
        <figure className={s.doc} data-preuve="figure">
          <span className={s.cadre}>
            <img src="/demo/export-mensuel.jpg" width="1240" height="1754"
                 alt="Aperçu d’un récapitulatif mensuel généré par FOREAS, rempli de données de démonstration" />
          </span>
          <a className={s.lien} href="/demo/export-mensuel.jpg" target="_blank" rel="noopener">Ouvrir le document en entier</a>
          <figcaption className={s.tampon}>Aperçu d’un export réel, rempli de données de démonstration.</figcaption>
        </figure>

        <a className={s.cta} href="/wa?s=mobile_fonction&f=compta&p=/&i=compta&o=fin_module_carnet">Demande-lui ton export</a>
        <div><a className={s.sortie} href="#court">Ou continue à lire</a></div>
      </section>

      {/* ═════════════ LE MODULE COURT — neuf sections ═════════════ */}
      <div id="court"></div>

      <section className={s.court}>
        <p className={s.sur}>La barre</p>
        <h2>La journée s’arrête quand la barre est pleine, pas quand t’es cassé.</h2>
        <p>Tu poses ton chiffre le matin. Elle monte course après course.</p>
        <p className={s.preuve}>Elle bouge avec tes vraies courses, jamais avec une saisie à la main.</p>
        <a className={s.lien} href="/wa?s=mobile_fonction&f=objectif&o=court_barre">Demande-lui ton objectif</a>
      </section>

      <section className={s.court}>
        <p className={s.sur}>La vague</p>
        <h2>Personne ne dessine cette carte. C’est vous qui la roulez.</h2>
        <p>Quatre niveaux de demande. Un doigt sur la zone, Waze démarre.</p>
        <p className={s.preuve}>Chaque course d’un chauffeur nourrit la carte de tous les
           autres. Dès le premier qui roule, ça s’alimente.</p>
        <p className={s.tampon}>Estimation. Aucune course promise.</p>
        <a className={s.lien} href="/wa?s=mobile_fonction&f=zones&o=court_vague">Demande-lui ta zone</a>
      </section>

      <section className={s.court}>
        <p className={s.sur}>Le fil</p>
        <h2>Ce que tu croises, le chauffeur d’après le saura.</h2>
        <p>Un contrôle, un accident, un bouchon. Avec le lieu et la distance.</p>
        <p className={s.preuve}>Tu passes tout près, ou droit devant sur ta route : on te
           demande si ça tient encore.</p>
        <a className={s.lien} href="/wa?s=mobile_fonction&f=fil&o=court_fil">Demande-lui le fil</a>
      </section>

      <section className={s.court}>
        <p className={s.sur}>Ajnaya</p>
        <h2>Une collègue dans la boîte à gants.</h2>
        <p>Tu lui écris comme à un collègue. Elle répond.</p>
        <p className={s.preuve}>Elle connaît l’app par cœur — 24 fiches produit, en service
           depuis le 3 septembre 2026. Ta ville, c’est toi qui la connais.</p>
        <a className={s.lien} href="/wa?s=mobile_fonction&f=ajnaya&o=court_ajnaya">Écris-lui maintenant</a>
      </section>

      <section className={s.court}>
        <p className={s.sur}>Le guetteur</p>
        <h2>Tu n’apprends plus la nouvelle règle dans un groupe WhatsApp.</h2>
        <p>Uber, Bolt, Heetch changent leurs règles de tarif. Tu es prévenu.</p>
        <p className={s.preuve}>Trois plateformes, nommées. On ne promet aucun délai : on te
           le dit quand on le sait.</p>
        <a className={s.lien} href="/wa?s=mobile_fonction&f=regles&o=court_guetteur">Demande-lui ce qui a changé</a>
      </section>

      <section className={s.court}>
        <p className={s.sur}>Ton seuil</p>
        <h2>Tu tapes ton chiffre. C’est lui qui décide, plus le leur.</h2>
        <p>Deux minutes, assis dans la voiture, moteur coupé.</p>
        <p className={s.preuve}>Ton seuil en euros par heure entre directement dans le calcul
           du verdict. Change-le, les verdicts changent avec.</p>
        <a className={s.lien} href="/wa?s=mobile_fonction&f=reglage&o=court_seuil">Demande-lui comment le régler</a>
      </section>

      <section className={s.court}>
        <p className={s.sur}>Y aller</p>
        <h2>Tu ne tapes plus l’adresse. Tu appuies, Waze démarre.</h2>
        <p>Portière claquée, un tap, tu roules.</p>
        <p className={s.preuve}>Waze, Google Maps ou Plans — ceux que tu as déjà.</p>
        <a className={s.lien} href="/wa?s=mobile_fonction&f=navigation&o=court_yaller">Demande-lui</a>
      </section>

      <section className={s.court}>
        <p className={s.sur}>Ta série</p>
        <h2>Onze jours d’affilée. Aucun rappel à l’ordre.</h2>
        <p>Le compte des jours où tu as tenu ton objectif.</p>
        <p className={s.preuve}>Gardé sur ton téléphone, nulle part ailleurs. Si tu coupes,
           personne ne t’écrit.</p>
        <p className={s.tampon}>Onze est un exemple.</p>
        <a className={s.lien} href="/wa?s=mobile_fonction&f=serie&o=court_serie">Demande-lui</a>
      </section>

      <section className={s.court}>
        <p className={s.sur}>Le collègue</p>
        <h2>Six collègues, et ton abonnement ne te coûte plus rien.</h2>
        <p>Il paie au mois : <b>5 € par mois</b>. Il prend l’année : <b>50 €, une seule fois</b>.</p>
        <p className={s.preuve}>Ton filleul direct uniquement — rien sur les filleuls de tes
           filleuls. Six fois 5 €, ça fait 30 €. L’abonnement en coûte {MENSUEL}.</p>
        <p className={s.tampon}>Tant qu’ils paient.</p>
        <a className={s.lien} href="/wa?s=mobile_fonction&f=parrainage&o=court_collegue">Demande-lui ton lien</a>
      </section>

      {/* ═════════════ LA FIN ═════════════ */}

      <section className={`${s.scene} ${s.halo}`}>
        <p className={s.sur}>Sans promesse cachée</p>
        <h2>Ce que FOREAS<br />ne fait pas.</h2>

        <div className={s.moins}>
          <div className={s.m}><span className={s.rond}>−</span><div>
            <h4>Sur iPhone, ce n’est pas automatique.</h4>
            <p>Tu tapes deux fois au dos du téléphone. Apple ne laisse pas le choix.</p></div></div>
          <div className={s.m}><span className={s.rond}>−</span><div>
            <h4>On ne te trouve pas de clients.</h4>
            <p>On te donne la vitrine. Les clients, c’est ton métier.</p></div></div>
          <div className={s.m}><span className={s.rond}>−</span><div>
            <h4>Ton argent ne bouge pas de ton compte.</h4>
            <p>L’URSSAF est simulée, jamais mise de côté.</p></div></div>
          <div className={s.m}><span className={s.rond}>−</span><div>
            <h4>Le verdict reste une estimation.</h4>
            <p>Tu acceptes ou tu refuses toi-même chaque course.</p></div></div>
        </div>

        <div className={s["fait-cyan"]}><b>Ce qu’il fait, aujourd’hui, sur ton téléphone :</b>
          il compte ton heure avant que tu acceptes, il te fait ta page et ton
          autocollant, il range tes tickets et sort ton fichier.</div>
      </section>

      <section className={s.scene}>
        <p className={s.sur}>Si tu testes</p>
        <h2>Trois jours.<br />Zéro euro aujourd’hui.</h2>

        {/* ⚠️ AUCUN MONTANT N’EST ÉCRIT ICI. Ils viennent tous de `src/lib/offre.ts`.
            Un prix qui vit à deux endroits finit toujours par diverger : le site a
            déjà encaissé DEUX prix différents pour le même produit le 14/08. */}
        <div className={s.bascule} style={{ marginTop: '22px' }}>
          <button type="button" aria-pressed={mois} onClick={() => poserMois(true)}>Au mois</button>
          <button type="button" aria-pressed={!mois} onClick={() => poserMois(false)}>À l’année</button>
        </div>

        <div className={s["prix-carte"]} aria-live="polite">
          <div className={s["prix-nom"]}>{mois ? 'FOREAS · au mois' : 'FOREAS · à l’année'}</div>
          <div className={s["prix-val"]}>
            <span>{mois ? MENSUEL : ANNUEL}</span>
            <span className={s["prix-per"]}>{mois ? 'par mois' : 'par an'}</span>
          </div>
          {/* L’économie ne s’affiche qu’à l’année, et elle se recalcule à partir des
              deux prix affichés sur cette même page : douze fois le mensuel, moins
              l’annuel. Le chauffeur peut refaire la soustraction. */}
          {!mois && <p className={s["prix-eco"]}>{ECONOMIE} de moins que douze mois au mois.</p>}
          <div className={s.chrono}>
            <div className={s.pt}><h4>Aujourd’hui</h4><p>0 € prélevé. Ta carte est enregistrée.</p></div>
            <div className={s.pt}><h4>Au {ESSAI_JOURS}ᵉ jour</h4><p>{mois ? MENSUEL : ANNUEL} prélevés, sauf si tu coupes avant.</p></div>
          </div>
        </div>

        {/* ⚠️ LA FORMULE VOYAGE DANS L’ADRESSE. Sans elle, il lit 29,99 €, il appuie,
            et la caisse s’ouvre sur l’annuel : la page de tarifs a son propre état par
            défaut et n’a aucun moyen de deviner celui d’ici. Mesuré à l’écran. */}
        <a className={`${s.cta} ${s.violet}`} href={`/tarifs3?formule=${mois ? 'mensuel' : 'annuel'}`}>Commencer les {ESSAI_JOURS} jours</a>
        <div><a className={s.sortie} href="/wa?s=avant_paiement&p=/&i=offre&o=avant_paiement">Une question d’abord</a></div>
        <p className={s.tampon}>Carte enregistrée dès l’inscription. Résiliation en un clic.</p>
      </section>

      <section className={s.scene}>
        <p className={s.sur}>Questions simples</p>
        <h2>Tes questions<br />avant l’essai.</h2>
        <div style={{ marginTop: '20px' }}>
          <details><summary>Ça marche sur iPhone ?</summary>
            <p>Oui, mais pas tout seul. Tu tapes deux fois au dos du téléphone devant
               la proposition. Apple ne laisse pas le choix.</p></details>
          <details><summary>Vous voyez mes courses ?</summary>
            <p>FOREAS lit ce que tu lui montres, sur ton téléphone. Tes chiffres
               restent chez toi.</p></details>
          <details><summary>Je coupe comment ?</summary>
            <p>En un clic, depuis l’app, avant la fin des trois jours. Tu n’es pas
               débité.</p></details>
          <details><summary>Il faut parler à Ajnaya ?</summary>
            <p>Non. Tu peux lire le verdict et sa raison sans jamais lui écrire.</p></details>
          <details><summary>J’ai déjà payé, je veux l’app.</summary>
            <p>C’est la même adresse sur Android et sur iPhone.</p>
            <a className={s.lien} href="/go/ajnaya" style={{ color: 'var(--cyan)' }}>Installe FOREAS Driver</a></details>
        </div>
      </section>

      <section className={`${s.scene} ${s.halo} ${s["halo-g"]}`}>
        <div className={s.orbe} aria-hidden></div>
        <p className={s.sur}>FOREAS</p>
        <h2>Ta prochaine course.<br />Ton choix.</h2>
        <p>Vois « à prendre » ou « à laisser », lis la raison, puis décide.</p>
        <a className={s.cta} href="/wa?s=final&p=/&i=cloture&o=final">Parle à Ajnaya</a>
        <div><a className={s.sortie} href={`/tarifs3?formule=${mois ? 'mensuel' : 'annuel'}`}>Ou commence les {ESSAI_JOURS} jours</a></div>
      </section>

      <footer>
        <p className={s.mention}>FOREAS t’aide à estimer une course avant de l’accepter.
           Les verdicts restent des estimations. Tu décides.</p>
        <div className={s.liens}>
          <a href="/mentions-legales">Mentions légales</a>
          <a href="/cgu">Conditions</a>
          <a href="/confidentialite">Confidentialité</a>
          <a href="/suppression-compte">Supprimer mon compte</a>
          <a href="/contact">Contact</a>
          <a href="/wa?s=cap&p=/&o=pied">Tu pilotes une flotte</a>
        </div>
      </footer>
    </div>
  )
}
