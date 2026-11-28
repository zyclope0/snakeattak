# Bilan 0.41.0 — candidat Android build 65

Le numéro a été préparé le 23 novembre après la
[décision du parent](DECISIONS-2026-11-23.md). Ce bilan couvre le contenu du
candidat à partir du code audité le 28 novembre. Le S24 du parent avait reçu
la 0.40.0 / build 64 le 22 novembre. L'export familial de cette version restait
bloqué dans la WebView.

## Depuis le build 64

- **Sauvegardes.** Récupération du reste de l'aventure si un camp est illisible,
  copies de secours et avertissement si le stockage échoue. Sur Android,
  Filesystem et Share ouvrent le partage natif après une question pour adulte.
  Dans la fenêtre familiale, la phrase de résultat et le bouton « Remplacer »
  ont été remis à portée de l'écran.
- **Accueil et commandes.** L'accueil « la clairière » et les menus reprennent
  le style des figurines. Le bouton Retour d'Android ferme les fenêtres et
  respecte la pause. Planches réencodées et rendu plafonné à 60 images par seconde.
- **Jeu.** Nouveaux visuels du serpent volant et du roi à trois têtes, collection
  de pommes par joueur et Classic Snake. Le fichier familial v7 porte les pommes
  et garde la lecture des anciens fichiers. Les nouvelles aventures sans fin
  démarrent en v2, avec un nouveau rythme après le premier roi. Les parties
  existantes continuent avec leur v1.
- **Fiabilité.** Recette des missions de retour en CI et calcul de croissance
  de la Grande Expédition rendu reproductible par multiplications répétées.
  Les empreintes de référence des anciennes parties sont conservées.
- **Information aux familles.** La politique approuvée nomme la version 0.41.0,
  décrit le partage et le cache Android ainsi que les copies avant import. Source
  unique `src/i18n/privacyPolicy.ts`, avec
  `tests/fixtures/politique-approuvee-build-65-2026-11-23.json` comme référence.
  L'application reste gratuite, sans publicité ni achats intégrés.

## Vérifications et limites

- Le site public sert **0.41.0** du commit `9652233`. La
  [CI complète de ce commit](https://github.com/zyclope0/snakeattak/actions/runs/46125045295)
  et le [workflow de publication](https://github.com/zyclope0/snakeattak/actions/runs/46127029232)
  sont verts. La PR 162 consigne **1 104 tests unitaires**, **44 recettes** et
  **120 parties de simulation** reproduisant le réglage approuvé.
- Sur un APK debug, le parent a essayé la question adulte, le partage vers Drive
  et la réimportation. Un essai ultérieur a confirmé l'affichage des messages
  corrigés. Ces essais datent du 23 novembre.
- Le 28 novembre, le candidat signé du commit
  `077eb7aac89f80c285b1b9237c6a377e021fd402` a passé **1 109 tests**,
  la recette navigateur et **15 contrôles hors ligne**. L'AAB de 15 176 721 octets
  porte l'empreinte SHA-256
  `26f067e65fe4b33735fa780450b76990ff0e4fbdcd49cb18d9c70baa7d056a15`.
  Empreintes de l'APK et du mapping dans le rapport de livraison.
- La [recette native du build 65](ANDROID-BUILD-65.md) reste à faire,
  notamment la mise à jour, le démarrage à froid, le partage et la sauvegarde.
  La disponibilité sur Alpha n'est pas confirmée. Voir le [plan actuel](PLAN-ACTUEL.md).

## Notes de version Google Play

**Français (fr-FR)**

```text
Un nouvel accueil et des menus plus lisibles. Exporte ton aventure depuis Android et retrouve-la sur un autre appareil. Le jeu garde des copies de secours et te prévient si la partie ne peut pas être enregistrée. De nouvelles surprises t’attendent sur le plateau, et les nouvelles aventures sans fin ont un rythme revu après chaque roi.
```

**English (en-US)**

```text
A refreshed home screen and easier-to-read menus. Export your adventure from Android and restore it on another device. The game keeps backup copies and tells you if it can’t save your progress. Look for new surprises on the battlefield, and enjoy a revised pace after each king in new endless adventures.
```
