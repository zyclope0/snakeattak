# Corrections v0.26.0

Mandat : huit corrections du brief utilisateur, dans l'ordre, un commit par point,
avec `npm run build` vert avant chaque commit. Exécution dans cette session.

Architecture : règles TypeScript indépendantes du rendu Phaser et du DOM.
Les changements 1–7 concernent uniquement la présentation, le chargement et Android.
Le point 8 change le choix d'un nouveau départ, jamais un départ sauvegardé.
Aucun `Math.random` dans les règles ; formats de sauvegarde inchangés.

1. Supprimer la pause Phaser, garder ses résultats victoire/défaite.
2. Contours ennemis #D2552D plus épais ; alliés vert foncé inchangés.
3. Ruisseau continu à berges souples, ponts à leurs coordonnées existantes.
4. Paysage téléphone : plateau ≥85 % hauteur et ≥65 % largeur, HUD fin,
   bandeaux masqués et renforts en tiroir accessible, refermé après sélection.
5. Android sensorLandscape ; écran de rotation en portrait tactile sur le web.
6. Conteneur CSS indépendant du canvas ; ResizeObserver avec nettoyage.
7. Chargement des atlas nécessaires au départ et à la demande, progression et erreur
   avec reprise sans changer la simulation ni consommer de tirage.
8. Nouveau tirage toujours sur un autre terrain ; v0.26.0 et vérification finale.

Vérifications : builds par point, régressions navigateur cumulatives, suite des
règles et sauvegardes, `npm run verify`, `npm run test:browser`, captures à
1280×800, 812×375 et 375×812. Tester aussi redimensionnement sans événement window,
rotation aller-retour, victoire/défaite, tiroir, mission puis autre chapitre,
chargement lent/échoué et restauration d'anciennes sauvegardes.

L'état v0.25.0 a été enregistré comme commit racine avant les huit corrections.
Pas de publication du site ni de fabrication d'assets demandée pour ce lot.
