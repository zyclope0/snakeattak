# Lot 3 — Plateau : raccords et halos (v0.28.0, ≈ 4 h)

Objectif : un plateau plus lisible. Navigation, positions des ponts (528,180), (528,324), (528,468),
combats et équilibrage inchangés.

## Constats

| Constat                                                                                                                  | Preuve                                            |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| Les raccords en S entre les voies croisent les chemins comme une tresse : on ne sait plus ce qui passe dessus ou dessous | `../captures/vague-paysage-telephone-812x375.png` |
| Halos bleu pâle derrière les 3 grottes et à droite du refuge (détourage incomplet de la planche `strongholds`)           | même capture                                      |

## Tâches

1. Raccords en S : 40 % plus étroits, texture terre battue, dessinés sous les voies principales,
   pour qu'on les lise comme des chemins secondaires (`src/render/refinedTerrain.ts`).
2. Halos : script reproductible dans `scripts/` qui met à alpha 0 les pixels bleu clair semi-transparents
   en bordure des sujets de `src/assets/illustrated/strongholds.webp`, sans régénérer d'image.
   Garder l'original à côté ; documenter dans `public/asset-provenance.md`.

## Critères

- Captures avant/après à 1280×800 et 812×375 ; plus aucun pixel bleu clair visible autour des grottes et du refuge.
- Tests de rendu (`npm run test:render`, `npm run test:stage`) verts.
- Critères communs du README.
