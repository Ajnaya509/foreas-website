# 🎬 /experience — Séquences cinéma : passation Opus/Sonnet

> **Écrit par Fable 5 (2026-07-18)** après validation du mécanisme avec le 1er clip réel.
> Objectif : n'importe quel fil (Opus/Sonnet) peut ajouter les séquences suivantes quand
> Chandler fournit les assets, sans re-réfléchir l'architecture.

---

## 1. La vision (Chandler, verbatim résumé)

Page produit type Apple, **conversion d'abord**. Pour CHAQUE feature :
un clip cinéma (filtre + grain + letterbox) joue **au rythme du scroll** à droite,
des **titres-chocs** apparaissent à gauche sur un **dégradé noir → vidéo**,
zoom léger sur le visage au moment du regard-caméra,
puis la vidéo se fige/s'assombrit → **mockup iPhone entre à gauche** (feature en action,
capture ScreenStudio) et la **description continue à droite**.
Mobile : même histoire, empilée — clip vertical, titres en arrivée horizontale, mockup dessous.
**Entre les features : témoignages chauffeurs dans le même procédé.**

## 2. Ce qui est DÉJÀ construit (ne pas réinventer)

| Pièce | Fichier | Rôle |
|---|---|---|
| `CinematicSequence` | `src/components/experience/CinematicSequence.tsx` | LA séquence complète (desktop scrub + mobile empilé). 1ʳᵉ instance : Alerte contrôle 2D |
| `PhoneFrame` | `src/components/experience/PhoneFrame.tsx` | cadre iPhone réaliste, écran = children |
| `useSectionSeen` | `src/hooks/useSectionSeen.ts` | tracking PostHog viewed+dwell par section |
| `SmoothScroll` | `src/components/experience/SmoothScroll.tsx` | Lenis scopé /experience (ne pas déplacer dans layout) |
| `StickyFeatures` | `src/components/experience/StickyFeatures.tsx` | visite produit provisoire (titres 100/100) — sera remplacée séquence par séquence quand les clips arrivent |

Événements PostHog déjà branchés : `experience_section_viewed`, `experience_section_dwell`,
`experience_cinematic_payoff_viewed`.

## 3. ORDRE FINAL de la page (décision Chandler — à respecter au fur et à mesure)

1. Hero (modale desktop / LivePhone mobile) — NE PAS TOUCHER
2. **Séquence VERDICT INSTANT** (1ʳᵉ feature vue — clip à venir)
3. Témoignage chauffeur (même procédé cinéma)
4. **Séquence ALERTE CONTRÔLE** (clip déjà en place — instance actuelle)
5. Autres séquences (zone, vocale, client direct, compta) entrecoupées de témoignages
6. Offre 29,99 € → FAQ → CTA pulsant

Titres 100/100 déjà validés (audit copy-atomic) pour toutes les features → dans `StickyFeatures.tsx` (FEATURES). Les reprendre tels quels pour les futures séquences.

## 3bis. DOCTRINE TYPO DES BEATS (à respecter pour toute nouvelle séquence)

Un titre-choc doit se lire en UNE saccade oculaire. D'où la découpe en **deux temps** :

```
Terminal 2D.          ← LEAD  : le décor, ivoire #F8FAFC, neutre
Ce matin.  🙄         ← PUNCH : l'enjeu, cyan #00D4FF + émoji APRÈS la chute

Lui,                  ← LEAD  : le sujet (leadScale 1.18 = légèrement plus grand,
personne ne l'a          JAMAIS de capitale ajoutée), la virgule suspend
prévenu.  😏          ← PUNCH : l'injustice nommée, cyan
```

Règles dures :
- **Un seul accent cyan par beat** — il marque toujours le mot qui porte l'enjeu, jamais la déco.
- **L'émoji arrive APRÈS la chute**, jamais avant (sinon il spoile l'émotion et tue le beat).
  Choisi selon le contexte émotionnel : 🙄 (fatalité), 😏 (complicité/malice), 😌 (soulagement),
  🤫 (secret partagé). Animation légère (rotation ±6°, scale 1.08, pause 1,6 s entre deux).
- Chaque beat **entre par le bas, tient, se retire vers le haut** — le suivant prend sa place.
- `leadScale` agrandit le sujet sans le crier. Genos (`font-title`), letter-spacing −0.045em.

Champs d'un beat : `{ in, out, lead, punch, emoji, leadScale }` — `in`/`out` = fenêtres de
progression de la section (0→1).

## 3ter. ASSETS MUX EN PLACE (séquence Alerte contrôle)

| Usage | Asset ID | Playback ID | Format |
|---|---|---|---|
| Desktop | `vPmn7P01TS9Lk6OEZq3VkUzkrDZzOn3x7N02GZlGGTZws` | `WpmrheUgL7J8GLgCyr3sMJXsbqgoLm01mGII7JnbdiT00` | 16:9, 5,13 s |
| Mobile | `JgtOCQHMmX2yt8wCXPKU8hSd81jbEmOeELwTejH1SRU` | `7YomMmttdmQ402t1tmYdhZT5mhkK00z3sEqMaCRR02ddpg` | 9:16, 5,06 s |

MP4 `capped-1080p` activé sur les deux. Étalonnage vintage appliqué en CSS (constante `VINTAGE`) :
`sepia(.12) contrast(1.12) saturate(.72) brightness(.88) hue-rotate(-4deg)` — le sépia porte le
« vieux film » sans virer jaune, le noir profond du design system est préservé.

## 4. Comment ajouter une séquence (checklist exacte)

1. **Clip Mux** : uploader → copier le *Playback ID* (onglet Playback and Thumbnails).
   Activer le MP4 : `PUT /video/v1/assets/{ASSET_ID}/mp4-support` body `{"mp4_support":"capped-1080p"}`
   (clés dans `foreas_secrets_tmp.env` : MUX_TOKEN_ID/SECRET — jamais les committer/afficher).
   URLs : vidéo `https://stream.mux.com/{PLAYBACK_ID}/capped-1080p.mp4` · poster `https://image.mux.com/{PLAYBACK_ID}/thumbnail.webp?time=X&width=1600`.
2. **Dupliquer la config `SCENE`** dans CinematicSequence (ou généraliser en `scenes[]` si ≥2) :
   `clip` (mp4Url/posterUrl/durationSec/verticalMp4Url), `beats` (titres gauche, fenêtres [in,out] de progression),
   `zoom` (start/end/scale/origin — **à caler en regardant le clip** : fenêtre du regard-caméra + point du visage),
   `videoEnd` (progression où le clip a fini de se dérouler), `mockupAt`, `payoff` (titre+body), `mockupVideoSrc` (ScreenStudio).
3. **Monter** dans `ExperienceClient.tsx` à sa place dans l'ordre §3, retirer la feature correspondante de `StickyFeatures` (pas de doublon).
4. **Vérifier** : typecheck, build (env Supabase placeholder si local), scroll réel en prod (le pane de test ne sait pas scroller avec Lenis — vérifier via DOM + prod).

## 5. Specs assets à demander à Chandler

- **Clips cinéma desktop** : 16:9, 4-6 s, 1080p suffit. « Basic quality » Mux OK.
- **Clips verticaux mobile** : 9:16 (1080×1920) — sinon le 16:9 est réutilisé letterboxé (déjà géré).
- **Captures ScreenStudio (mockup)** : ratio écran du PhoneFrame ≈ 9:19.5 (ex. 886×1920), MP4 muet, boucle propre.
- **Témoignages** : vidéo + timecodes des phrases fortes + **consentement signé** + sous-titres VTT (80 % regardent sans son).

## 6. Témoignages « même procédé » (à construire — spec prête)

Même squelette que CinematicSequence : vidéo témoin à droite (MuxPlayer cette fois — son + VTT),
phrases fortes à gauche par fenêtres de scroll, **clic sur une phrase = saut au timecode**
(`ref.currentTime = atSec` — préchager le chunk player à l'approche, autoplay muet puis
démute au geste, chip « Activer le son »). Étendre `Testimonial` avec `keyQuotes: {atSec, text}[]`
dans `src/components/zone/testimonials.data.ts`.

## 7. Pièges connus (payés une fois, ne pas repayer)

- `overflow-x-hidden` sur un ancêtre **tue** `position: sticky` → on utilise `overflow-x-clip` (déjà fait sur `<main>`).
- `useIsMobile()` démarre `false` 1 frame → toujours accepter un premier rendu desktop côté SSR.
- Lenis avale `window.scrollTo` programmatique dans certains contextes → tester le scrub à la molette réelle.
- `video.load()` reset `currentTime` → ne le faire qu'une fois (garde `loadedRef`).
- JAMAIS de setState par frame de scroll (MotionValues → style direct ; états discrets seulement).
- Le noindex de `page.tsx` : checklist de bascule écrite dedans — NE PAS l'oublier au passage en page principale.
- Légal : l'alerte contrôle = information communautaire type Waze (pas d'incitation à se soustraire) ;
  compta = « copilote / se calcule », jamais « on fait ta compta ».

## 8. Réglages fins en attente (Chandler doit voir le rendu)

- `SCENE.zoom` : fenêtre exacte du regard-caméra + origine (% x/y du visage dans le cadre).
- `SCENE.beats` : timing des titres vs le contenu réel du clip.
- La vitesse de la piste (h-[320vh] — plus grand = plus lent/cinéma, plus petit = plus nerveux).
