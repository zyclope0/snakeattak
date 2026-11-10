# Task 1 — Revue indépendante spécification et qualité

Date : 10 novembre 2026. Périmètre : accueil, navigation courte, favoris et carnet du seul lot 1. Base `70c5bf1`, tête revue `944f958`, paquet `task-1-review-package.diff`.

## Verdict de spécification

**Conforme dans le périmètre du lot 1.** L'accueil présente une commande principale et les accès dédiés ; les options classique et parents ont leurs pages. La reprise contextuelle suit le mode actif existant et délègue aux commandes de production. Le carnet présente une mission à la fois, avec deux familles de trois autocollants, un sélecteur visible et une gestion repliée. Les favoris sont paginés par six.

Le diff ne modifie ni moteur, RNG, règles, valeurs, formats, définitions des défis, ni identité Android. Il n'ajoute aucun SDK, serveur, appel payant ou mécanisme. Les textes français protégés et les IDs distincts sont conservés. La séparation des carnets et le partage familial de la campagne restent sous l'autorité des contrôleurs existants. Les nouvelles commandes ont leurs entrées anglaises ; les feuilles françaises protégées ne passent pas par ces traductions.

La préparation, le catalogue/dock, les baux de pause associés et la migration restante des recettes CI appartiennent aux lots 2/3. Leur absence du lot 1 ne constitue pas un défaut de ce lot.

## Points forts

- `src/ui/homeNavigation.ts:4` : interface `show(HomePage, focus?)` limitée à la visibilité et au focus, sans stockage. Le retour visible, Escape et le retour du focus utilisent les mêmes pages.
- `src/bootstrap.ts:233` : le bouton principal appelle `expeditions.resume`, `menu.resumeClassic` ou `expeditions.play`, sans clic synthétique vers une commande masquée et sans seconde implémentation du lancement.
- `src/ui/capriceAlbums.ts:78` : pagination des missions séparée des données de carnet. Les pages réutilisent les 36 feuilles identifiées et les deux familles françaises existantes ; l'ouverture depuis un résultat choisit la mission et le propriétaire.
- `src/ui/caprices.css:265` : le dialogue conserve ses commandes hors de la zone des autocollants défilante et applique les variables de sécurité existantes. La capture `after-album-safe-568x320.png` confirme visuellement la sortie, le choix du carnet et la pagination accessibles dans le cas simulé.
- `src/ui/mobileMenus.css:2` : hauteur bornée de l'accueil, pages internes défilantes et cibles des commandes conservées à 48 px minimum. La capture `after-home-568x320.png` montre le bouton principal et les cinq accès sur le petit paysage.
- `scripts/mobile-menus-037-browser.mjs:1` : recette utile à la spécification, avec vrais parcours visibles, IDs attendus par mission, limites, renommage du bon carnet, maintien du texte français en anglais, rotation, safe areas et comparaison des deux camps après reprise/rechargement.

## Vérification et limites

Revue du brief, de la spécification validée, du rapport d'implémentation, des instructions du dépôt et du diff fourni. Le diff a été lu par morceaux lorsque la sortie initiale était tronquée. Aucune suite n'a été relancée et aucun fichier produit, index ou branche n'a été modifié.

Les reçus finaux documentent `verify` (548 tests, types, build et budgets), le parcours navigateur de livraison sans `pageError`, et la recette ciblée (234 contrôles, aucune erreur JS). Les fins de journaux navigateur et ciblé consultées concordent avec le rapport. Les captures petit paysage et carnet avec marges simulées ont été inspectées. Les reçus locale/caprices restent des preuves supplémentaires avec les limites de concurrence/HMR déclarées ; ils ne sont pas traités comme des gates de la tête finale.

**Cannot verify :** comportement sur appareil physique S24, intégration des barres système Android et lecteur d'écran. Les marges sont simulées dans Chromium. La migration complète des anciennes recettes et la validation finale de l'ensemble des lots restent à faire lors de l'intégration annoncée. Aucun de ces éléments n'est revendiqué comme vérifié par cette revue.

## Findings

- **Critical :** aucun.
- **Important :** aucun.
- **Minor :** aucun défaut actuel démontré dans le périmètre revu.

Le budget HTML de 120 octets restants est une contrainte d'intégration déjà déclarée, pas un dépassement actuel.

## Qualité du lot

**Approved.** Le lot respecte son contrat, conserve les autorités existantes pour le jeu et la sauvegarde, et présente des preuves ciblées cohérentes avec les changements. Aucun correctif bloquant identifié dans ce périmètre.
