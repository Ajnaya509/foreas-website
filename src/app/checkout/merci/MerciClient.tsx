'use client'

/**
 * MerciClient — retour après paiement (/checkout → return_url).
 * Téléchargement INTELLIGENT : détecte l'OS et envoie au bon store via /go
 * (iOS → App Store, Android → Play Store, desktop → /go/desktop QR).
 * Langage visuel aligné checkout/tarifs2 : obsidian + halo + glass + InkGradientButton + Genos.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { InkGradientButton } from '@/components/ui'
import { Check, ShieldCheck, Smartphone } from 'lucide-react'

import { garantieAffichable } from '@/lib/verite-commerciale'
type OS = 'ios' | 'android' | 'other'

/**
 * ⚠️ MENSONGE CORRIGÉ LE 14/08/2026 — le drapeau `IOS_LIVE = false` a été SUPPRIMÉ.
 *
 * Il faisait afficher, à un chauffeur sur iPhone qui venait de payer :
 * « L'app iPhone arrive très bientôt 🍏 — elle est en validation App Store. On t'envoie
 * le lien par email dès qu'elle est dispo. » Trois affirmations, trois faux :
 *   · `curl -L -o /dev/null -w '%{http_code}' https://apps.apple.com/fr/app/id6782316405`
 *     → HTTP 200, <title> « App FOREAS Driver - App Store » : la fiche EST publiée ;
 *   · le dépôt le savait déjà — src/lib/app-stores.ts, APP_STORE_URL « vérifiée
 *     HTTP 200 le 14/08/2026 ». Seul ce drapeau local était resté à false ;
 *   · l'email promis n'existe pas sur ce parcours (voir plus bas).
 *
 * Un drapeau booléen recopié à la main est le même piège qu'un prix écrit en dur :
 * il n'est relié à rien. `/go` interroge le user-agent et envoie chaque téléphone
 * vers sa vraie fiche — il n'y a plus rien à tenir à jour ici.
 */
export default function MerciClient() {
  const [os, setOs] = useState<OS>('other')

  useEffect(() => {
    const ua = navigator.userAgent || ''
    if (/iPhone|iPad|iPod/i.test(ua)) setOs('ios')
    else if (/Android/i.test(ua)) setOs('android')
    else setOs('other')
  }, [])

  const label =
    os === 'ios' ? 'Télécharger sur l’App Store'
    : os === 'android' ? 'Télécharger sur Google Play'
    : 'Télécharger l’app FOREAS'

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-foreas-obsidian text-[#F8FAFC]">
      {/* halo + micro-grain (comme checkout/tarifs2) */}
      <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 animate-halo-pulse"
          style={{
            background:
              'radial-gradient(ellipse 55% 45% at 50% 8%, rgba(16,185,129,0.16) 0%, transparent 70%),' +
              'radial-gradient(ellipse 50% 42% at 20% 20%, rgba(140,82,255,0.16) 0%, transparent 72%),' +
              'radial-gradient(ellipse 50% 42% at 82% 22%, rgba(0,212,255,0.10) 0%, transparent 72%)',
          }}
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(255,255,255,0.012)' }} />
      </div>

      {/* wordmark Genos */}
      <header className="relative z-10 mx-auto max-w-2xl px-5 pt-7">
        <Link href="/" aria-label="FOREAS — Accueil" className="font-title text-2xl font-semibold tracking-wider text-[#F8FAFC]">
          FOREAS
        </Link>
      </header>

      <section className="relative z-10 mx-auto max-w-md px-5 py-10 sm:py-14 text-center">
        {/* check de succès */}
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-white"
          style={{ background: 'linear-gradient(135deg,#10B981,#0E9F6E)', boxShadow: '0 14px 44px -10px rgba(16,185,129,0.55)' }}
        >
          <Check size={30} strokeWidth={3} />
        </div>

        <h1 className="text-[30px] sm:text-[34px] font-extrabold leading-[1.05] text-[#F8FAFC]" style={{ letterSpacing: '-0.035em' }}>
          Bienvenue à bord. 🎉
        </h1>
        {/*
          « FOREAS Pro » retiré : ce nom désigne une offre morte. Mesure —
          `select plan_code, price_amount, is_active from pieuvre_pricing_plans`
          → pro_monthly / 97,00 / is_active = false, et la seule formule vendue est
          `FORMULES.mensuel.libelle` = « FOREAS » (src/lib/offre.ts, 29,99 €/mois).
        */}
        <p className="mt-3 text-[15.5px] leading-relaxed text-white/72">
          Ton abonnement <strong className="text-[#F8FAFC]">FOREAS</strong> est actif. Ajnaya t’attend dans l’app —
          installe-la et lance ta première journée.
        </p>

        {/* téléchargement intelligent — /go choisit la boutique selon le téléphone */}
        <div className="mt-7">
          <InkGradientButton as="link" href="/go" variant="violet" size="lg" className="w-full">
            <span className="inline-flex items-center justify-center gap-2">
              <Smartphone size={18} /> {label}
            </span>
          </InkGradientButton>
          <p className="mt-3 text-[12.5px] text-white/45">
            {os === 'other'
              ? 'Ouvre cette page sur ton téléphone, ou scanne le QR sur l’écran suivant.'
              : 'Le bon store s’ouvre tout seul selon ton téléphone.'}
          </p>
        </div>

        {/* rassurance : comment tu entres dans l'app + garantie */}
        <div className="mt-8 space-y-2.5 text-left">
          {/*
            ⚠️ MENSONGE CORRIGÉ LE 14/08/2026 — « Un email de confirmation arrive avec
            ton reçu et le lien de connexion. » Aucun email n'est envoyé sur ce parcours.

            Mesure, dans le code déployé : l'email de bienvenue n'est déclenché que par
            `if (event.type === 'checkout.session.completed')`
            (src/app/api/webhooks/stripe/route.ts:78), `sendWelcomeEmail` étant appelé
            ligne 143 à l'intérieur de cette branche, sous `if (session.customer_details?.email)`
            ligne 135. Or /checkout n'ouvre AUCUNE Checkout Session : il appelle
            /api/subscription/create, qui fait `stripe.subscriptions.create`
            (route.ts:144). L'évènement n'arrive donc jamais — et le client Stripe est
            en plus créé sans adresse (`stripe.customers.create(email ? { email } : {})`,
            route.ts:142), le corps de la requête n'en envoyant aucune.

            Ce qui est VRAI, et vérifiable par le chauffeur dans les 10 secondes : le
            mobile qu'il vient de saisir est son identifiant. Il est exigé par le
            formulaire (CheckoutClient.tsx:92) puis attaché au client et à l'abonnement
            Stripe en E.164 (/api/subscription/contact) — c'est l'ancre du compte.
            Icône passée de Mail à Smartphone pour ne pas laisser une enveloppe
            promettre un email à côté d'un texte qui parle de téléphone.
          */}
          <div className="flex items-start gap-2.5 rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Smartphone size={16} className="mt-0.5 text-[#00D4FF]" />
            <p className="text-[13px] leading-relaxed text-white/70">Ton accès est lié au <strong className="text-white/90">numéro de mobile</strong> que tu viens de saisir. C’est avec lui que tu te connectes dans l’app.</p>
          </div>
          <div className="flex items-start gap-2.5 rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <ShieldCheck size={16} className="mt-0.5 text-[#10B981]" />
            {/* ⚠️ 21/08/2026 — voir GARANTIE_30J : le droit existe au contrat, le
                mécanisme n'est pas prouvé. On ne l'annonce plus. */}
            <p className="text-[13px] leading-relaxed text-white/70">{garantieAffichable()
              ? <><strong className="text-white/90">Garantie 30 jours.</strong> Pas convaincu, tu te fais rembourser sans discuter. Tu risques zéro.</>
              : <><strong className="text-white/90">Résiliable à tout moment.</strong> Depuis ton espace, sans avoir à te justifier.</>}</p>
          </div>
        </div>

        <Link href="/" className="mt-7 inline-block text-[13px] text-[#00D4FF]/85 hover:text-[#00D4FF]">Retour à l’accueil</Link>
      </section>
    </main>
  )
}
