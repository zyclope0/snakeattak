# Bilan 0.40.0 — l'application rattrape le site (build 64)

Version préparée le 22 novembre 2026 : **0.40.0 / Android 64** (`package.json`,
`android/app/build.gradle` et `POLICY_APP` de la politique de confidentialité). La
construction signée est faite par Codex avec `npm run android:package`, selon
[ANDROID-BUILD-64.md](ANDROID-BUILD-64.md). Rien n'est envoyé à Google Play dans ce lot.

Le build 63 (0.39.0, commit `fb347dd`, 19 novembre) est celui des testeurs. Le site a reçu
depuis tout ce qui suit, au fil de ses publications (la dernière : n° 42, le 22 novembre) :
le build 64 remet l'application au niveau du site.

## Ce qui change pour l'enfant depuis le build 63

- **Le spinosaure**, allié inventé par le fils : dans la grande aventure dès la vague 8, avec
  sa voile et sa nage ([révision 7](BILAN-REVISION-7.md)). Le catalogue des alliés tient sur
  un téléphone avec ses onglets dans la ligne du titre.
- **L'aventure sans fin** : King Snake revient toutes les 12 vagues, un cadeau parmi trois
  après les vagues 4 et 8 et après chaque roi, un record par joueur, sans classement
  ([compte rendu](BILAN-MODE-INFINI.md)). La porte s'ouvre une fois King Snake battu dans la
  grande aventure.
- **La Grande Expédition** remplace le voyage : trois tableaux de cinq missions, des chemins à
  choisir, des haltes, le camp qui suit l'enfant, un défi du fils par étape
  ([compte rendu](BILAN-GRANDE-EXPEDITION.md)). Un voyage commencé avec le build 63 se finit.
  Le bouton qui refait le tirage des cadeaux dit « Tirer encore ».
- **Un allié ne reste plus collé à un rocher**, pour les nouvelles parties (secondes règles de
  chemin ; la difficulté mesurée ne change pas).
- **Sauvegardes plus sûres** (étape d'hygiène, [compte rendu](BILAN-HYGIENE-2026-11.md)) :
  une écriture refusée une fois n'arrête plus les sauvegardes de la séance ; un fichier
  illisible est mis de côté au lieu d'être remplacé ; un double appui ne prend plus un cadeau
  à l'aveugle ; un allié offert se pose toujours, même sous « La tirelire ».

Rien n'a été retiré, sauf le code du Voyage, que l'application n'affiche plus et ne lit plus.
Aucune publicité, aucun achat et aucun outil de mesure dans l'application ; aucune permission
ni SDK ajouté ; aucun appel réseau pendant le jeu.

## Sauvegardes et codes

- Le build 64 lit tout ce que le build 63 a écrit : étoiles, camps, codes de départ, fichiers
  familiaux, voyage en cours, joueurs. Une partie commencée garde ses règles ; seule une
  nouvelle grande aventure prend la révision 7 (code `AVENTURE-9-…`).
- Le fichier de sauvegarde familiale passe à la version 6 : il emporte aussi l'expédition, le
  voyage à finir et les records de l'aventure sans fin du joueur actif. Les anciens fichiers
  restent lisibles.
- Le build 63 ne lit pas un camp, un code ou un fichier familial écrit par le build 64
  (« autre version du jeu ») : mieux vaut que les testeurs mettent l'application à jour.

## La politique de confidentialité

L'application 0.39.0 montre encore la politique d'avant le 20 novembre. Le build 64 embarque
celle du site : la section « Test de l'application Android » (20 novembre) et le paragraphe
sur le fichier familial (22 novembre). Ce paragraphe nommait le seul build 63. Le parent a
approuvé le 22 novembre trois phrases qui rangent l'application 0.40.0 (build 64) avec le
site : même fichier familial, plus de code du Voyage. Ce qu'il dit de l'application 0.39.0
reste tant que des testeurs l'ont encore
(`tests/fixtures/fichier-familial-approuve-build-64-2026-11-22.json`). Ce texte est aussi
celui du site dès sa prochaine publication.

## Vérifié (sur `main`, avant construction)

- `npm run verify` : format, types, tests, build et budgets verts.
- `npm run build:android` : `dist-android/` construit ; ses contrôles automatiques passent
  (aucune page du site, aucune adresse de paiement, publicité éteinte).
- Mise à jour par-dessus les données du build 63, dans un navigateur
  (`npm run test:saves:update`, tâche « sauvegardes » de la CI) : la mission gagnée,
  l'aventure et le voyage en cours et le deuxième joueur se relisent et continuent.
- Fichier familial, fermeture forcée et doubles appuis : recettes vertes dans la même tâche.
- Les huit lignes de la CI sur chaque PR de code fusionnée.

## Pas vérifié

- **Rien sur un vrai téléphone.** L'installation du build 64 par-dessus le build 63 (APK sur
  APK, signature de Google Play) ne se joue que sur un appareil : c'est la première case de
  la recette de [ANDROID-BUILD-64.md](ANDROID-BUILD-64.md).
- La recette native du build 63 n'a jamais été remplie ; seule celle du build 62, sur
  émulateur, est faite.
- Fluidité et mémoire réelles, navigation par gestes, bouton « retour ».
- Rien n'a été joué par les enfants dans l'application, à notre connaissance : ni
  l'expédition, ni l'aventure sans fin, ni le spinosaure.

## Notes de version proposées pour Google Play

À relire par le parent avant de les coller dans la Play Console.

```text
<fr-FR>
Nouveau : La Grande Expédition, un long voyage en trois tableaux avec des chemins à choisir et des haltes. L'aventure sans fin, où King Snake revient toujours plus fort. Le spinosaure, nouvel allié inventé par un enfant. Tes alliés ne restent plus coincés contre un rocher. Tes sauvegardes sont conservées.
</fr-FR>
<en-US>
New: the Great Expedition, a long journey across three lands with paths to choose and stops along the way. The endless adventure, where King Snake keeps coming back stronger. The spinosaurus, a new ally invented by a child. Your allies no longer get stuck against a rock. Your saves are kept.
</en-US>
```
