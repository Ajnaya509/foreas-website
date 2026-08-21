# Pourquoi `vercel.json` déclare la région `cdg1`

**21/08/2026.** Le site affichait « conçu et hébergé en Europe ». C'était **faux
pour tout le côté serveur**.

Mesuré sur l'en-tête `x-vercel-id` de la production :

| Route | Avant |
|---|---|
| `/api/mesure` | `cdg1::iad1` |
| `/api/checkout` | `cdg1::iad1` |
| `/api/track-landing` | `cdg1::iad1` |
| `/api/ajnaya/chat` | `cdg1::iad1` |
| `/cap` (rendu serveur) | `cdg1::iad1` |

`cdg1` = Paris. `iad1` = Washington. **Entrée à Paris, exécution à Washington** :
la caisse, la mesure et les conversations avec Ajnaya traversaient l'Atlantique.

Aucune région n'était déclarée nulle part. C'était la **valeur par défaut du
compte**, pas une décision — et une valeur par défaut est indiscernable d'un
choix tant que personne ne la mesure.

Deux effets, pas un :

1. la phrase du site devient vraie ;
2. la latence annoncée cesse de payer un aller-retour transatlantique à chaque
   appel.

⚠️ **Ce n'est pas une garantie contractuelle.** Si Vercel n'a plus de capacité à
Paris, il bascule ailleurs. C'est pourquoi la phrase du site dit désormais
« conçu en France, servi depuis Paris » et non « hébergé en Europe » : une
formulation modeste reste vraie le jour d'un basculement.

---

## ⚠️ Pourquoi cette explication vit ICI et pas dans `vercel.json`

Une première version l'avait écrite **dans le fichier lui-même**, sous une clé
`_pourquoi_regions`.

Vercel refuse les clés qu'il ne connaît pas. Résultat : **quatre mises en ligne
ont échoué**, et la production est restée figée sur l'ancienne version pendant
plus d'une heure.

Le plus coûteux n'est pas l'échec — c'est qu'**il n'a laissé aucune trace du côté
du dépôt** :

- `git push` a réussi ;
- `npm run build` passait en local ;
- tous les contrôles étaient verts ;
- et rien, absolument rien, ne disait que le site en ligne n'avait pas bougé.

Ça n'a été découvert qu'en **mesurant la production** après coup : l'en-tête
`age` de la page d'accueil grandissait sans jamais se réinitialiser. Un cache qui
vieillit indéfiniment est la signature d'un déploiement qui n'arrive pas.

**Un fichier de configuration n'est pas un endroit où expliquer.** L'explication
va dans un document ; la configuration ne contient que ce que l'outil comprend.
