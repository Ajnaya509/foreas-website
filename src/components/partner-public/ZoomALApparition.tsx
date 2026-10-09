'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Lance le zoom Verdict Instant quand l'image apparaît à l'écran, une seule fois.
 *
 * Le serveur écrit l'état « attente » : le téléphone entier, une image déjà finie
 * si le script ne s'exécute pas. Le style porte le zoom (partenaire.module.css) ;
 * ce composant ne fait que dire quand il commence.
 */
export default function ZoomALApparition({ className, children }: { className: string; children: ReactNode }) {
  const cadre = useRef<HTMLDivElement>(null);
  const [etat, setEtat] = useState<'attente' | 'joue'>('attente');

  useEffect(() => {
    const element = cadre.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setEtat('joue');
      return;
    }
    const observateur = new IntersectionObserver(([entree]) => {
      if (entree?.isIntersecting) {
        setEtat('joue');
        observateur.disconnect();
      }
    }, { threshold: 0.45 });
    observateur.observe(element);
    return () => observateur.disconnect();
  }, []);

  return <div ref={cadre} className={className} data-zoom={etat}>{children}</div>;
}
