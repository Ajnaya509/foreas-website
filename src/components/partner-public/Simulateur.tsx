'use client';

import { useId, useState } from 'react';
import s from '@/app/partenaire/partenaire.module.css';

// 10 € par mois et par abonnement mensuel payé et admissible (conditions du 24 septembre 2026).
const COMMISSION_MENSUELLE = 10;

// Écrit à la main pour que le serveur et le navigateur produisent exactement le même texte.
function euros(montant: number) {
  return String(montant).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' €';
}

export default function Simulateur() {
  const id = useId();
  const [chauffeurs, setChauffeurs] = useState(15);
  const total = chauffeurs * COMMISSION_MENSUELLE;
  const libelle = `${chauffeurs} chauffeur${chauffeurs > 1 ? 's' : ''} abonné${chauffeurs > 1 ? 's' : ''} au mensuel`;

  return <div className={s.simulator}>
    <div className={s.simControls}>
      <h3>Faites le calcul.</h3>
      <label htmlFor={id} className={s.simLabel}>{libelle}</label>
      <input
        id={id}
        type="range"
        min={1}
        max={100}
        step={1}
        value={chauffeurs}
        onChange={(evenement) => setChauffeurs(Number(evenement.target.value))}
        aria-valuetext={`${libelle}, soit ${total} euros par mois`}
        className={s.simRange}
      />
      <div className={s.simScale} aria-hidden="true"><span>1</span><span>100</span></div>
    </div>
    <output htmlFor={id} className={s.simResult}>
      <strong>{euros(total)}</strong>
      <span>par mois · {chauffeurs}&nbsp;×&nbsp;{euros(COMMISSION_MENSUELLE)}</span>
    </output>
    <p className={s.simNote}>Simulation. Seuls comptent les abonnements mensuels payés et admissibles. Premier versement : 20&nbsp;€ après le 2e mois payé. Aucun revenu garanti.</p>
  </div>;
}
