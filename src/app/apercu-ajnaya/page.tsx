'use client'

import { useState } from 'react'
import { notFound } from 'next/navigation'
import AjnayaPhoneDemo from '@/components/zone/AjnayaPhoneDemo'

/**
 * APERÇU DU TÉLÉPHONE AJNAYA — pour le REGARDER sans dépendre de la recherche.
 *
 * ⚠️ POURQUOI CETTE PAGE EXISTE.
 * Le téléphone ne s'affiche que lorsque `/api/zones/...` a répondu. Depuis un
 * poste sans accès à la base, cette route rend 503 et l'écran ne se montre
 * jamais — donc il partirait en production sans avoir été vu une seule fois.
 * C'est exactement ce qui s'est passé avec `/success`, qui exigeait un vrai
 * paiement pour être regardée.
 *
 * Ce n'est pas une copie : c'est LE composant que la barre de recherche
 * utilise. Ce qu'on regarde ici est ce qui part.
 *
 * ⚠️ INTROUVABLE EN PRODUCTION. Une page qui montre un écran d'application avec
 * des données d'exemple, accessible publiquement, serait indiscernable du
 * produit pour qui tombe dessus. Elle répond 404 hors développement.
 */
const ZONES = ['Roissy CDG', 'La Défense', 'Bastille', 'Gare de Lyon', 'Meaux']

export default function ApercuAjnaya() {
  const [zone, setZone] = useState('Roissy CDG')
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <main style={{ minHeight: '100vh', background: '#050508', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <p
          style={{
            fontSize: 11,
            letterSpacing: '.16em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,.39)',
            margin: '0 0 18px',
          }}
        >
          Aperçu · développement seulement
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 26 }}>
          {ZONES.map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setZone(z)}
              style={{
                background: z === zone ? 'rgba(0,212,255,.14)' : 'rgba(255,255,255,.03)',
                border: `1px solid ${z === zone ? 'rgba(0,212,255,.5)' : 'rgba(255,255,255,.13)'}`,
                color: '#F8FAFC',
                borderRadius: 100,
                padding: '7px 14px',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {z}
            </button>
          ))}
        </div>

        <AjnayaPhoneDemo
          zone={zone}
          onEssaiClick={() => console.log('[aperçu] porte essai')}
          onWhatsAppClick={() => console.log('[aperçu] porte WhatsApp')}
        />
      </div>
    </main>
  )
}
