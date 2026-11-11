# Plan actuel — 0.37.0 publiée, remise en ordre en cours

## En cours — vrais sons à la place des bips (PR à venir, pas encore publiée)

Les bips du synthétiseur sont remplacés par des fichiers (`src/assets/audio`, 2 Mo, chargés
seulement quand le son est activé). Fin de vague, victoire, défaite et arrivée du roi : choix
du parent et de son fils. Musique épique « Treasure Hunter » sur la dernière vague et à partir
de la vague 8 de l'aventure. Licences : [AUDIO-LICENCES.md](AUDIO-LICENCES.md).
Musiques « Cozy Quest » achetées par le parent : menus et vagues calmes. Tous les sons ont
été choisis à l'oreille par le parent (7 Mo au total). Reste : essai sur le téléphone et avec
les enfants. Le son reste coupé au départ.

## Livraison actuelle — Sites26, Android build 51

Les PR14 et PR15 de Claude sont intégrées et publiées : pages de l’accueil et
principaux dialogues adaptatifs, marges Android prises en compte, cibles tactiles de 48 px.
Version **0.37.0** conservée ; APK **51**, même identifiant et certificat.
Source : `abe612370747bc51cc28da5a3d145f13e7846f45`.
Recette fraîche : **552 tests**, **750 contrôles de menus**, audit **13/13**, navigateur,
journey et deux démarrages hors ligne FR/EN verts. Site public contrôlé sur quatre
formats, dont deux avec marges système simulées ; ses **34 fichiers** correspondent à l’APK.
[Bilan court](BILAN-0.37.0.md). Essai physique S24, TalkBack et enfants encore à faire.

## Livraison précédente du 11 novembre — Sites25, Android build 50

Les changements de Claude jusqu’au merge `751dcf5` (PR8 à PR12) sont publiés.
Version visible **0.37.0** conservée ; Android **50**, même identifiant et certificat.
Source du paquet : `0dbc7cf53ddbdd82f9a7ba5af9d1a2efc8883f51`.
Vérifications fraîches : verify **552 tests**, menus **537 contrôles**, audit **13/13**,
navigateur et journey verts. Les **34 fichiers** du site public correspondent à l’APK ;
formats 1280×800 FR, 812×375 EN et 780×360 FR contrôlés, sans erreur JavaScript.
[Bilan court](BILAN-0.37.0.md). Aucun essai physique S24, TalkBack ou avec les enfants.
Les suites du chantier ci-dessous restent prévues ; cette livraison ne les réalise pas.

## Retour du téléphone sur le build 50 — pages de l'accueil adaptatives

Sur le Galaxy S24, le parent voyait encore Missions, Pour les parents et Aventure classique mal
affichées. Deux causes : le correctif de la PR nº 11 avait été mesuré sans les marges des
barres Android, et il reposait sur des seuils et des tailles en dur, réglés pour trois formats.

- **PR nº 14 (fusionnée)** : `src/ui/homePages.css` décrit Missions, Favoris, Aventure
  classique et Pour les parents dans une unité calculée d'après la place réelle.
- **Dialogues adaptatifs (PR nº 15, fusionnée)** : même méthode pour le carnet, la préparation, le
  catalogue, l'aide et les serpents annoncés (`src/ui/dialogPages.css`). Le carnet cassait à
  915×412 ; « C'est parti ! » de l'aide était hors écran sur téléphone ; une vingtaine de
  boutons faisaient moins de 48 px. Détail à la fin d'[ARCHITECTURE.md](ARCHITECTURE.md).
- **Jouer tout de suite (cette PR, décision du parent)** : le bouton principal de l'accueil
  lance la prochaine mission sans dialogue. La préparation (caprices, copains, repérage,
  options) reste sur la page Missions, bouton « Préparer ». Les trois boutons qui font avancer
  le jeu sont agrandis ; pendant une vague, le bouton de vitesse prend la place de « Lancer la
  vague » ; une image accompagne chaque destination de l'accueil et chaque vue de préparation
  (`src/ui/mainActions.css`).
- **Son** : le parent juge le son actuel de mauvaise qualité. Il reste coupé au départ tant que
  de vrais sons et une vraie musique, sous licence claire, ne sont pas choisis par lui.
- **Pas vérifié sur le téléphone** : il faut un nouvel APK et une capture du parent. La taille
  de police agrandie dans les réglages Android n'est pas simulée.
- **Reste** : l'accueil et l'écran de jeu gardent leurs seuils ; les dialogues de lecture
  défilent.

## Remise en ordre — Claude Code, 11 novembre 2026

Trois objectifs du parent : moteur propre, interface stabilisée, projet nettoyé. Ordre retenu :
filet de tests, nettoyage, moteur, interface, conventions. Un lot par PR, sans changer une règle.

- **Lots 0 et 1 (PR nº 8, fusionnée).** Les recettes n'écrivent plus dans des fichiers suivis ;
  5 173 captures et gros rapports sortent du suivi Git (671,7 → 103,1 Mo), récupérables au
  commit `88fdf54` : [ARCHIVES.md](ARCHIVES.md). Aucun fichier de `src/` touché.
- **Tri des documents (PR nº 9, fusionnée).** 162 fichiers historiques rangés dans
  `docs/archive/`, neuf documents vivants listés dans [README.md](README.md).
- **Moteur découpé (PR nº 10, fusionnée).** `src/game.ts` passe de 1 303 à 395 lignes ; les
  règles d'un pas sont dans `src/engine/`, déplacées sans réécriture. Parties rejouées à
  l'identique : voir la fin d'[ARCHITECTURE.md](ARCHITECTURE.md).
- **Pages secondaires de l'accueil (PR nº 11, fusionnée).** Sur téléphone en paysage,
  Missions, Favoris, Aventure classique et Pour les parents tiennent sans défiler en 780×360
  et 812×375. CSS seulement.
- **Styles et page découpés (PR nº 12, fusionnée).** `src/style.css` devient 18 tranches ordonnées dans
  `src/styles/`, `index.html` neuf morceaux dans `src/html/`. Site construit identique octet
  pour octet : voir la fin d'[ARCHITECTURE.md](ARCHITECTURE.md).
- **Moteur de rendu.** Phaser 3 réévalué et gardé : voir la fin d'[ARCHITECTURE.md](ARCHITECTURE.md).
- **À suivre.** Regrouper les styles par écran, avec une comparaison d'images avant et
  après ; conventions de
  code. Le numéro de version reste 0.37.0 tant que le lot interface n'est pas complet.
- **Pas vérifié.** Rien sur le S24 ni avec les enfants.

## Première livraison 0.37.0 — huit choix réalisés, build 49

La version Android **0.37.0 / code 49** applique les huit choix validés :
accueil court et reprise contextuelle, carnet de six autocollants par mission,
gestion repliée, préparation en sous-vues, catalogue natif paginé en pause avec
budget visible. Les 36 noms/annonces du créateur restent français dans les deux
langues ; moteur, données, sauvegardes et anciens codes sont préservés.

Source produit/tests figée : `b31933bf9f6dc56b9c7bf4d286068f52ff3bf28a`.
[Bilan](BILAN-0.37.0.md), [conseils simulés](archive/CONSEIL-0.37.0.md),
[preuves et reçus](../reports/interface-0370/README.md),
[cadrage](archive/superpowers/specs/2026-11-10-interface-mobile-0370.md).
La correction finale I1/M1/M2 révèle les résultats du catalogue, remet le focus
d’accueil dans la zone visible et répare la recette journey. Verify 549 tests,
9 régressions navigation, journey, gestes natifs cinq tailles + ordinateur,
menus et navigateur sont verts sur la source corrigée. APK debug et portable
HTML/ZIP sont reconstruits ; quatre démarrages froids FR/EN sont verts.
Les 21 gates et la partie authentique antérieurs restent explicitement en `9ca13bb`.
La nouvelle recette et les artefacts sont indexés dans le reçu de livraison. Les anciennes preuves et la version 0.36.2 restent conservées.

**Première publication 0.37.0 : Sites24, build 49.** Revue globale et relecture des trois
correctifs approuvées ; PR7 fusionnée après CI verte. Les fichiers publics sont
identiques au paquet normal de l’APK. Voir le [reçu](../reports/deployment-0.37.0.json).
Les essais S24, TalkBack, enfants et
relecture anglophone native restent attendus. Le petit carnet 568×320 avec marges
conserve un défilement interne ; à 780×360 avec marges les six cartes tiennent.

Le comparatif d’images est séparé et arrêté au [devis partiel](archive/interface-0370/DEVIS-COMPARATIF.md) :
100 crédits Magnific, 1 crédit Higgsfield de base, prix Runway indisponible.
Aucune image ni dépense lancée.

## Avant la 0.37.0

Le journal de Codex jusqu'à la 0.36.2 est dans
[archive/PLAN-ACTUEL-avant-0.37.md](archive/PLAN-ACTUEL-avant-0.37.md).
