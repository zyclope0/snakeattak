# Dangers et préparation illustrée — 0.32.0

Suite du GO du parent pour les deux étapes d'interface proposées. Les lots 2 et
7 avancent ; la campagne reste six missions/19 vagues, sans nouveau niveau ni
nouvelle règle. Le prolongement jusqu'au Tank et au roi reste à proposer.

## Réalisé

- Bouton « Dangers » avant chaque vague : portraits, capacités, voies ouvertes,
  œufs et conseil avec un allié déverrouillé. La cour royale est annoncée en
  classique ; les expéditions ne promettent pas le roi absent de leurs vagues.
- Portraits représentatifs aux antres ouverts pendant la préparation. Ce sont
  les espèces de la vague, pas le prochain individu ou une distribution par voie.
  Le panneau indique que les ennemis peuvent changer de voie.
- Préparation de mission : carte SVG avec tracé partagé, fond adouci, antres,
  refuge et rochers ; trois dangers principaux, liste des autres à déplier et
  un conseil illustré pour l'ensemble de la mission, dont les volants à venir.
- Les portraits réutilisent les atlas déjà présents. Les ailes et les soins
  portent un pictogramme, car ils partagent une pose de serpent ordinaire.
- Boutons de lancement/retour toujours hors du défilement du dialogue ; cibles
  des nouvelles actions et du lancement ≥48px.

## Architecture et limites

Projection UI pure depuis les helpers de composition existants, sans lecture
anticipée des voies adaptatives. `threatPreview.ts` ne déclenche ni tirage ni
simulation. Des tests observent les naissances réelles du moteur et comparent
leurs espèces et quantités à la projection, cour royale comprise.
`missionPreview.ts` sépare la carte et le conseil du contrôleur d'expéditions.
Le rendu ne crée aucun ennemi. Les dialogues utilisent les pauses temporaires
existantes ; fermer Dangers ne libère pas une interruption d'arrière-plan.

Aucun changement de Game, IA, vagues, prix, statistiques, RNG ou codecs. Aucun
ordre manuel, bonus anticipé, mode Facile, disponibilité nouvelle d'outil,
SDK, frais de génération ou langue supplémentaire. Formats de camp 1–7 conservés.
Les nouvelles images HD crue/marais et l'icône Android restent au plan distinct.

## Vérifications et livraison

422 tests natifs, types, build et budgets passent. La nouvelle recette vérifie
cinq tailles/marges et le portrait avec retour en paysage : images, tracés,
conseil disponible visible sans défilement (mission6/marges), liste dépliable,
changement de départ, vagues, pauses, RNG/or inchangés, cibles48px et ratio du plateau.
Les marqueurs Phaser suivent les antres actifs du refuge.

Audit strict13/13 ; navigateur général, six dock/marges, six écrans mobiles et
quatre catalogues étroits, interruptions11, hors ligne/formats1–7/trois fonds,
présentation14 et parcours des missions passent. Un premier arrêt du test de
démarrage caché venait d'une édition du HTML pendant la recette Vite ; la même
recette passe avec les sources stabilisées, sans changement de pause.

Rapports : `reports/threat-preparation-0.32.json`, `reports/audit-0.32.json`,
`reports/child-mobile-0.32.json`, `reports/mobile-0.32.0.json`,
`reports/interruptions-0.32.0.json`, `reports/offline-0.32.0.json`.
Captures : `docs/captures-0.32/`. Portable : build et recette navigateur passent. APK familial 0.32.0/code35
compilé hors ligne, certificat debug précédent, démarrage normal sans diagnostic.
Les 27 fichiers web embarqués correspondent exactement au build testé.
La publication attend la revue finale ; aucun AAB ni déploiement Play.

Le S24, le confort des enfants sans lecture, FPS/RAM, appels et verrouillage
restent des essais physiques distincts. Les mises en situation Chromium ne les
valident pas.

## Choix du développeur

- Réutilisation du worktree isolé et méthode native sous mandat autonome ; pas
  de création ou suppression d'un environnement hôte.
- Projection d'espèces sans voie promise : les mêmes portraits représentatifs
  peuvent apparaître à chaque antre ouvert. Risque de lecture erronée limité par
  l'explication du panneau ; la compréhension réelle reste à tester avec les enfants.
- Aucun verrouillage supplémentaire d'outil et aucune extension de campagne.
  Les futurs réglages restent à valider avec le parent et le fils.
- Le portrait mobile conserve son écran de rotation, même à l'accueil.

- Conseil avant la carte pour qu'il apparaisse dans la première vue, même avec
  les marges Android ; les autres informations restent dans le défilement.
- Seuil du lancement relevé à48px aussi sur ordinateur.
- Rapports versionnés pour préserver les preuves des versions précédentes.
- Gel des sources pendant les recettes pour éviter les rechargements Vite induits.
