import Link from 'next/link'
import MesureVue from '@/components/mesure/MesureVue'
import type { Metadata } from 'next'
import { resolveReferralOffer } from '@/lib/referralOfferServer'
import { ReferralOfferError, type ReferralOffer } from '@/lib/referralOffer'
import ReferralCodeCard from '@/components/ReferralCodeCard'
import '../../devenir-partenaire/partenaire.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Ton invitation FOREAS Driver', robots: { index: false, follow: false } }

export default async function ReferralLanding({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params
  let offer: ReferralOffer | null = null
  let unavailable = false
  try { offer = await resolveReferralOffer(raw) }
  catch (error) { unavailable = !(error instanceof ReferralOfferError) || error.code !== 'CODE_UNAVAILABLE' }
  const discountKnown = !!offer && offer.discount_pct > 0 && (offer.duration_months !== null || offer.duration_type === 'forever')
  const permanentPartner = offer?.sponsor_type === 'partner' && offer.duration_type === 'forever' && offer.discount_pct === 10
  return (
    <main className="partner-page">
      <MesureVue page="/r/[code]" intention="partenaire" audience="chauffeur" />
      <header className="partner-header"><Link className="partner-brand" href="/">FOREAS<span>DRIVER</span></Link></header>
      <div style={{ maxWidth: 580, margin: '48px auto', paddingBottom: 48 }}>
        <p className="partner-eyebrow">Invitation FOREAS Driver</p>
        <section className="partner-intro">
          <h1>{offer ? 'Un chauffeur mieux accompagné.' : unavailable ? 'Vérifions ton invitation.' : 'Cette invitation n’est pas disponible.'}</h1>
          <p>{offer ? 'Découvre FOREAS Driver, l’app conçue pour accompagner ton activité de chauffeur VTC.' : unavailable ? 'La vérification est momentanément indisponible. Réessaie avant de t’abonner avec ce code.' : 'Demande un nouveau lien à la personne qui te l’a partagé.'}</p>
          {discountKnown && (permanentPartner ? <p style={{ marginTop: 20 }}><strong>10 % de remise à chaque renouvellement.</strong> Choisis le mensuel ou l’annuel : ton lien conserve cet avantage sur cet abonnement. Le prix remisé est confirmé avant le paiement.</p> : <p style={{ marginTop: 20 }}><strong>{offer!.discount_pct} % de remise {offer!.duration_type === 'forever' ? 'tant que cet abonnement mensuel reste actif' : 'pendant ' + offer!.duration_months + ' mois'}</strong> sur la formule mensuelle. {offer!.duration_type !== 'forever' && 'Ensuite, le tarif mensuel habituel s’applique. '}L’annuel reste au tarif fixe.</p>)}
          {offer && offer.discount_pct > 0 && !discountKnown && <p className="partner-note">Le code est reconnu. La durée de sa remise doit encore être confirmée par FOREAS avant un paiement mensuel avec ce code.</p>}
        </section>
        {offer ? (
          <>
            <ReferralCodeCard code={offer.code} />
            <Link className="partner-button" href={'/download?ref=' + encodeURIComponent(offer.code)}>Télécharger FOREAS Driver</Link>
            <Link className="partner-link" href={'/tarifs3?ref=' + encodeURIComponent(offer.code)} style={{ marginTop: 16 }}>Voir les formules et les conditions</Link>
          </>
        ) : (
          <div style={{ marginTop: 24 }}>
            {unavailable && <a className="partner-button" href={'/r/' + encodeURIComponent(raw)}>Réessayer la vérification</a>}
            <Link className="partner-link" href="/">Découvrir FOREAS</Link>
          </div>
        )}
      </div>
    </main>
  )
}
