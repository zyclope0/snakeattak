# Lot 1 — Affichage ordinateur et petits défauts (v0.27.0, ≈ 6 h)

Objectif : le plateau s'affiche en entier dès le lancement, sur ordinateur comme sur téléphone,
et les petits défauts visibles disparaissent. Aucune règle de jeu ne change.

## Constats

| Constat                                                                                  | Preuve                                                                                                |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Le défilement de l'accueil est conservé au lancement : HUD et haut du plateau hors écran | 422 px à 1280×800 ; `../captures/plateau-decale-1280x800.png`                                         |
| Même en haut de page, le plateau ne tient pas : 320 px d'interface au-dessus             | 480/514 px visibles (1280×800), 448/563 (1366×768)                                                    |
| Bouton « Déployer » sous le pli du dialogue de préparation                               | `../captures/preparation-bouton-sous-le-pli-1280x800.png`                                             |
| HUD paysage téléphone : Pause, Vitesse, Accueil, Renforts, Lancer à 36 px de haut        | script d'audit                                                                                        |
| Texte de victoire « douze vagues » après une mission de 3 vagues                         | `src/ui/coaching.ts:44`                                                                               |
| Cadre vide à côté du titre du tiroir des renforts                                        | `../captures/tiroir-renforts-812x375.png`                                                             |
| 4 textes de l'accueil sous 4,5:1                                                         | axe-core : `#home-active-team`, `.eyebrow` des deux cartes, `#chapter-0 small` (2,09:1 sur fond vert) |

## Tâches (un commit par point, `npm run build` après chaque point)

1. Au lancement d'une mission, d'une reprise ou de l'aventure classique, remettre le défilement en haut.
2. Ordinateur : plateau entier visible sans défiler à 1280×800 et 1366×768. Ramener l'interface au-dessus
   du plateau à 120 px au plus : fusionner le bandeau de mission avec le titre du panneau, masquer le
   bandeau de conseil quand il est vide, déplacer état des voies, message, héros et prochaine vague dans
   le panneau de droite. Partir de la media query `(min-width: 921px) and (max-height: 760px)` et l'étendre.
3. Dialogue de préparation : pied de dialogue fixe, « Déployer » visible sans défiler à 1280×800 et 812×375.
4. HUD paysage téléphone : tous les boutons à 48×48 px minimum.
5. Texte de victoire adapté au mode et au nombre de vagues.
6. Tiroir des renforts : remplir ou retirer le cadre vide.
7. Contraste ≥ 4,5:1 pour les 4 textes signalés.

## Critères

- Script d'audit : défilement 0 et plateau entier visible aux 3 tailles ; 0 cible < 48 px en 812×375.
- axe-core sans violation de contraste sur l'accueil (ajouter le contrôle au script si utile).
- Critères communs du README.
