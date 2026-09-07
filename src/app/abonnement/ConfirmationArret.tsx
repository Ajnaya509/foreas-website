'use client'

import { useId, useRef } from 'react'
import { X } from 'lucide-react'

type Props = { essai: boolean; echeance: string | null; occupe: boolean; onArreter: () => void }

/** Une décision avant Stripe. Fermer cette fenêtre ne change aucun abonnement. */
export default function ConfirmationArret({ essai, echeance, occupe, onArreter }: Props) {
  const dialogue = useRef<HTMLDialogElement>(null)
  const titre = useId()
  const description = useId()
  const fermer = () => dialogue.current?.close()
  return <>
    <button disabled={occupe} className="compte-bouton compte-secondaire" onClick={() => dialogue.current?.showModal()}>Arrêter le renouvellement</button>
    <dialog ref={dialogue} className="compte-confirmation" aria-labelledby={titre} aria-describedby={description}>
      <div className="compte-confirmation-entete">
        <h2 id={titre} tabIndex={-1} autoFocus className="compte-sous-titre font-title t-h2">Avant d’arrêter le renouvellement</h2>
        <button type="button" className="compte-fermer" aria-label="Fermer la confirmation" onClick={fermer}><X aria-hidden="true" /></button>
      </div>
      <div id={description} className="compte-bloc">
        <p className="t-bodylg">{essai ? 'Tu peux encore essayer Ajnaya sur tes prochaines courses.' : 'Tu peux garder FOREAS pour tes prochaines courses.'}</p>
        <p className="compte-aide t-bodylg">{echeance
          ? `Si tu continues, ton ${essai ? 'premier' : 'prochain'} paiement est prévu le ${echeance}.`
          : 'Si tu continues, le renouvellement reste actif. Retrouve ta date de paiement sur Stripe.'}</p>
        <p className="compte-aide t-bodylg">Pour arrêter, tu confirmeras ton choix sur Stripe.</p>
      </div>
      <div className="compte-actions">
        <button type="button" className="compte-bouton compte-primaire" onClick={fermer}>{essai ? 'Continuer mon essai' : 'Garder mon abonnement'}</button>
        <button type="button" disabled={occupe} className="compte-bouton compte-secondaire" onClick={() => { fermer(); onArreter() }}>Continuer vers l’arrêt</button>
      </div>
    </dialog>
  </>
}
