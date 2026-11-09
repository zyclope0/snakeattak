# Ressources graphiques fournies

Les trois maquettes et la bannière brouillon sont des références fournies dans
le ZIP de l’audit du 7 novembre 2026. Les instructions du dossier d’origine ne sont
pas ajoutées automatiquement aux instructions du projet.

Les trois créations Magnific existantes ont été récupérées le 8 novembre 2026 via
le connecteur, après enregistrement de téléchargement. Aucune génération lancée.
Empreintes, tailles et dimensions : downloads.json. Les URLs privées temporaires
ne sont pas conservées dans le dépôt.

- assets/terrain-crue.png : 2688×1536, réservé au lot 6.
- assets/terrain-marais.png : 2688×1536, réservé au lot 6, direction visuelle à valider.
- assets/icone-source.png : 2048×2048, original de la création retenue pour lot 9 ;
  exporter 512×512 ensuite. Le nom proposé icone-512.png désignait la future sortie,
  pas la dimension du fichier source.

Les liens publics stables et les prompts sont dans PROVENANCE.md (provenance
fournie par l’auteur de l’audit). A-TELECHARGER.md est conservé comme document
d’origine : ses trois téléchargements sont désormais réalisés.
Les PNG HD restent hors du build web et ne ralentissent pas le chargement.
Ils ne changent ni les terrains ni l’icône Android dans le présent lot 7.

## Inspection visuelle des originaux

Les deux fonds ont été examinés : crue plus picturale et centre relativement
calme ; marais plus gravé, détails centraux plus présents, toujours à valider
avant intégration. L’icône téléchargée présente des coins blancs arrondis,
contrairement à la mention « coins carrés » de la provenance fournie. Les quatre
coins sont opaques et quasi blancs. Original conservé ; corriger ce point au
lot 9 avant tout export store. Aucune correction/génération de l’image faite ici.

## Utilisation de l'icône — étape 3, 0.32.4

L'original reste inchangé. Il a servi au détourage local et aux exports Android
sans nouvelle génération : [ressources dérivées](../../resources/android-icon/README.md),
[provenance et empreintes](../../resources/android-icon/manifest.json),
[bilan](../BILAN-0.32.4.md). Premier plan des personnages sur fond uni #214C3B,
coins blancs éliminés, cinq densités et versions adaptatives26/33. Les deux
terrains restent réservés au lot6 ; aucun changement de terrain ou de règle.

## Référence artistique confirmée par le parent

Le 8 novembre 2026, après livraison de l'icône 0.32.4, le parent confirme que
son style **pâte à modeler / papier mâché** doit faire foi pour l'ensemble du
projet. `assets/icone-source.png` devient donc la référence artistique principale,
au-delà de son usage comme icône. Voir [GAME_DESIGN](../../GAME_DESIGN.md#direction-artistique).
Les deux terrains fournis restent conservés ; leur intégration et leur cohérence
avec cette direction restent à examiner dans les lots autorisés correspondants.
Aucune nouvelle génération ni modification d'image dans cette consignation.

## Utilisation graphique autorisée — v0.34.0

Le 9 novembre2026, le parent demande explicitement le point3 : exploiter les
fonds encore inutilisés et harmoniser la matière. Crue/marais servent désormais
uniquement de cadres périphériques sur les terrains existants ; leur centre
pictural/gravé reste écarté de la surface de combat. Aucun nouveau lieu, météo,
obstacle ou règle. La référence principale demeure l’icône.

Deux exports WebP1600×900 sont chargés un à la fois à la demande, jamais à
l’accueil. Originaux inchangés, procédure et empreintes dans
[resources/scenery](../../resources/scenery/README.md). Les réserves historiques
ci-dessus décrivent les lots précédents, pas une intégration plein écran actuelle.
