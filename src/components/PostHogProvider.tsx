"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { hasTrackingConsent } from "@/lib/consent";

/**
 * PostHog — analytics produit + session replay + identité, hébergé EU (RGPD).
 *
 * Règles :
 * - `opt_out_capturing_by_default: true` → ZÉRO capture tant que le visiteur n'a pas
 *   accepté le bandeau de consentement (ConsentBanner / lib/consent.ts).
 * - `person_profiles: 'identified_only'` → pas de profil pour les anonymes (coût maîtrisé),
 *   mais les events anonymes se rattachent à la personne dès `identify()` (= le répertoire).
 * - Clé `phc_…` = clé PUBLIQUE client (safe en clair, par design PostHog). Override possible
 *   via NEXT_PUBLIC_POSTHOG_KEY / _HOST.
 */
const POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ||
  "phc_vYxWaLcXBSkgPpYT2FQz3VpsRr2ZiCsrTe2CfV56pheR";
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    /**
     * ⚠️ 22/08/2026 — POSTHOG S'INITIALISAIT SUR LE CHEMIN CRITIQUE POUR RIEN.
     *
     * Mesuré (Lighthouse, vrai navigateur, mobile) sur la production v152 :
     * l'initialisation tire quatre paquets supplémentaires en plus du cœur —
     * `surveys.js` (33 Ko, dont 27 Ko jamais exécutés), `dead-clicks-autocapture`,
     * `exception-autocapture`, `web-vitals`. Le tout pendant que le navigateur a
     * besoin du fil principal pour afficher le premier écran.
     *
     * ⚠️ ET RIEN N'ÉTAIT CAPTURÉ. `opt_out_capturing_by_default: true` : tant que
     * le visiteur n'a pas accepté le bandeau, PostHog n'envoie AUCUN événement.
     * On payait donc le téléchargement, l'analyse et l'exécution — pour zéro
     * donnée — exactement pendant la seconde qui décide si quelqu'un reste.
     *
     * Le LCP simulé de cette page est limité par le PROCESSEUR, pas par le
     * réseau : 748 ms d'exécution de scripts et 559 ms de calcul de styles,
     * multipliés par le bridage de 4× d'un téléphone d'entrée de gamme.
     *
     * L'initialisation part maintenant au premier moment de repos APRÈS le
     * chargement. Les appels `posthog.capture(...)` faits entre-temps sont
     * absorbés par la file interne de la bibliothèque — et de toute façon ils
     * sont tous protégés par un `try/catch` chez leurs appelants.
     */
    let annule = false;

    const demarrer = () => {
      if (annule) return;
      if (!posthog.__loaded) {
        posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          defaults: "2026-05-30",
          person_profiles: "identified_only",
          opt_out_capturing_by_default: true, // RGPD : rien tant que pas de consentement

          // ── CAPTURE MAXIMALE (profiter dans les moindres détails) ──────────────
          autocapture: true, // tous les clics / soumissions, sans code
          capture_pageview: true, // vues de page (SPA history)
          capture_pageleave: true, // temps passé + sorties (bounce réel)
          capture_performance: true, // Web Vitals : vitesse perçue par le chauffeur
          enable_heatmaps: true, // cartes de chaleur (où ils cliquent / rage clicks)
          capture_exceptions: true, // erreurs JS = bugs qui font fuir, remontés tout seuls
          rageclick: true, // clics de frustration = signaux de friction
          // Rejeu de session : on REGARDE le parcours. Masque les champs sensibles (RGPD).
          session_recording: {
            maskAllInputs: true, // téléphone / champs = masqués
            maskTextSelector: "[data-private]", // opt-out manuel par élément
          },
        });
      }

      // Active la capture si le consentement est déjà donné, sinon attend l'événement.
      if (hasTrackingConsent()) posthog.opt_in_capturing();
    };

    // `requestIdleCallback` n'existe pas sur Safari : repli sur un délai court.
    const auRepos = (fn: () => void) => {
      const w = window as unknown as {
        requestIdleCallback?: (
          f: () => void,
          o?: { timeout: number },
        ) => number;
      };
      if (typeof w.requestIdleCallback === "function")
        w.requestIdleCallback(fn, { timeout: 3000 });
      else window.setTimeout(fn, 1500);
    };

    if (document.readyState === "complete") auRepos(demarrer);
    else
      window.addEventListener("load", () => auRepos(demarrer), { once: true });
    const onConsent = () => posthog.opt_in_capturing();
    window.addEventListener("foreas_consent_accepted", onConsent);
    return () =>
      window.removeEventListener("foreas_consent_accepted", onConsent);
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
