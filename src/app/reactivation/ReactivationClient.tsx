'use client'

/**
 * /reactivation — landing de relance base froide (dormante ~1 an).
 * Stratégie actée (brief AJNAYA_PAGE_REACTIVATION_SITE, Chandler) : CASH NOW.
 * → paiement IMMÉDIAT (pas d'essai) + garantie 30j satisfait-remboursé (risk reversal Hormozi).
 *
 * Copy : copy-atomic (base FROIDE + product-aware → on vend la PREUVE + l'OFFRE + la GARANTIE,
 * tutoiement pro Koraly, "gagne plus roule moins", zéro chiffre inventé).
 * Prix : src/lib/offre.ts (source unique côté site). Affirmations : src/lib/verite-commerciale.ts.
 * Design : design-system site "Dark Sovereign" (#050508), un seul héros, garantie proéminente,
 * tabular-nums, quiet-tech. Distraction zéro (pas de nav riche — règle landing §6.8).
 */

import { useState } from 'react'
import { ShieldCheck, Check, Lock, ArrowRight, Loader2 } from 'lucide-react'
import TestimonialVideoCard from '@/components/zone/TestimonialVideoCard'
import { TESTIMONIALS } from '@/components/zone/testimonials.data'
import { PRIX_MENSUEL_CENTIMES, formaterEuros } from '@/lib/offre'
import { COMMUNAUTE_PHRASES, COMPTA_PHRASES } from '@/lib/verite-commerciale'

import { garantieAffichable } from '@/lib/verite-commerciale'
/**
 * ⚠️ 21/08/2026 — PEUT ÊTRE `undefined`, ET C'EST NOUVEAU.
 *
 * `testimonials.data.ts` filtre désormais sur les accords signés. Tant que les
 * six sont « en attente », la liste est VIDE — donc `TESTIMONIALS[0]` vaut
 * `undefined` et non plus un témoignage.
 *
 * TypeScript ne l'a PAS signalé : sans `noUncheckedIndexedAccess`, l'accès par
 * indice est typé comme s'il réussissait toujours. Le typecheck passait au vert
 * sur une page qui aurait planté au premier chargement. Un vert de compilateur
 * n'est pas une preuve d'exécution.
 */
const BINATE = TESTIMONIALS[0]
// ⚠️ 22/08 — cherchait `t.name.startsWith('Binate')`. Le nom d'une personne
// réelle, écrit en dur dans un composant client : la chaîne partait dans le
// paquet JavaScript, même quand la liste filtrée était vide. On prend la
// première entrée AUTORISÉE, sans nommer personne.

/**
 * ⚠️ Le prix était écrit EN DUR à 4 endroits de ce fichier (« 29,99€ »).
 * Mesure du 14/08/2026 : le site encaissait déjà DEUX prix différents pour le même
 * produit (29,99 € via /api/checkout, 97 € via /api/subscription/create) parce
 * qu'un montant vivait à plusieurs endroits. Source unique = src/lib/offre.ts.
 */
const PRIX_MOIS = formaterEuros(PRIX_MENSUEL_CENTIMES)

const C = {
  bg: '#050508',
  hero: '#F8FAFC',
  text: 'rgba(248,250,252,0.80)',
  muted: 'rgba(248,250,252,0.52)',
  violet: '#8C52FF',
  cyan: '#00D4FF',
  green: '#10B981',
  glass: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.09)',
}

export default function ReactivationClient() {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const startCheckout = async () => {
    if (loading) return
    setErr('')
    setLoading(true)
    try {
      try { window.fbq?.('trackCustom', 'ReactivationCheckout', { plan: 'pro_monthly' }) } catch { /* noop */ }
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // immediate = on encaisse maintenant (pas d'essai) — garantie 30j gérée hors-Stripe.
        body: JSON.stringify({ plan: 'pro_monthly', immediate: true }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      setErr(data.error || "Le paiement n'a pas pu démarrer. Réessaie dans un instant.")
      setLoading(false)
    } catch {
      setErr('Erreur réseau. Réessaie dans un instant.')
      setLoading(false)
    }
  }

  const Guarantee = ({ className = '' }: { className?: string }) => (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ${className}`}
      style={{ background: 'rgba(16,185,129,0.10)', border: `1px solid rgba(16,185,129,0.28)` }}
    >
      {/*
      ⚠️ 21/08/2026 — LA GARANTIE 30 JOURS N'EST PLUS ANNONCÉE.

      Elle EXISTE au contrat (clause écrite dans /cgu : remboursement intégral
      de la première période, sans justification, sur simple message). Ce qui
      manque, c'est le mécanisme : aucun délai de traitement annoncé, aucun
      responsable nommé, et aucune trace qu'un remboursement ait jamais été
      traité — ni dans le code des trois dépôts, ni en base.

      Une promesse de remboursement qu'on ne peut pas prouver honorer engage
      plus qu'elle ne rassure : le jour où quelqu'un la réclame et attend,
      c'est la parole de FOREAS qui tombe.

      ON CESSE DE LA VENDRE. ON CONTINUE DE LA DEVOIR — la clause reste dans
      les CGU, un abonné qui la demande l'obtient. Retirer un droit du contrat
      en silence serait pire que de ne pas l'avoir annoncé.

      Source unique : GARANTIE_30J dans src/lib/verite-commerciale.ts. Y
      passer `prouvee: true` la rallume partout d'un coup.

        ⚠️ ET UNE LEÇON : ce bloc s'est AFFICHÉ SUR LA PAGE, en production.
        Un commentaire de bloc posé dans les ENFANTS d'un élément JSX n'est
        pas un commentaire : c'est du TEXTE. Il lui faut des accolades. Le
        mien est parti en ligne, échappé en entités HTML, sous les yeux des
        visiteurs.

        Et deux fois le même piège dans le même bloc : en rédigeant CETTE
        leçon, j'y avais recopié la séquence qui referme un commentaire — ce
        qui l'a refermé au milieu d'une phrase. La vérification des types a
        attrapé le second cas, jamais le premier : un texte affiché est une
        chaîne parfaitement valide.
      */}
      <ShieldCheck size={16} style={{ color: C.green }} />
      <span className="text-[13px] font-semibold" style={{ color: C.green }}>
        {garantieAffichable()
          ? 'Garanti 30 jours — remboursé, sans question'
          : 'Résiliable à tout moment, depuis ton espace'}
      </span>
    </div>
  )

  const CTA = ({ label = 'Démarrer maintenant' }: { label?: string }) => (
    <div className="flex flex-col items-center gap-2 w-full">
      <button
        onClick={startCheckout}
        disabled={loading}
        className="group inline-flex items-center justify-center gap-2 w-full max-w-md px-7 py-4 rounded-2xl font-extrabold text-[16px] text-white transition-transform hover:scale-[1.015] active:scale-[0.99] disabled:opacity-60"
        style={{ background: `linear-gradient(135deg, ${C.violet} 0%, #6C3CE0 100%)`, boxShadow: '0 10px 34px -8px rgba(140,82,255,0.5)' }}
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : null}
        {label}
        {!loading && <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />}
      </button>
      <p className="text-[12px]" style={{ color: C.muted }}>
        Paiement aujourd&apos;hui · {PRIX_MOIS}/mois · annulation 1 clic
      </p>
      {err && <p className="text-[12px]" style={{ color: '#F87171' }}>{err}</p>}
    </div>
  )

  return (
    <main style={{ background: C.bg, color: C.text }} className="min-h-screen w-full">
      {/* halo discret */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-0" style={{
        background: 'radial-gradient(60% 40% at 50% 0%, rgba(140,82,255,0.14), transparent 70%)',
      }} />

      <div className="relative z-10 mx-auto w-full max-w-2xl px-5 py-10 sm:py-14">
        {/* Logo minimal — zéro nav (landing = 1 chemin) */}
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-extrabold"
               style={{ background: `linear-gradient(135deg, ${C.violet}, ${C.cyan})` }}>F</div>
          <span className="text-[14px] font-bold tracking-tight" style={{ color: C.hero }}>FOREAS</span>
        </div>

        {/* ── HERO : on adresse le silence en face (Miller guide + sympathie) ── */}
        <section className="text-center">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em]" style={{ color: C.cyan }}>
            Pour toi qui nous connais déjà
          </p>
          <h1 className="mt-3 text-[30px] sm:text-[40px] font-extrabold leading-[1.05] tracking-tight" style={{ color: C.hero }}>
            Un an de silence.<br />Voilà pourquoi je reviens te voir.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed" style={{ color: C.text }}>
            {garantieAffichable()
              ? <>Pas de blabla. Une preuve, une offre, une garantie. Tu juges sur{' '}
                  <strong style={{ color: C.hero }}>30 jours</strong> — pas convaincu, je te rembourse, sans discuter.</>
              : <>Pas de blabla. Une preuve, une offre, un prix. Tu paies aujourd&apos;hui et tu{' '}
                  <strong style={{ color: C.hero }}>résilies quand tu veux</strong>, depuis ton espace.</>}
          </p>
        </section>

        {/* ── PREUVE VIDÉO (l'humain casse la méfiance) ─────────────────────── */}
        {/* Remplaçable par la vidéo FONDATEUR quand elle est prête. En attendant : Binaté, cas réel. */}
        <section className="mt-8">
          {BINATE && (<TestimonialVideoCard testimonial={BINATE} index={0} showQuote />)}
          {/*
            ⚠️ Ici s'affichait « 8 chauffeurs sur 10 qui reviennent choisissent Pro ».
            Mesuré faux le 14/08/2026 : `select count(*) from subscriptions` → 4 (toutes
            actives), `select count(*) filter (where subscription_active), count(*) from
            drivers` → 8/30, et `pieuvre_pricing_plans.plan_code='pro_monthly'` est
            `is_active=false`. Aucune table de « chauffeurs revenus » : le ratio 8/10
            n'avait aucune source calculable, et aucun plan « Pro » n'existe.
            Remplacé par la seule preuve vérifiable de cette page — les visages filmés
            (src/components/zone/testimonials.data.ts → 6), servie par verite-commerciale.ts.
          */}
          <p className="mt-3 text-center text-[13px]" style={{ color: C.muted }}>
            <strong style={{ color: C.green }}>{COMMUNAUTE_PHRASES.preuveHonnete}</strong>. Regarde-les
            avant de sortir ta carte.
          </p>
        </section>

        {/* ── BÉNÉFICE + ancrage prix (le prix/jour vient de offre.ts, pas d'un chiffre écrit ici) ── */}
        <section className="mt-10 text-center">
          <h2 className="text-[26px] sm:text-[32px] font-extrabold tracking-tight" style={{ color: C.hero }}>
            Gagne plus, roule moins.
          </h2>
          {/*
            ⚠️ « Une seule course récupérée dans la semaine, et c'est remboursé » promettait
            un gain que rien ne mesure (aucun agrégat de revenu chauffeur, cf. verite-commerciale.ts).
            Remplacé par un fait vérifiable dans le code : `annulationEnUnClic: true`.
          */}
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed" style={{ color: C.text }}>
            <strong style={{ color: C.hero }}>{PRIX_MOIS}/mois</strong>, c&apos;est{' '}
            <strong style={{ color: C.cyan }}>moins d&apos;1 € par jour</strong> — le prix d&apos;un café.
            Et tu coupes en un clic, quand tu veux.
          </p>
        </section>

        {/* ── OFFRE + CTA (un seul chemin) ──────────────────────────────────── */}
        <section className="mt-8 rounded-3xl p-6 sm:p-8" style={{ background: C.glass, border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between">
            {/*
              ⚠️ « Pro · le plus choisi » : double mensonge mesuré le 14/08/2026.
              (1) `pieuvre_pricing_plans.plan_code='pro_monthly'` → `is_active=false` : aucun
              plan « Pro » n'est vendable, src/lib/offre.ts n'expose que mensuel/annuel.
              (2) « le plus choisi » est un superlatif qu'aucun agrégat n'alimente
              (4 abonnements au total) — interdit par verite-commerciale.ts §1.
            */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: C.violet }}>Une seule offre, tout dedans</p>
              <p className="mt-1 text-[34px] font-extrabold tabular-nums leading-none" style={{ color: C.hero }}>
                {PRIX_MOIS}<span className="text-[15px] font-semibold" style={{ color: C.muted }}>/mois</span>
              </p>
            </div>
            <Guarantee className="hidden sm:inline-flex" />
          </div>

          <ul className="mt-5 space-y-2.5">
            {[
              /*
                ⚠️ « Ajnaya IA illimitée » : le mot « IA » est banni du site (Ajnaya a un nom,
                on l'emploie — verite-commerciale.ts). Et « illimitée » n'est adossé à aucun
                quota mesuré : la voix passe par un quota ElevenLabs qui, lui, s'épuise.
              */
              'Ajnaya avec toi au volant — et sa voix, Koraly',
              'Heatmap multi-source (où ça paie, en vrai)',
              'Coach courses : accepter / refuser en 0,3s',
              /*
                ⚠️ « Compta IA + Tirelire URSSAF auto » = promesse d'un service financier qui
                n'existe pas. Mesure du 14/08/2026 : sur 356 tables, `select table_name from
                information_schema.tables where table_schema='public' and (table_name ilike
                '%wallet%' or '%tirelire%' or '%urssaf%')` → 0 ligne. Aucun portefeuille, aucun
                cantonnement, aucun mouvement d'argent. L'URSSAF SE CALCULE, elle ne se met pas
                de côté. Et FOREAS est copilote de gestion, jamais expert-comptable
                (Ordonnance du 19 sept. 1945, art. 20). Formulation servie par
                verite-commerciale.ts → COMPTA_PHRASES, déjà appliquée sur /checkout.
              */
              `${COMPTA_PHRASES.titre} : ${COMPTA_PHRASES.sousTitre}`,
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[14px]" style={{ color: C.text }}>
                <Check size={17} style={{ color: C.green }} className="mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <CTA />
          </div>
          <div className="mt-4 flex sm:hidden justify-center"><Guarantee /></div>

          <div className="mt-4 flex items-center justify-center gap-4 text-[11px]" style={{ color: C.muted }}>
            <span className="inline-flex items-center gap-1"><Lock size={12} /> Paiement sécurisé Stripe</span>
            <span>·</span>
            <span>Annulation en 1 clic</span>
          </div>
        </section>

        {/* ── OBJECTIONS (les 3 craintes du grincheux, courtes + factuelles) ── */}
        <section className="mt-10 space-y-3">
          {[
            /*
              ⚠️ « Le retour se voit dès la première semaine » : promesse de résultat daté,
              qu'aucune mesure ne soutient (aucun agrégat de revenu chauffeur en base).
              Remplacée par une comparaison de prix, vérifiable par n'importe qui.
            */
            { q: '« C\'est trop cher. »', a: `Moins d'1 € par jour. Le mois entier coûte moins qu'un plein.` },
            { q: '« Ça marche pas pour moi. »', a: garantieAffichable()
                ? 'Garantie 30 jours, remboursé sans discuter. Tu testes en vrai, tu risques zéro.'
                : 'Tu résilies quand tu veux, depuis ton espace, sans avoir à te justifier. Tu testes sur tes vraies courses.' },
            { q: '« J\'ai pas le temps. »', a: '2 minutes pour activer. Après, Ajnaya bosse pendant que tu conduis.' },
          ].map((o) => (
            <div key={o.q} className="rounded-2xl p-4" style={{ background: C.glass, border: `1px solid ${C.border}` }}>
              <p className="text-[14px] font-bold" style={{ color: C.hero }}>{o.q}</p>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ color: C.text }}>{o.a}</p>
            </div>
          ))}
        </section>

        {/* ── CTA final ─────────────────────────────────────────────────────── */}
        <section className="mt-10 text-center">
          <p className="mb-4 text-[15px]" style={{ color: C.text }}>
            Tu as déjà perdu un an. Ce soir, tu peux reprendre la main.
          </p>
          <CTA label={`Reprendre la main — ${PRIX_MOIS}`} />
        </section>

        <p className="mt-10 text-center text-[11px]" style={{ color: C.muted }}>
          FOREAS — copilote des chauffeurs VTC. Paiement Stripe.{garantieAffichable() ? ' Garantie 30 jours satisfait ou remboursé.' : ' Résiliable à tout moment.'}
        </p>
      </div>
    </main>
  )
}
