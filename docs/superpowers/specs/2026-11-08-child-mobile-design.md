# Parcours enfant et mobile — 0.31.0

Suite du rapprochement d'audit 0.30.2, autorisée par « Continue » et le mandat
autonome du parent. Périmètre : sous-parties d'interface des lots 2 et 7.
Les décisions de difficulté, bonus anticipé, disponibilité des outils, nouvelles
missions et intégration des fonds restent distinctes. Aucun achat ni SDK.

## Choix de réalisation

Un bandeau en bas prendrait la hauteur des trois voies ; garder uniquement le
catalogue temporaire conserverait le défaut d'accès répété. Choix du développeur :
un dock latéral permanent en paysage compact, quatre alliés (grille 2×2), deux
miels et accès au catalogue complet. Celui-ci remplace temporairement le dock,
dans la même colonne, sans recouvrir la carte ni mettre le jeu en pause.

En paysage de hauteur ≤350 px, le pied du dock est retiré pour préserver les
cibles : le bouton « Alliés » du HUD ouvre le catalogue ; toucher de nouveau le
pot ou Échap annule la sélection. Cette adaptation couvre aussi les marges système.

Les quatre alliés suivent l'ordre des huit favoris actifs, filtrés par les
vrais déverrouillages. Si moins de quatre sont disponibles, compléter dans
l'ordre du catalogue. Ne pas masquer un raccourci parce que l'or est insuffisant :
le griser avec son prix. Aucun favori ou sauvegarde n'est réécrit.
Conserver les aides, huit favoris complets et toutes les unités dans le catalogue.

Pour le miel, l'interface arme un pot sans le consommer. Toucher le centre d'un
chemin envoie la même commande `Game.offerFeast(lane, flavor)` que les boutons
existants. Un clic entre les chemins, sur une voie inactive ou pendant la pause
ne dépense rien. Les boutons Haut/Centre/Bas restent une alternative clavier.
Armer le miel annule la sélection d'allié et inversement. Échap/Annuler, retour
accueil, nouveau Game et fin de vague effacent le geste temporaire. Les indices
de chemin sont visuels ; ils n'influencent ni déplacement ni RNG.

Une sélection d'allié ou de miel n'est jamais un ordre de déplacement. Les
soldats restent autonomes. Les pauses acquises de 0.30.2 sont conservées.

## Architecture et compatibilité

État transitoire dans Session, pas dans Game ni dans les codecs. Helpers purs
dans ui/ pour les quatre raccourcis et l'identification du chemin touché à partir
de `lanePoint`, géométrie commune déjà utilisée par le rendu. Le rendu ne décide
pas des règles du miel. Prix, stocks, cadence, vagues et statistiques inchangés.

Les textes de présentation utilisent « alliés » et le tutoiement. Corriger
`défendez` dans childCopy sans réécrire les données/snapshots historiques du moteur.
Conserver les identifiants DOM et les commandes existants pour clavier/tests.

## Recette

- Dock quatre alliés et deux pots à 812×375, sans recouvrement ; commandes≥48 px.
- Plateau≥85% hauteur utile et≥65% largeur utile à 812×375, marges système comprises.
- Catalogues étroits 480/568/667, portrait 375×812 et ordinateur1280×800.
- Recrutement tactile réel, coûts réels, sélection sans achat automatique.
- Miel en touchant les chemins courbes, modes Attirer/Ralentir, voies paisibles,
  pause, invalides, nouvelle partie, fin de vague et contrôles clavier.
- Mêmes commandes => mêmes états Game/RNG ; anciennes sauvegardes 1–7 lisibles.
- Build, suite native et navigateur, audit et reprises ; APK familial signé
  avec le certificat debug précédent. Les essais physiques ne sont pas déduits
  du navigateur. Pas de publication Play. Livraison web distincte du build vérifié selon le mandat
  de publication existant ; audience publique conservée.
