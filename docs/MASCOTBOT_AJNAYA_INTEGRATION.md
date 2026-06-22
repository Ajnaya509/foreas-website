# Ajnaya mascotte animée — intégration MascotBot (plomberie prête)

> But : remplacer l'orbe "A" du widget par une **Ajnaya animée** (idle → sort de la bulle →
> coucou, téléphone en main → bouge les lèvres quand elle parle), pilotée par une state machine Rive.
>
> Techno : **MascotBot** (SDK React au-dessus de Rive) + **lip-sync sur la voix Koraly** qu'on a déjà.
> Source de vérité : https://docs.mascot.bot/libraries/react-sdk · exemple officiel `mascotbot/elevenlabs-avatar`.

## ⚠️ Ce que Claude NE peut PAS faire (à toi)
1. **Créer le compte MascotBot + payer l'abo** (Starter 49 $/mois … Launch 99 $/mois). Le SDK vit sur un
   **registre privé** (`npm.mascot.bot`) / `.tgz` livré après abonnement — impossible à installer sans le compte.
2. **Récupérer la clé** `MASCOT_BOT_API_KEY`.
3. **Faire designer + rigger l'avatar Ajnaya** en `.riv` (via l'avatar maker MascotBot, ou leur service Joyrive).
   Le `.riv` doit exposer 2 inputs de state machine : `is_speaking` (booléen, lip-sync) et `gesture` (trigger : coucou/sort).

## ✅ Ce que Claude fait (tout le reste) — déjà préparé
- Composant `src/components/ajnaya-mascot/AjnayaMascot.tsx` : **inerte tant que `NEXT_PUBLIC_MASCOTBOT_ENABLED` ≠ "1"**
  (donc zéro impact prod aujourd'hui). Contient le code d'intégration réel en template, prêt à décommenter.
- Le point de bascule dans `AjnayaWidget` (1 ligne, documentée ci-dessous).
- Le branchement **Koraly** : on réutilise l'audio TTS que le widget joue déjà (état `isAudioPlaying`) → pas de clé
  ElevenLabs côté client (respecte la règle FOREAS / `AJNAYA_NORTH_STAR`).

## Étapes le jour où tu as le compte + le `.riv`

### 1. Installer le SDK (après abonnement)
```bash
# Option .tgz (livré par MascotBot) — à la racine du repo
npm install ./mascotbot-sdk-react-0.1.x.tgz
# peer deps Rive (uniquement si on rend un avatar)
npm install @rive-app/react-webgl2 @rive-app/webgl2
```

### 2. Env (Vercel + .env.local)
```env
NEXT_PUBLIC_MASCOTBOT_ENABLED=1
MASCOT_BOT_API_KEY=...        # côté serveur (ne PAS préfixer NEXT_PUBLIC_)
```
> ⚠️ Pas de `ELEVENLABS_API_KEY` côté client. L'audio vient de `POST /api/ajnaya/tts` (Railway, voix Koraly
> `MNKK2Wl2wbbsEPQTHZGt`). On envoie ce flux audio au lip-sync MascotBot en **audio manuel** (`useProcessAudio` /
> `useLipsyncStream`), PAS via l'agent ElevenLabs.

### 3. Poser l'avatar
`public/ajnaya-mascot.riv` (le fichier riggé livré par l'artiste / l'avatar maker).

### 4. Activer le code (dans `AjnayaMascot.tsx`)
Décommenter le bloc template (imports `@mascotbot/react` + `@mascotbot/react/rive`) et retirer le `return null` du mode inerte.

### 5. Brancher dans le widget (`src/components/AjnayaWidget.tsx`)
Dans le bloc de l'orbe (`{!isOpen && isScrolledPastHero && !anyOverlayOpen && (`), remplacer le `<button>` orbe par :
```tsx
{process.env.NEXT_PUBLIC_MASCOTBOT_ENABLED === '1'
  ? <AjnayaMascot onOpen={() => setIsOpen(true)} speaking={isAudioPlaying} />
  : (/* orbe actuelle, fallback */)}
```
→ on garde l'orbe en fallback si la mascotte est désactivée. Zéro régression.

## Le code d'intégration (template, dans AjnayaMascot.tsx)
```tsx
// import { MascotProvider, useProcessAudio, useMascotInputs } from '@mascotbot/react'
// import { Mascot, Fit, Alignment } from '@mascotbot/react/rive'
//
// <MascotProvider apiKey={process.env.NEXT_PUBLIC_MASCOTBOT_API_KEY!}>
//   <Mascot src="/ajnaya-mascot.riv" stateMachine="Ajnaya" fit={Fit.Contain} alignment={Alignment.BottomCenter} />
// </MascotProvider>
//
// // lip-sync : pousser l'audio Koraly (blob/MediaStream déjà joué par lib/tts.ts) dans useProcessAudio
// // gestes : useMascotInputs() → input booléen `is_speaking` = props.speaking ; trigger `gesture` au scroll/idle
```

## Inputs Rive attendus dans le `.riv` (à briefer à l'artiste)
| Input | Type | Rôle |
|---|---|---|
| `is_speaking` | booléen | lèvres qui bougent quand Koraly parle (= `isAudioPlaying`) |
| `gesture` | trigger | coucou de la main / "viens" |
| `emerge` | trigger | sort de la bulle (plus grande) après inactivité |
| `mood` (option) | number | expressions (neutre/sourire/clin d'œil) |

## Coût / décision
- MascotBot : 49–99 $/mois selon trafic. + design `.riv` (avatar maker inclus, ou Joyrive sur-mesure).
- Alternative réaliste (femme qui parle, mais buste figé, pas de "sort de la bulle") : HeyGen LiveAvatar (payé à la minute).
