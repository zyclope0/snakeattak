# Audit du 7 novembre 2026 — résumé (v0.26.0)

Version complète, avec benchmark, finances et sources : https://claude.ai/artifact/MZV247wikz227ThaqxuNNg

## Les 5 décisions

1. Corriger l'affichage avant tout (lot 1) : sur ordinateur, le plateau s'ouvre décalé et ne tient pas
   sur un portable ; sur téléphone, les boutons font 36 px au lieu de 48.
2. Rendre le jeu jouable sans lire (lots 2 et 7) : 8 mots à l'écran au lieu de 310, des icônes,
   un système nouveau par mission, une mission 1 sur une seule voie (à valider avec l'enfant).
3. Tester sur un vrai téléphone Android (lot 4) : jamais fait.
4. Monétiser par un seul achat de déblocage à 3,99 € / 4 CHF (lot 8), sans pub ni collecte.
5. Viser une sortie fin décembre : compte Google Play en semaine 1, test fermé de 12 testeurs
   pendant 14 jours, traduction pendant le test.

## Code (état des lieux)

- Règles TypeScript pures (35 fichiers), rendu Phaser (`src/render`, 29), interface HTML/CSS (`src/ui`, 20).
- 364 tests verts, CI GitHub complète, graine Web Crypto, 0 `Math.random`, sauvegardes v1 à v6.
- Aucun appel réseau ni mesure d'audience ; CSP `script-src 'self'`.
- Dettes : textes français en dur (`index.html` + environ 285 chaînes dans 40 fichiers TS),
  `game.ts` de 1 201 lignes, 49 documents dans `docs/`, `legacy/` et `prototype-v4.html` publiés dans `dist/`.
- Android : Capacitor 8.6, minSdk 24, targetSdk 36, paysage verrouillé ; aucun APK construit ni testé ;
  identifiant `com.conqueteserpents.famille` marqué provisoire.

## Constats du test (v0.26.0)

| #   | Constat                                                                                                 | Preuve                                                                                       | Lot |
| --- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --- |
| 1   | Lancer une mission garde le défilement de l'accueil : HUD et haut du plateau hors écran                 | 422 px à 1280×800 ; `captures/plateau-decale-1280x800.png`                                   | 1   |
| 2   | Le plateau ne tient pas sur un portable courant (320 px d'interface au-dessus)                          | 480/514 px visibles à 1280×800, 448/563 à 1366×768                                           | 1   |
| 3   | Trop de texte pour 6–7 ans                                                                              | 352 mots sur l'accueil, 310 sur l'écran de combat ; code de départ en tête de la préparation | 2   |
| 4   | Bouton « Déployer » sous le pli du dialogue de préparation                                              | `captures/preparation-bouton-sous-le-pli-1280x800.png`                                       | 1   |
| 5   | Mission 1 gagnée 3 étoiles, cristal à 100 %, sans décision                                              | vagues de 11 à 15 s en ×2                                                                    | 7   |
| 6   | Halos bleu pâle derrière les grottes et le refuge                                                       | `captures/vague-paysage-telephone-812x375.png`                                               | 3   |
| 7   | Boutons du HUD téléphone à 36×36 px                                                                     | mesure 812×375                                                                               | 1   |
| 8   | Texte de victoire « douze vagues » après 3 vagues                                                       | `src/ui/coaching.ts:44`                                                                      | 1   |
| 9   | Cadre vide à côté du titre du tiroir des renforts                                                       | `captures/tiroir-renforts-812x375.png`                                                       | 1   |
| 10  | 4 textes de l'accueil sous 4,5:1, dont un à 2,09:1                                                      | axe-core 4.10                                                                                | 1   |
| 11  | Cinq noms pour la même chose (détachement, armée, équipe, camp, renforts) ; « tu » et « vous » mélangés | `src/waves.ts:36`, `src/missions.ts:28-68`                                                   | 2   |
| 12  | Les raccords en S croisent les voies comme une tresse                                                   | captures                                                                                     | 3   |

Corrigé en v0.26 (revérifié) : pause unique, contour orange des serpents, ruisseau sous les ponts,
plateau à 88 % en paysage, consigne en portrait, nouveau tirage qui change de terrain. Chargement
allégé : 3,1 Mo avant l'accueil, 6,7 Mo au début du combat.

Non mesuré : images/s sur un vrai téléphone (le cloud utilise un GPU logiciel, 17 à 20 images/s sans valeur).

## Références utilisées par les lots

| Référence                       | Ce qu'on en retient                                                                                      | Source                                                                                                                           |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Plants vs. Zombies, niveau 1-1  | 1 voie, 1 plante, ennemis après 2 poses                                                                  | https://plantsvszombies.fandom.com/wiki/Level_1-1                                                                                |
| George Fan (PvZ), GDC 2012      | 8 mots à l'écran au plus ; aides seulement en cas d'erreur ; nouveautés très lentes                      | https://gamedeveloper.com/design/gdc-2012-10-tutorial-tips-from-i-plants-vs-zombies-i-creator-george-fan                         |
| Kingdom Rush                    | Emplacements fixes ; icônes d'ennemis à l'entrée ; appel anticipé contre de l'or ; 2e chemin au niveau 3 | https://www.gamedeveloper.com/design/kingdom-rush---the-wonderful-campaign-level-design                                          |
| Bloons TD 6                     | Mode Easy : plus de vies, coûts −15 %, ennemis plus lents ; ×3 à tout moment                             | https://bloons.fandom.com/wiki/Bloons_TD_6                                                                                       |
| Minecraft                       | Difficulté changeable à tout moment                                                                      | https://minecraft.wiki/w/Difficulty                                                                                              |
| Toca Boca                       | « no language and no text »                                                                              | https://gulfnews.com/technology/consumer-electronics/toca-boca-glory-game-apps-children-love-even-though-they-cant-win-1.1328450 |
| Android                         | Cibles tactiles d'au moins 48×48 dp                                                                      | https://developer.android.com/guide/topics/ui/accessibility/apps                                                                 |
| PEGI (juin 2026)                | Objets aléatoires payants = PEGI 16 ; offres limitées ou pénalités quotidiennes = PEGI 12                | https://www.pocketgamer.biz/pegi-expands-age-ratings-to-cover-loot-boxes-and-in-game-spending                                    |
| Google Play, politique Familles | SDK pub autocertifiés seulement, pas de pub ciblée, pas d'identifiant publicitaire                       | https://support.google.com/googleplay/android-developer/answer/9893335                                                           |
| Google Play, test fermé         | 12 testeurs, 14 jours consécutifs, comptes personnels créés après le 13/11/2023                          | https://support.google.com/googleplay/android-developer/answer/14151465                                                          |

## Monétisation retenue

App gratuite, un seul achat « Jeu complet » à 3,99 € / 4 CHF, derrière un portail parental ;
pas de pub, pas de monnaie virtuelle, pas de collecte. Démo navigateur = missions 1 à 3.
Écartés : pub (faible revenu, PvZ avec pub noté 3,2), portails web (CrazyGames refuse les jeux
pour enfants, Poki exige l'exclusivité web), payant au téléchargement (3,3 % d'apps payantes sur Google Play).
