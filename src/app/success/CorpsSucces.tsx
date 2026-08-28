/**
 * LE CORPS DE LA PAGE D'APRÈS-PAIEMENT.
 *
 * ⚠️ IL EST DANS SON PROPRE FICHIER POUR UNE RAISON PRÉCISE : la page
 * `/success` exige une vraie session Stripe, donc un vrai paiement. Elle ne
 * peut donc pas être REGARDÉE avant d'être expédiée — et une mise en page qui
 * casse à la dernière étape de l'entonnoir se paie cher.
 *
 * Isolé ici, le même JSX peut être rendu avec des données fabriquées, à côté,
 * le temps de le voir. Ce n'est pas une copie : c'est le composant que la vraie
 * page utilise. Ce qu'on regarde est donc ce qui part.
 */
type Props = {
  firstName: string
  customerEmail: string
  trialEndUnix: number | null
  trialEndFormatted: string | null
  tierName: string
  billingLabel: string | null
  hasBeta60: boolean
  communityGroup: string | null
  customerId: string | null
}

export default function CorpsSucces({
  firstName,
  customerEmail,
  trialEndUnix,
  trialEndFormatted,
  tierName,
  billingLabel,
  hasBeta60,
  communityGroup,
  customerId,
}: Props) {
  return (
    <>
  {/* ═══════════════════════════════════════════════════════════════════
      ⚠️ 28/08 — CETTE PAGE A ÉTÉ REFAITE, ET LA RAISON N'EST PAS ESTHÉTIQUE.

      Elle proposait « Vos 3 prochaines étapes » : trois cartes de même
      poids — installer l'app, régler son profil, rejoindre la communauté —
      dont deux menaient sur partners.foreas.xyz.

      Or le premier bouton envoie vers /go, qui ouvre l'App Store. Le
      chauffeur QUITTE la page. Sur iPhone il installe, puis il tape
      « Ouvrir » dans l'App Store : il ne revient jamais dans le navigateur.
      Trois étapes de même poids alors qu'une seule sera jamais faite.

      Et il manquait la seule chose dont il a besoin dans les secondes qui
      suivent : SES CODES. L'app va les lui demander, et la page ne disait
      pas où ils étaient.

      La page dit maintenant, dans l'ordre où ça lui sert :
        1. il n'a rien payé aujourd'hui
        2. à quoi servent ces trois jours — et ce qu'ils lui rapportent
        3. où sont ses codes, et quoi faire s'ils tardent
        4. qui l'attend de l'autre côté
        5. le bouton — en dernier, parce qu'après il n'est plus là
      Le reste passe en liens discrets, sous la ligne de flottaison.

      ⚠️ ET ON LE TUTOIE. La page de vente vouvoie : devant un inconnu, le
      tutoiement force une familiarité qu'on n'a pas. Ici il a payé. Le
      vouvoyer maintenant le tiendrait à distance au moment précis où on
      lui souhaite la bienvenue.

      ⚠️ AUCUN MOT DE PRÉLÈVEMENT. « Aucun débit avant le… » disparaît :
      le vocabulaire de ce qu'on lui prend n'a rien à faire sur l'écran
      qui l'accueille. Le fait reste écrit, à l'endroit.
      ═══════════════════════════════════════════════════════════════════ */}
  <p
    className="text-[10px] font-extrabold uppercase text-center mb-4 tabular-nums"
    style={{ color: '#10B981', letterSpacing: '0.25em' }}
  >
    {trialEndUnix ? 'FOREAS · ESSAI ACTIVÉ' : 'FOREAS · ABONNEMENT ACTIVÉ'}
  </p>

  <h1
    className="text-4xl sm:text-5xl font-black text-center leading-[0.92] mb-4"
    style={{
      color: '#F8FAFC',
      letterSpacing: '-0.04em',
      fontFamily: 'var(--font-genos), system-ui, sans-serif',
    }}
  >
    Bienvenue,{' '}
    <span
      style={{
        backgroundImage:
          'linear-gradient(135deg, #6C3CE0 0%, #8C52FF 50%, #00D4FF 100%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      {firstName}.
    </span>
  </h1>

  {/* Le montant du jour. Sur un essai il vaut zéro, et c'est le chiffre
      qui doit être le plus gros de la page. */}
  {trialEndUnix ? (
    <p
      className="text-center text-[19px] sm:text-xl mb-1"
      style={{ color: '#F8FAFC', letterSpacing: '-0.02em' }}
    >
      <strong className="text-3xl sm:text-4xl font-black tabular-nums align-middle">
        0 €
      </strong>{' '}
      <span style={{ color: 'rgba(248, 250, 252, 0.72)' }}>aujourd’hui.</span>
    </p>
  ) : (
    <p className="text-center text-base mb-6" style={{ color: 'rgba(248, 250, 252, 0.78)' }}>
      Ton abonnement <strong style={{ color: '#F8FAFC' }}>{tierName}</strong> est actif
      {billingLabel ? `, ${billingLabel}` : ''}.
    </p>
  )}

  {trialEndFormatted && (
    <p
      className="text-center text-[13px] mb-7 tabular-nums"
      style={{ color: 'rgba(248, 250, 252, 0.46)' }}
    >
      Premier paiement le <strong style={{ color: 'rgba(248, 250, 252, 0.72)' }}>{trialEndFormatted}</strong>
      {hasBeta60 ? ' · code BETA60' : ''}
    </p>
  )}

  {/* ⚠️ LA GRAINE DE RÉTENTION. Validée avec Chandler le 28/08, mot pour mot.

      « Tout en » n'est pas un ornement : c'est le mot qui empêche le
      sentiment de s'être fait avoir. Une promesse au futur — « plus elle
      te connaîtra, mieux elle verra » — dit *je paie aujourd'hui, on me
      répond demain*. « Tout en » dit que ça marche PENDANT.

      ⚠️ ET ÇA DOIT RESTER VRAI. Ce qui fonctionne dès la première course
      ne dépend d'aucun apprentissage : le calcul de ce qui reste vraiment
      sur une course, et Ajnaya qui répond quand on lui demande. On ne
      promet rien de plus — ni chiffre, ni date, ni gain annoncé. */}
  {trialEndUnix && (
    <div className="mb-8">
      <p
        className="text-center text-[16.5px] leading-snug"
        style={{ color: '#F8FAFC', letterSpacing: '-0.014em', textWrap: 'balance' }}
      >
        Pendant trois jours, Ajnaya apprend comment tu travailles, tout en
        t’apportant du résultat.
      </p>
      <p
        className="text-center text-[13.5px] mt-2"
        style={{ color: 'rgba(248, 250, 252, 0.56)', textWrap: 'balance' }}
      >
        Tes zones, tes heures, tes décisions : chaque course lui en dit un peu plus.
      </p>
    </div>
  )}

  {/* ⚠️ LES CODES PASSENT AVANT LE BOUTON, ET CE N'EST PAS DE LA MISE EN
      PAGE. Une fois le bouton touché, l'App Store recouvre l'écran. S'il
      découvre le problème du mail plus tard, il n'a plus rien de tout ça
      sous la main — ni l'adresse, ni l'avertissement, ni la marche à
      suivre. */}
  <div
    className="rounded-2xl p-5 mb-7"
    style={{
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
    }}
  >
    <h2
      className="text-[15.5px] font-bold mb-1"
      style={{ color: '#F8FAFC', letterSpacing: '-0.012em' }}
    >
      Le mail avec tes codes
    </h2>
    {customerEmail ? (
      <p className="text-[13.5px]" style={{ color: 'rgba(248, 250, 252, 0.72)' }}>
        Envoyé à{' '}
        <strong className="tabular-nums" style={{ color: '#F8FAFC' }}>
          {customerEmail}
        </strong>
        , à l’instant.
      </p>
    ) : (
      /* ⚠️ Sans adresse, on ne l'invente pas. Une adresse fausse sous les
         yeux du chauffeur vaut moins que pas d'adresse du tout. */
      <p className="text-[13.5px]" style={{ color: 'rgba(248, 250, 252, 0.72)' }}>
        Envoyé à l’adresse du paiement, à l’instant.
      </p>
    )}
    <p
      className="mt-3 rounded-xl px-3 py-2.5 text-[13px] leading-snug"
      style={{
        backgroundColor: 'rgba(245, 158, 11, 0.10)',
        border: '1px solid rgba(245, 158, 11, 0.24)',
        color: '#F5C842',
      }}
    >
      Le mot de passe n’existe que dans ce mail. Il n’est écrit nulle part ailleurs.
    </p>
    <p className="mt-3 text-[12.5px]" style={{ color: 'rgba(248, 250, 252, 0.42)' }}>
      Il met parfois deux à trois minutes à arriver. Pense aux indésirables.
    </p>
  </div>

  {/* L'invitation vient juste avant le bouton : c'est elle qui donne envie
      d'appuyer. Sous le bouton, elle ne serait lue par personne. */}
  <p
    className="text-center text-[14.5px] mb-4"
    style={{ color: 'rgba(248, 250, 252, 0.78)', textWrap: 'balance' }}
  >
    De l’autre côté, <strong style={{ color: '#F8FAFC' }}>Ajnaya t’attend</strong> — elle
    fait le tour de l’app avec toi.
  </p>

  <a
    href="/go"
    className="flex items-center justify-center w-full rounded-2xl px-6 py-4 text-[17px] font-extrabold transition-transform active:scale-[0.98]"
    style={{
      backgroundImage: 'linear-gradient(135deg, #8C52FF 0%, #6C3CE0 100%)',
      color: '#FFFFFF',
      boxShadow: '0 10px 34px rgba(140, 82, 255, 0.34)',
      letterSpacing: '-0.014em',
    }}
  >
    Télécharger l’application
  </a>
  <p
    className="text-center mt-3 mb-9 text-[12.5px]"
    style={{ color: 'rgba(248, 250, 252, 0.42)' }}
  >
    iPhone ou Android : le bon magasin s’ouvre tout seul
  </p>

  {/* ⚠️ CES TROIS-LÀ NE SONT PAS DES ÉTAPES, CE SONT DES DESTINATIONS.
      Elles vivent hors de l'app et ne servent qu'à celui qui revient sur
      cette page plus tard. Elles gardent leur place, elles perdent leur
      poids : elles ne peuvent plus concurrencer le seul geste qui compte. */}
  <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-6 text-[13px]">
    <a
      href="https://partners.foreas.xyz/driver"
      className="underline underline-offset-4 transition-colors hover:text-white"
      style={{ color: 'rgba(248, 250, 252, 0.52)' }}
    >
      Mon profil
    </a>
    <a
      href="https://partners.foreas.xyz/driver?tab=community"
      className="underline underline-offset-4 transition-colors hover:text-white"
      style={{ color: 'rgba(248, 250, 252, 0.52)' }}
    >
      Ma communauté{communityGroup ? ` · ${communityGroup}` : ''}
    </a>
    {customerId && (
      <a
        href={`/api/customer-portal?customer_id=${customerId}`}
        className="underline underline-offset-4 transition-colors hover:text-white"
        style={{ color: 'rgba(248, 250, 252, 0.52)' }}
      >
        Gérer mon abonnement
      </a>
    )}
  </div>

  <p
    className="text-center text-[10.5px] tabular-nums"
    style={{ color: 'rgba(248, 250, 252, 0.30)', letterSpacing: '0.04em' }}
  >
    Paiement traité par Stripe · Annulable en un clic · Sans engagement
  </p>
    </>
  )
}
