# Ajnaya — Architecture Cross-Canal FOREAS

*Version 21 avril 2026 — après Sprint 9*

**Règle d'or** : il y a **UNE SEULE AJNAYA**, elle est partout, elle se souvient de toi peu importe la porte d'entrée.

---

## 🚪 Les 10 portes d'entrée Ajnaya

| # | Canal | Statut | Qui répond | Voix / Format |
|---|---|---|---|---|
| 1 | **WhatsApp** (num pro Ajnaya) | ✅ Prod | Pieuvre N8N Responder | Koraly v3.6 vocal OGG+voice:true |
| 2 | **App mobile** (chat Ajnaya, ComptabiliteScreen, AjnayaScreen) | ✅ Prod | Backend Railway (`foreas-ai-backend`) | Koraly TTS via `/api/ajnaya/tts` |
| 3 | **Widget site** (foreas.xyz bottom-right bubble) | ✅ Prod | Pieuvre via `widget_conversations` (29 rows) | Texte (+ TTS Koraly si activé) |
| 4 | **Coach Réflexe in-overlay** (overlay Android v99 sur Uber) | ✅ Prod | Railway `/api/coach/instant-decision` | Verdict visuel (pas vocal, UX 2s) |
| 5 | **Dashboard partenaires** (foreas-partners — si activé) | ⚠️ Partiel | Pieuvre (pas encore câblé) | Texte |
| 6 | **Email inbound** (contact@foreas.net) | ⚠️ Dev | Pieuvre Finder/email tentacle | Réponse email texte |
| 7 | **Instagram DM** | ❌ Pas encore | — | — |
| 8 | **Facebook Messenger** | ❌ Pas encore | — | — |
| 9 | **SMS** (Twilio ou autre) | ❌ Pas encore | — | — |
| 10 | **Appels voix** (Twilio Voice + IVR Ajnaya) | ❌ Pas encore | — | — |

**Pour toi (DG)** : entrée privée sur **Telegram** pour reporting interne, tâches, commandes — c'est un canal admin, pas un canal client.

---

## 🧠 Comment Ajnaya répond (pipeline simplifié)

```
                 ┌──────────────────────┐
                 │  10 PORTES D'ENTRÉE  │
                 │  (WhatsApp, App,     │
                 │   widget, email...)  │
                 └──────────┬───────────┘
                            │ message inbound
                            ▼
                 ┌──────────────────────┐
                 │   BRIDGE INBOUND     │
                 │   (N8N / Railway)    │
                 │   - dédup svix-id    │
                 │   - identify user    │
                 │     via phone/email  │
                 │   - route classifier │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │   IDENTITY BRIDGE    │          ← "c'est le même chauffeur
                 │   (Supabase table)   │            sur WhatsApp + app + site"
                 │   user_type +        │
                 │   xyz_member_id +    │
                 │   driver_id          │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │   CANAL MEMORY       │          ← "elle a déjà dit ça hier
                 │   (Supabase table)   │            sur l'app, pas besoin
                 │   context_key +      │            de répéter sur WhatsApp"
                 │   context_value jsonb│
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────────────┐
                 │   COMPOSE LLM INPUT          │
                 │   (Responder N8N principal)  │
                 │   Assemble :                 │
                 │   - historique conversation  │
                 │   - feature catalog          │
                 │   - objection playbook       │
                 │   - prompt v3.6 voice + M18  │
                 │     + guardrail légal        │
                 └──────────┬───────────────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │   ROUTE LLM CHOICE   │
                 │   Haiku 4.5 : court  │
                 │   Sonnet 4.6 : vocal │
                 │   Opus 4.7 : complexe│
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │   FORMAT ROUTER      │
                 │   voice / text /     │
                 │   snapshot / video   │
                 └──────────┬───────────┘
                            │
         ┌──────────────────┼───────────────────┐
         ▼                  ▼                   ▼
   WhatsApp vocal     In-app push        Site widget texte
   (Koraly OGG+       (pieuvre_in_       (widget_conversations)
    voice:true)        app_messages)

                            │
                            ▼
                 ┌──────────────────────┐
                 │   LOG                │          ← "on trace tout
                 │   workflow_logs +    │            pour apprendre"
                 │   ajnaya_conversations│
                 └──────────────────────┘
```

---

## 🐙 Les tentacules (tentacles) Pieuvre actives

Liste des workflows N8N qui portent un bout d'Ajnaya en prod :

### Core (le cerveau)
- `U9oQycTltqhDHyWm` — **`_utils_ajnaya_respond`** — le Responder principal (Compose LLM Input + v3.6 + M18 + guardrail légal)
- `SPtRINQimEEhFHtg` — **`_utils_ajnaya_send_cross_canal`** — unifie envoi Koraly + mirror in-app + anti-collision Coach Réflexe + dedup canal_memory + logs
- `3wriCPhsRP12JhI4` — `_utils_whatsapp_send_voice` (utilitaire vocal OGG+voice:true)

### Entrées (les yeux/oreilles)
- `A4BbZtwTDz1w8oa8` — **Bridge Proactive Outreach** (every 15min, outreach intelligent)
- Widget site → API backend → `pieuvre_conversations` + `widget_conversations`
- Webhook `/whatsapp-inbound` → Responder

### Moments programmés (les réflexes)
- `pms76bbAOcc8calo` — **M10 Morning Briefing** (cron 7h)
- `siDccJS5adkp02Xq` — **M13 Good Day Reinforcement** (cron 20h filter ≥ avg)
- `7Q57gHNI731DslTo` — **M14 Bad Day Recovery** (cron 20h filter < 50%)
- `rLALtxmKrJ4bjvIu` — **M15 Weekly Coach** (cron dim 19h)
- `QcCR7bb3kWGsMSnl` — **M17 Sentinel Pre-Churn** (cron 10h détecte 3j+ silence)

### Intelligence / apprentissage (le cortex)
- `lKJ1SlvLcQmjrSeA` — Sentinel Weekly Churn Scoring (cron lundi 3h)
- `drftjJx99IyrbgB8` — Reflexes Driver Action Router
- `OojeUKpD27DyC4rC` — Cross Weekly Intelligence Report
- `8OdSBbgIGpbRzjBX` — Cross Churn Enrichment
- `3VFSpIywaP8zBPtq` — CRM Weekly Enrichment

### Génération média (la voix + l'image)
- **Remotion renderer** (VPS docker, port 3200) — TTS Koraly OGG + génération vidéos + snapshots Mapbox
- **Backend Railway** (`foreas-ai-backend-production.up.railway.app`) — STT Whisper + chat OpenAI + TTS ElevenLabs proxy pour l'app

---

## 🎯 Règles invisibles mais critiques

### Anti-collision Coach Réflexe (v99)
Quand l'app affiche un verdict overlay (courses Uber acceptées/refusées), Ajnaya WhatsApp se tait pendant **5 minutes**. Raison : le chauffeur vient d'être sollicité via l'app, on ne lui balance pas un vocal en même temps. Implémenté dans `_utils_ajnaya_send_cross_canal` via `pieuvre_reflexes_executions.started_at` check.

### Dédup canal_memory
Si Ajnaya a déjà dit le même "moment" (M10/M13/...) au même chauffeur dans les **20 dernières heures**, elle ne le redit pas même si un autre canal essaie. Implémenté dans `_utils_ajnaya_send_cross_canal` via `canal_memory.context_key='last_moment'` check.

### Mirror automatique cross-canal
Quand Ajnaya envoie un vocal WhatsApp, elle crée en parallèle une ligne dans `pieuvre_in_app_messages`. Si le chauffeur ouvre l'app, il voit le même message — pas de duplication, juste de la continuité.

### Guardrail légal (M18)
Ajnaya ne dira **JAMAIS** "je suis ta comptable", "je fais ta compta", "je signe tes déclarations". Elle dit "copilote compta", "assistant de gestion", et **redirige vers expert-comptable partenaire** pour tout besoin certification.

### Opt-out respecté
Si un chauffeur écrit "STOP" → `identity_bridge.opted_out = true` → plus aucun vocal proactif. Géré dans Bridge Inbound Classifier.

---

## ⚠️ Est-ce 100/100 ? Non — 82/100 honnête

### Points forts (ce qui marche)
- ✅ Une voix unique Koraly (après patch Sprint 9)
- ✅ Un prompt unique v3.6 + M18 + guardrail légal
- ✅ Anti-collision Coach Réflexe câblée
- ✅ Dédup canal_memory active
- ✅ Mirror in-app automatique
- ✅ 5 moments réactifs (M10/M13/M14/M15/M17) + M18 reactif
- ✅ Logs `pieuvre_workflow_logs` (1973+ rows — on voit tout)
- ✅ identity_bridge cross-canal (4 chauffeurs unifiés)

### Gaps (ce qui manque pour aller à 100/100)
- ❌ **Instagram DM / Facebook Messenger / SMS / Voice** pas branchés → 4 portes d'entrée fermées
- ⚠️ **Dashboard partenaires** existe mais Ajnaya pas encore câblée dedans
- ⚠️ **Email inbound** (`contact@foreas.net`) → traité par Finder mais pas par Ajnaya directement
- ⚠️ **Identity Bridge n'a que 4 rows** → beaucoup de chauffeurs ne sont pas encore "unifiés" cross-canal (le bridge ne s'auto-remplit que sur certains events)
- ⚠️ **Pas de monitoring dashboard temps réel** → tu dois lire `workflow_logs` pour voir l'état
- ⚠️ **Pas de fallback si Railway backend down** → l'app n'a plus de voix (pas de stockage local TTS)
- ⚠️ **Pas de "Ajnaya Omniscience" (web_search + RAG growing)** → elle dit encore "je sais pas" sur les questions hors catalogue. Prévu Sprint 11.
- ⚠️ **Pas d'unité de test end-to-end** des moments → les bugs peuvent passer en prod
- ⚠️ **Pas de "dégradé gracieux"** si LLM API down → 500 error, pas de réponse fallback

### Pour passer à 95/100 (Sprint 10-11)
1. Brancher Instagram DM (Meta Business API, même infra que WhatsApp)
2. Brancher Facebook Messenger (idem)
3. Brancher Ajnaya dans le dashboard partenaires
4. Auto-filler `identity_bridge` sur chaque first-touch cross-canal
5. Monitoring dashboard en ligne (Grafana ou page N8N stats) accessible à toi
6. Fallback TTS local (pre-recorded short phrases) si Railway down
7. **Ajnaya Omniscience** : web_search natif Claude + RAG growing dans `knowledge_documents`

### Pour 100/100 (Sprint 12-13)
- Voice inbound (Twilio Voice IVR Ajnaya)
- SMS inbound (même architecture)
- Contrats de stabilité inter-tentacules (versioning API interne)
- Chaos testing (kill n'importe quelle tentacule → système dégrade gracieusement)

---

## 🧩 Résumé en 5 phrases

1. **Peu importe par où un chauffeur parle à Ajnaya** (WhatsApp, app, widget site, overlay Uber), c'est **la même Ajnaya** qui le reconnaît, avec **la même voix Koraly** et **la même mémoire** conversationnelle.
2. **Une seule tentacule centrale (`_utils_ajnaya_respond`)** compose la réponse en consultant l'historique, le feature catalog, les règles d'objection, et le prompt v3.6 + M18 admin.
3. **Une seule tentacule d'envoi (`_utils_ajnaya_send_cross_canal`)** vérifie qu'elle ne spamme pas (anti-collision + dédup), envoie sur le bon canal, mirror sur les autres, et log.
4. **Les moments programmés (M10/M13/M14/M15/M17)** se déclenchent sur des triggers intelligents (matin, soir performance, dimanche bilan, silence 3 jours), pas sur du cron aveugle.
5. **Le système est à 82/100** — solide sur les 3 canaux majeurs (WhatsApp/app/widget), mais 4 portes d'entrée supplémentaires restent à brancher pour atteindre l'omnipresence réelle.

---

*Document maintenu par — FOREAS Labs · à relire après chaque Sprint qui touche à Ajnaya*
