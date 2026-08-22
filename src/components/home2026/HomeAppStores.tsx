'use client'

import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/app-stores'
import { useLienOffre } from '@/hooks/useLienOffre'
import { mesurer } from '@/lib/mesure'
import type { Intention } from '@/lib/mesure'

/**
 * FOREAS — L'APP, DEPUIS L'ACCUEIL.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 *
 * Mesuré le 21/08/2026 : la page d'accueil de foreas.xyz ne contenait ni
 * « App Store », ni « Google Play », ni « télécharger ». Le seul bloc qui
 * proposait l'app vivait sur `/509`, une page secondaire.
 *
 * Pendant ce temps les deux fiches répondaient 200 — l'app est publiée depuis
 * des semaines. **Un visiteur de l'accueil ne pouvait pas trouver l'app.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TROIS DÉCISIONS, ET CE QU'ELLES ÉVITENT
 *
 * 1. LE BASCULEMENT TÉLÉPHONE / ORDINATEUR SE FAIT EN CSS, PAS EN JAVASCRIPT.
 *    Détecter l'appareil au rendu produirait une différence entre ce que le
 *    serveur écrit et ce que le navigateur reconstruit — et sur ce site, une
 *    frontière d'attente mal placée a déjà laissé une page entière invisible
 *    (voir `src/app/cap/page.tsx`). Deux blocs, l'un caché par `sm:hidden`,
 *    l'autre par `hidden sm:flex` : rien à attendre, rien à deviner.
 *
 * 2. SUR TÉLÉPHONE, UN SEUL BOUTON PRINCIPAL, ET IL PASSE PAR `/go`.
 *    `/go` lit l'appareil côté serveur et envoie vers la bonne boutique
 *    (`src/app/go/route.ts`). Écrire les deux boutons sur un téléphone, c'est
 *    demander à quelqu'un qui conduit de choisir son propre système
 *    d'exploitation.
 *
 * 3. AUCUN BOUTON « OUVRIR L'APP ».
 *    Rien côté app ne réclame de domaine — aucun `associatedDomains`, aucun
 *    `autoVerify` dans les dépôts. Un bouton « ouvrir » n'ouvrirait donc rien,
 *    et échouerait en silence chez la plupart des gens.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUI EST MESURÉ, ET POURQUOI SÉPARÉMENT
 *
 * `StoreClick` était **déclaré depuis le début et appelé nulle part** : le type
 * existait dans `src/lib/mesure.ts`, aucun fichier ne l'émettait. C'est son
 * premier site d'appel.
 *
 * Les trois sorties sont comptées séparément — Apple, Google, l'offre — parce
 * qu'un total les mélangerait et rendrait impossible la seule question qui
 * compte ensuite : « les gens veulent-ils l'app, ou l'abonnement ? »
 */
/**
 * ⚠️ 22/08/2026 — `page` ET `intention` ÉTAIENT ÉCRITS EN DUR.
 *
 * Le composant supposait vivre sur l'accueil ivoire, avec l'intention
 * « general ». Depuis que l'accueil est le parcours Ajnaya, ces deux valeurs
 * mentaient : un clic boutique depuis la nouvelle home aurait été compté comme
 * venant d'un visiteur « général », effaçant l'information qui compte — il
 * venait de parler à Ajnaya.
 *
 * Les valeurs par défaut restent celles d'avant : monter ce composant ailleurs
 * ne change rien tant qu'on ne précise pas.
 */
export default function HomeAppStores({
  page = '/',
  intention = 'general',
}: { page?: string; intention?: Intention } = {}) {
  // L'attribution (origine, campagne, code parrain) est portée par ce lien.
  const lienOffre = useLienOffre(intention)

  const compter = (ou: 'apple' | 'google' | 'auto') =>
    mesurer('StoreClick', { page, intention, promesse: ou })

  return (
    <section className="relative py-14 sm:py-20 px-4">
      <div className="relative max-w-2xl mx-auto text-center">
        <p className="text-[#00D4FF]/85 t-eyebrow mb-3">FOREAS · L&apos;APP</p>

        <h2 className="t-display-l text-[#F8FAFC] mb-3 leading-[1.1]">
          Elle est déjà en ligne.
        </h2>

        <p className="font-body text-[#F8FAFC]/60 mb-8 max-w-md mx-auto">
          Sur iPhone et sur Android. Installe-la, ou regarde d&apos;abord ce
          qu&apos;elle coûte.
        </p>

        {/* ── Téléphone : un seul bouton, l'appareil décide ────────────────── */}
        <div className="sm:hidden flex flex-col gap-3">
          <a
            href="/go"
            onClick={() => compter('auto')}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#00D4FF] px-6 py-4 font-body text-base font-bold text-[#05070F] transition-transform active:scale-[0.98]"
          >
            Installer l&apos;app
          </a>
          <a
            href={lienOffre}
            onClick={() => mesurer('PrimaryCTAClick', { page, intention, promesse: 'offre_depuis_bloc_app' })}
            className="inline-flex items-center justify-center rounded-2xl border border-white/12 px-6 py-3.5 font-body text-sm font-semibold text-[#F8FAFC]/85 transition-colors active:bg-white/5"
          >
            Voir ce que ça coûte
          </a>
        </div>

        {/* ── Ordinateur : les deux fiches, nommées ────────────────────────── */}
        <div className="hidden sm:flex flex-col items-center gap-5">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => compter('apple')}
              className="group inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 transition-colors hover:border-white/20 hover:bg-white/[0.07]"
            >
              <svg className="h-7 w-7 text-[#F8FAFC]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <span className="text-left">
                <span className="block font-body text-[11px] text-[#F8FAFC]/45">Télécharger sur</span>
                <span className="block font-body text-sm font-semibold text-[#F8FAFC]">App Store</span>
              </span>
            </a>

            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => compter('google')}
              className="group inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 transition-colors hover:border-white/20 hover:bg-white/[0.07]"
            >
              <svg className="h-7 w-7 text-[#F8FAFC]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 0 1 0 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
              </svg>
              <span className="text-left">
                <span className="block font-body text-[11px] text-[#F8FAFC]/45">Disponible sur</span>
                <span className="block font-body text-sm font-semibold text-[#F8FAFC]">Google Play</span>
              </span>
            </a>
          </div>

          <a
            href={lienOffre}
            onClick={() => mesurer('PrimaryCTAClick', { page, intention, promesse: 'offre_depuis_bloc_app' })}
            className="font-body text-sm text-[#00D4FF]/85 underline-offset-4 transition-colors hover:text-[#00D4FF] hover:underline"
          >
            Voir ce que ça coûte
          </a>
        </div>
      </div>
    </section>
  )
}
