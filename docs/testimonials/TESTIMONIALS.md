# 🎬 TESTIMONIALS FOREAS — Catalogue vidéos chauffeurs

> **Source de vérité unique** pour les 6 témoignages vidéo Mux.
> Chandler remplit · Claude lit ce fichier pour générer `TestimonialVideoCard` + alimenter le copy.
>
> **Mis à jour le** : _à compléter_
> **Hébergement** : Mux (organization Chandler)
> **Format URL Mux Player** : `https://stream.mux.com/{PLAYBACK_ID}.m3u8`
> **Format URL thumbnail** : `https://image.mux.com/{PLAYBACK_ID}/thumbnail.jpg?time={SEC}`

---

## 📋 INSTRUCTIONS POUR REMPLIR

Pour chaque vidéo (6 au total), remplis un bloc ci-dessous. Tout ce qui est entre `[crochets]` est à remplacer.

**Champs obligatoires** (sans eux je peux rien faire) :
- `playback_id` — copié depuis le dashboard Mux (asset → Playback ID)
- `name` — prénom + initiale (ex: Haitham B.)
- Au moins **3 phrases-clés** avec timestamps

**Champs recommandés** (rendent le résultat +100/100) :
- `poster_time_sec` — timestamp du frame qu'on met en thumbnail (où le chauffeur sourit, regarde caméra)
- `teaser_range` — 8-15 sec à découper pour un loop muet hero
- `mood_tags` — humeur dominante (calme, ambitieux, drôle, ému)
- `key_emotion` — l'émotion principale qui doit ressortir

**Note** : si tu ne sais pas un timestamp précis, mets `[?]` et je m'arrangerai. Si tu veux ajouter une note libre, utilise le bloc `notes`.

---

## 🎯 BIG DOMINO RAPPEL (Option C validée)

> **« 247 chauffeurs FOREAS savent où aller ce soir.**
> **Vous, vous tâtonnez encore ? »**
>
> sub-line crédibilité : _Données réelles · S18 · 51 zones couvertes_

Les vidéos témoignages doivent **renforcer** ce Big Domino, pas le concurrencer. Donc :
- **Hero crème** : pas de vidéo (uniquement la barre de recherche + le slogan)
- **Section Big Domino** (zone de transition crème → noir) : 1 vidéo TEASER muette en loop subtil derrière le titre (Haitham probablement)
- **Section Social Proof** : les 6 vidéos en cards (Haitham + Binate + 4 autres)
- **Modal Ajnaya** : Ajnaya peut envoyer la vidéo full d'Haitham/Binate sur WhatsApp comme bénéfice

---

## 🎥 VIDÉO 1 — HAITHAM (validé pour Big Domino)

```yaml
playback_id: 8nSxSV4hNxSuC8muZ02djVGZVFh3SgeybyCnfbAJ801r00
mux_asset_id: A01xv6vnjzy7W2cYNFJLXZu9g4mRUbvdqYKyf9CulHRU

name: "Haitham B."
city: "Paris"
ancienneté: 7 ans
profil: "Chauffeur indépendant maghrébin · pivot identification persona"

duration_sec: [? — durée totale en secondes]

# Frame thumbnail (où le chauffeur sourit / regarde caméra direct)
poster_time_sec: [? — ex: 14 si à 14 sec il a un beau plan]

# Loop muet teaser (8-15 sec) pour Big Domino background
teaser_range:
  start_sec: [?]
  end_sec: [?]
  caption: "Quel moment exact ?"

# Mood
mood_tags: ["chaleur", "calme", "lien humain"]
key_emotion: "Reconnaissance — il se sent moins seul depuis FOREAS"
```

### Phrases-clés avec timestamps

```
[mm:ss] "« phrase exacte qu'il dit »"
[mm:ss] "« autre phrase »"
[mm:ss] "« 3ème phrase »"
```

Exemple format :
```
[0:23] "Le truc le plus dur dans ce métier, c'est de pas se sentir seul."
[1:14] "FOREAS m'a redonné ce lien."
[2:08] "Aujourd'hui j'ai une équipe — même si je suis indépendant."
```

### Retranscription écrite complète (résumé OK, pas mot-pour-mot obligatoire)

Alors la société Foreas, c'est une société qui m'aide beaucoup à me concentrer sur sur mon boulot à 100 % et d'avoir une liberté dans ma vie de tous les jours quand on a besoin de de quoi que ce soit, on a une réponse instantanément donc c'est c'est bien. Je me vois encore avec la société Foreas pendant un long moment.

### Notes pour Claude

> _Dis-moi ici toute info utile : ton à utiliser, sujet à éviter, point fort à amplifier dans le copy, etc._

---

## 🎥 VIDÉO 2 — BINATE (validé pour Big Domino chiffres)

```yaml
playback_id: i9Bm4N9eyzCeQN1Ku7wutBb9yj7nUtr1pSrGJYQBfKI
mux_asset_id: 6nQGxaDK00IFLHD39mhm0042qxb00RO8D4FKuL01cqv00Zo8
name: "Binate A."
city: "Paris"
ancienneté: "[?]"
profil: "Chauffeur Tesla · clientèle privée développée · profil aspirationnel"
véhicule: "Tesla [modèle ?]"

duration_sec: [?]

poster_time_sec: [? — frame où il est devant/dans la Tesla idéalement]

teaser_range:
  start_sec: [?]
  end_sec: [?]
  caption: "Plan Tesla en mouvement ou phrase chiffrée"

mood_tags: ["ambition", "fierté", "concrétisation"]
key_emotion: "Aspirationnel — il a réussi grâce à FOREAS, le user veut être lui"
```


### Retranscription écrite complète

>

Bonjour, ici monsieur Binaté, je suis chauffeur VTC depuis cinq ans. Je travaille dans la zone de Mande La Vallée, chez Disneyland. Avant Foreas, j'ai travaillé à faire douze heures, treize heures, voire même quatorze heures par jour.

Sauf que je n'avais pas les les revenus qu'il fallait. Aujourd'hui tout a changé. Depuis le rattachement avec Foreas m'a permis de développer ma clientèle entre Disneyland et Beauvais et les zones touristiques.

J'ai vu des interventions de certains collègues du VTC qui m'ont qui m'en ont parlé donc euh j'étudie la situation. Et je suis venu vers eux. Heureusement d'ailleurs depuis que je suis avec eux, il y a eu un grand changement quoi.

Forias m'a donné les outils pour maximiser mes revenus. Mes revenus sont sont montés de 30 %. Au lieu de dire juste je gagne rien. Surtout quand on va au taux de VTC en sur l'île Défense, c'est pas évident quoi.

travaille pas des heures infinies comme dans le temps. Travaille moins pour avoir plus. C'est ça la différence.

Donc c'est une stabilité, pour moi c'est une stabilité financière quoi. Et ce grâce à Foria.

Si vous voulez sauver votre VTC et que vous voulez transformer votre activité, je vous recommande de venir vivement vous rattacher à Forest. Parce que depuis que je suis avec eux, ça a transformé mes activités positivement. Donc je voulais le recommander vivement.

### Notes pour Claude

> _Important : il est dans une Tesla — on peut faire des plans très cinéma. Profil aspirationnel = à mettre en avant dans Big Domino + section social proof + bonus WhatsApp Ajnaya._

---

## 🎥 VIDÉO 3 — Zephy Kitenge 

```yaml
playback_id: vX1Hg6jKGiFpSJvQW900FrKMrDIfhxHQgxCGYAD3wjEY
mux_asset_id: X64eWdtN87Nv6kw01YnsOMJIEy00jjG02FhjcXRk9v01yZ4

name: Zephy Kitenge
city: Marne-la-Vallée
ancienneté: Plusieurs années
profil: Homme noir origine congolaise, 40 ans, légér accent, s'exprime très bien

duration_sec: 14à seconde environ



### Retranscription écrite complète


Bonjour, je suis monsieur Zefi Kitenge, chauffeur VTC depuis plusieurs années. Aujourd'hui, membre du réseau FOREAS. Alors, pourquoi avoir choisi de faire le métier de VTC ? C'est d'abord l'indépendance, puisque avant j'étais cadre dans une grosse boîte ici à Paris. Mais je n'avais pas la gestion de mon temps comme je le voulais. Il y avait une pression telle qu'il fallait des résultats, des résultats à chaque fois. Je n'en pouvais plus. Il me fallait un métier où je pouvais gérer moi-même mon timing et je l'ai trouvé dans le VTC. Je gère moi-même mon temps comme je le veux, je commence quand je le veux. Et j'arrête quand je veux. Ça, c'est génial. Aussi, je garde ce que je veux, quand je veux. Très avantageux de travailler dans la zone Disneyland, puisque c'est une zone que je connais.

Je vis ici depuis des années. Je connais presque tous les hôtels qui sont autour de Disney. C'est plus facile pour moi de me rendre rapidement, étant encore près de mes clients, pour la prise en charge rapide. Vraiment, j'estime que je suis l'un des chauffeurs les plus heureux d'être dans cette zone de Disneyland. Franchement, c'est hyper intéressant, hyper avantageux pour moi dans le cadre de mon travail. Ce que je compte offrir à mes clients, c'est d'abord le service haut de gamme, leur offrir la convivialité, l'avénance, être avénant, être à l'écoute, être à leur service, prendre soin de chaque point, puisque pour moi, chaque point, c'était l'engagement que je donnerais avec beaucoup de passion. C'est un métier qui me plaît. Donc je compte vraiment continuer à offrir à mes clients le confort, la ponctualité, la discrétion. La régularité, et voilà. Surtout cette marque de confort. On essaie de travailler toujours, tout le jour, pour offrir plus de confort à nos clients, puisque c'est important. Faire une course, ce n'est pas que le trajet, ce n'est pas que de prendre le passager d'un point A à un point B. Ce ne sont pas des marchandises, ce sont des humains. Donc, ils ont besoin de l'attention et de tout ce que je viens d'énumérer, il y a quelques secondes.

### Notes pour Claude

>

---

## 🎥 VIDÉO 4 — témoignage de Dragan Petrovic
```yaml
playback_id: SeKV8Lpn7H2XhfYF1oKO54zP008A3Dv4qPuCKizybyA4
mux_asset_id: VbJPdHPYe02GzXimwVnRo4Ttdj00y4ceZS4oxnxkpf9T4

name: Dragan Petrovic
city: Paris
ancienneté: 9 ans 
profil: Europe de l'est, 49ans , parle très bien français, chauve, costume


### Retranscription écrite complète

>Société Foreas, c'est une société sérieuse où il n'y a aucun souci. Pour le moment, je vois que du positif, tout se passe pour le mieux, il n'y a aucun problème de paiement. Rassurez-vous, c'est surtout ça. Ça fait plus de deux ans que je côtoie la société Foreas et que je n'ai aucun problème de paiement. Tout se passe pour le mieux. Oui, je me sens très à l'aise. Aucun souci, tout se passe pour le mieux. Ce qui est le plus important, c'est d'être payé. Pour ça, c'est le prix mondial. Il n'y a aucun souci de paiement. J'y suis, j'y reste.

### Notes pour Claude

>

---

## 🎥 VIDÉO 5 — [PRÉNOM]

```yaml
playback_id: tjnuX01n9h01GfOA501C02a9lIVVbGnib02Z017POgodDpfj4
mux_asset_id: YYMmJsmfWYqhSB2wylK7Tr3IDOrEqMhXE015O02uCttgA

name: Hadietou
city: Paris
ancienneté: 9ans
profil: Homme noir, originaire de la banlieue parisienne, 35ans, beaucoup de euh... blanc etc...



### Retranscription écrite complète

> La société Foreas représente un confort et un futur pour moi. Je suis sur le statut indépendant et j'ai vu que la société Foerias proposait salariats. Je mettrais bien des amis proches s'ils veulent se lancer dans une société comme Forerace. Je pense qu'ils auront plus de confort. La société Foreas envoie des virements ponctuels tous les mercredis, ce qui rassure tous les chauffeurs. Et quand j'envoie des mails à la société, on me répond dans les 24 heures qui suivent.

### Notes pour Claude

>

---

## 🎥 VIDÉO 6 — [PRÉNOM]

```yaml
playback_id: 6PbitAE7sjbgTlMsdjI7EYJ01OsX9GnBbQNvj1TFhsow
mux_asset_id: uoJMU5tY5JoLokZN5xjOGAZX4lvWtBxoQBgkW02ub3vQ

name: Nikolic Nebojsa
city: Paris
ancienneté: 10 ans
profil: Europe de l'est, 52 ans, difficulté a parler correctement, en costume 



### Retranscription écrite complète

> La société foreas, ça fait depuis deux ans que je suis rattaché. Pourquoi ? Parce que c'est une société sérieuse. Pour les chauffeurs VTC, les points positifs, en numéro 1, je dirais que, pour les chauffeurs, on a notre virement qui est hum. Une fois par semaine qui est ponctuelle. Et qu'on n'a pas de soucis au niveau de j'échange énormément et quand on est soit dans le besoin ou soit dans une explication qu'on ne comprend pas, ils sont là à nos écoutes.

### Notes pour Claude

> ATTENTION IL PARLE DE RATTACHEMENT, les chauffeurs DETESTENT le rattachement !!!

---

## 🎯 SYNTHÈSE — quand toutes les vidéos sont remplies

### Ranking par usage

À remplir une fois les 6 vidéos documentées :

1. **Hero / Big Domino loop muet** : `[Haitham par défaut]` — teaser 8-15 sec
2. **Card primary social proof** : `[Haitham — relation humaine]`
3. **Card secondary** : `[Binate — chiffres + Tesla]`
4. **3 cards complémentaires** (variété ville/profil) : `[#3, #4, #5]`
5. **Bonus WhatsApp Ajnaya** : `[Binate version full 3 min]` — envoi par Ajnaya en récompense du push numéro

### Phrases-clés transverses à exploiter dans le copy hors vidéos

> _Une fois toutes les retranscriptions remplies, je listerai ici les expressions fortes
> qu'on pourra réutiliser dans le copy de la nouvelle home (sections, CTAs, micro-copy modal Ajnaya)._

---

## ✅ CHECKLIST AVANT INTÉGRATION

- [ ] Les 6 `playback_id` sont remplis
- [ ] Les 6 `mux asset policy = public` (vérifié dashboard Mux)
- [ ] Au moins 3 phrases-clés par vidéo
- [ ] Au moins une retranscription complète pour Haitham + Binate
- [ ] Décision Big Domino loop : Haitham confirmé OU autre ?
- [ ] Vidéos prêtes à streamer (status Mux = "ready")
- [ ] Ce fichier est sauvegardé (Cmd+S)

Quand cette checklist est validée → tu me dis "GO TESTIMONIALS" et je :
1. Lance le script Mux pour vérifier les IDs
2. Génère le composant `TestimonialVideoCard` avec data hardcodée
3. Branche le `MuxPlayer` partout (cards + modal Ajnaya + Big Domino loop)
4. Synchronise le copy avec les phrases-clés que tu as données
5. Build + test + push

---

## 📚 RÉFÉRENCES

- Mux Dashboard : https://dashboard.mux.com/
- Mux Player React docs : https://docs.mux.com/guides/play-your-videos
- Spec home v1 : `/Users/chandlermilien/FOREAS-SHARED/HOME_HERO_SEARCH_v1_SPEC.md`
- Skill copywriting : `~/.claude/skills/foreas-copy-atomic/SKILL.md`
- Skill design : `~/.claude/skills/foreas-design-system/SKILL.md`
