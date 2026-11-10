# Conseil après le lot B — accueil et six missions

9 novembre 2026. Six perspectives indépendantes et simulées ; aucun enfant,
lecteur d'écran ou téléphone physique testé. Lot3f53bba→f428763, puis correction
bornée2a95623. Les véritables règles et les déblocages restent inchangés.

| Persona                                     | Constats et réserves                                                                                                                                                        | Arbitrage                                                                                               |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Technique — architecture/moteur/sauvegardes | Verrous issus du contrôleur, étoiles conservées même sur profils irréguliers ; prochaine mission unique. Commandes existantes conservées, aucun changement moteur ou format | Aucun blocage relevé ; compléter la preuve par les 4 096profils possibles, sans les appeler des parties |
| Technique — Android/mobile/performance      | Icône entière, SVG créés une fois, plateau 87% hauteur/71% largeur en 812×375 ; images du premier écran 6→2                                                                 | Conserver les images et le fond assorti ; aucun gain FPS/RAM physique déduit                            |
| Technique — qualité/accessibilité           | États par symbole/texte/couleur ; aria-current unique et retiré après six réussites ; boutons gardés, focus et vraie icône contrôlés, anciens résultats0.32.2 intacts       | Pas de blocage technique relevé ; recette clôturée en Chromium seulement                                |
| Cible simulée — 6 ans peu lecteur           | Figurines et Jouer repérables ; en 780×360 le statut en bas de carte peut être sous le pli ; certains emblèmes ont encore besoin des mots                                   | Répéter un grand symbole d'état en haut du médaillon ; pas de promesse d'autonomie sans lecture         |
| Cible simulée — 9 ans habitué               | Prochaine/rejouer/étoiles compréhensibles ; classique pas distingué immédiatement et états bas de carte peu visibles                                                        | Préciser « 12 vagues » sur le bouton du classique ; badge haut                                          |
| Cible simulée — 12 ans tacticien            | Pas de niveau7 ou de bonus inventé ; « autres régions viendront » reste une promesse non livrée ; Rejouer cible carrefour sans le dire avant aperçu                         | Remplacer la promesse par les configurations existantes ; nommer la mission ciblée par Rejouer          |

## Passe retenue et vérifiée

Quatre ajustements seulement : symbole haut, libellé12vagues, suppression de la
promesse géographique et mission de rejeu nommée. Aucun numéro de mission,
étoile, budget, récompense, code ou pouvoir changé. Captures actualisées avant
clôture, après preuve rouge des badges absents.

438 tests et build verts, nouvelle recette 16 cas, navigateur et audit13/13 verts
après cette passe. Pas de seconde série de six avis présentée comme un essai
humain. Les tests précédents de missions/départs/interface restent valables pour
leurs parcours inchangés ; la livraison les complète par les transitions.

## Preuves et limites

- [Rapport du lot](../reports/suivi-0.33.1/journey.json),
  [profils exhaustifs](../reports/suivi-0.33.1/progression-combinations.json).
- [Accueil](captures-0.33.1/accueil-1280x800.png),
  dossier docs/captures-0.33.1 ; jeux de profils avant/après dans
  artifacts/mission-journey-0331.
- Modèle src/ui/missionJourney.ts et vue/CSS dédiées ; les deux compositions
  de navigation restent dans menu.ts/expeditions.ts.

Les captures ne démontrent pas la compréhension des enfants, la navigation
par lecteur d'écran ou la manipulation sur S24. Deux emblèmes abstraits restent
une réserve légère à confronter aux essais familiaux ; aucune génération payante
n'a été lancée pour les remplacer. [Bilan](BILAN-0.33.1.md).
