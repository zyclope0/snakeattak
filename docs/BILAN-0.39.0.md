# Bilan 0.39.0 — l’application au niveau du site (build 63)

Version préparée le 19 novembre 2026 : **0.39.0 / Android 63** (`package.json`,
`android/app/build.gradle` et `POLICY_APP` de la politique de confidentialité). La construction signée est prise en charge par Codex via `npm run android:package`,
selon [ANDROID-BUILD-63.md](ANDROID-BUILD-63.md). Les livrables et leur statut exact
sont identifiés dans `release-report.json` : la construction ne vaut pas qualification
native. Rien n’est envoyé à Google Play dans ce lot.

Le build 62 (0.38.0, 15 novembre) a été construit avant tous les lots ci-dessous. Le site,
lui, les a reçus au fil des publications : le build 63 remet l'application au niveau du
site.

## Ce qui change pour l'enfant depuis le build 62

Idées du fils, chacune acceptée par le parent, souvent après une mesure sur des parties
simulées :

- **King Snake** : le roi à trois têtes porte le nom choisi par le fils, en français comme en
  anglais. Dans le voyage, il arrive maintenant avec ses deux gardes et son guérisseur
  (voyage version 2, [bilan](BILAN-VOYAGE-2.md)).
- **Tous les serpents** : un index de tous les serpents et de l'œuf, avec ce que fait chacun
  et la vague où il arrive. Les alliés tiennent sur un seul écran.
- **Grande aventure** (révisions d'équilibrage 3 à 6) :
  - un œuf de plus quand une vague dure ([révision 3](BILAN-REVISION-3.md)) ;
  - trois nouveaux serpents, « Grands crocs », « Serpent rare » et « Serpent ninja »
    ([révision 4](BILAN-REVISION-4.md)) ;
  - le serpent ninja se téléporte dans le dos de celui qui le frappe, sans mot écrit
    ([révision 5](BILAN-REVISION-5.md)) ;
  - le serpent sauterelle saute une fois par-dessus la ligne des alliés
    ([révision 6](BILAN-REVISION-6.md)).
- **Dessins** en pâte à modeler des quatre nouveaux serpents
  (`public/assets/illustrated/PROVENANCE-SERPENTS-NOUVEAUX-2026-11-18.md`).
- **Plus lisible sur téléphone** : textes du plateau plus grands, signes dessinés à la place
  de mots, « Cristal » pour la jauge partout, « Encourager » en un appui, annonce d'un
  nouveau serpent ou d'un allié débloqué, « KSSS » quand le serpent rare mord.
- **« Reprendre »** : une mission gagnée ne propose plus d'être reprise une fois le jeu fermé
  ([bilan](BILAN-REPRENDRE.md)).

Rien n'a été retiré. Aucune publicité, aucun achat et aucun outil de mesure dans
l'application ; aucune permission ni SDK ajouté ; aucun appel réseau pendant le jeu.

## Sauvegardes et codes

- Le build 63 lit tout ce que le build 62 a écrit : camps, codes de départ, fichiers
  familiaux et voyages. Une partie commencée garde ses règles ; seule une nouvelle partie
  prend la révision 6 (code `AVENTURE-8-…`, camp de version 13, voyage `VOYAGE-2-…`).
- Le build 62 ne lit pas un camp, un code ou un fichier familial écrit par le site actuel ou
  par le build 63 (« autre version du jeu ») : mieux vaut que les familles mettent
  l'application à jour.
- Nouvelle donnée locale, une par joueur : `conquete-serpents:mission-done:v1` (la marque de
  la mission gagnée, pour « Reprendre »). Elle reste sur l'appareil, hors du fichier
  familial, et s'efface avec le joueur.

## Vérifié (sur `main`, avant construction)

- `npm run verify` : 844 tests, zéro échec ; format, types, build et budgets verts.
- `npm run build:android` : `dist-android/` construit ; ses contrôles automatiques passent
  (aucune page du site, aucune adresse de paiement, publicité éteinte, aucun faux script).
- Les cinq tâches de la CI sur chaque PR fusionnée (recettes navigateur comprises).

## Pas vérifié

- La recette native du release63 reste à effectuer sur un émulateur accéléré ou
  appareil de test ; les vérifications navigateur et de signature ne la remplacent pas.
- Rien n'a été joué par les enfants ; la mise à jour 62 → 63 par Google Play n'est pas
  essayée.

## Notes de version proposées pour Google Play

```text
<fr-FR>
Quatre nouveaux serpents inventés par un enfant : Grands crocs, Serpent rare, Serpent ninja qui se téléporte et Serpent sauterelle qui saute par-dessus tes alliés. King Snake arrive avec ses gardes à la fin du voyage. Nouvelle page « Tous les serpents ». Textes plus lisibles sur téléphone. Tes sauvegardes sont conservées.
</fr-FR>
<en-US>
Four new snakes invented by a child: Big Fangs, Rare Snake, a Ninja Snake that teleports and a Grasshopper Snake that leaps over your allies. King Snake brings his guards at the end of the voyage. New "All the snakes" page. Easier to read on phones. Your saves are kept.
</en-US>
```

## Procédure de construction ajoutée par Codex

Les profils Web/Android sont centralisés. Chaque distribution conserve sa version
commune de jeu, son propre commit et ses capacités dans `build-info.json`. Un site
plus récent que l'application n'oblige pas à dupliquer les règles ou à embarquer les
pages publiques dans Android.

Le flux refuse sources non committées, mauvaise cible, copie ancienne, dossier de
livraison déjà occupé et certificat d'envoi différent. Les fichiers embarqués et la
configuration Capacitor sont comparés dans le vrai AAB/APK. R8, permissions exactes,
SDK24/36, paysage et versions sont contrôlés. Les archives non signées, partiellement
signées, altérées ou signées par une autre clé sont refusées par une recette dédiée.
La preuve hors ligne Android est conservée séparément de celle du site.

Le prototype historique et les fichiers Apache sont exclus d'Android mais restent
préservés dans le projet et les distributions Web. La politique approuvée et les
crédits restent embarqués. Aucun changement des règles ou formats par ce lot.
