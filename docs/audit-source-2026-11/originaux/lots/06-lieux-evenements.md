# Lot 6 — Nouveaux lieux et événements de mission (v0.33.0, ≈ 8 h, après la sortie)

Objectif : plus de variété entre deux parties. Change le tirage de départ : valeurs proposées puis
validées par le parent et l'enfant (voir `GAME_DESIGN.md`). Lire `docs/CARTES-CODES-0.25.md`.

## Tâches

1. Nouveaux lieux : intégrer les fonds de `../assets-proposes/` comme terrains supplémentaires.
   - `terrain-crue.png` : prêt à intégrer (berges humides après la crue).
   - `terrain-marais.png` : style plus « gravé » que les autres fonds et centre plus chargé ;
     à montrer au parent avant intégration (régénération possible, 175 crédits Magnific).
   - Pour les deux : conversion en WebP 1600×900 qualité 88, comme les fonds existants
     (`public/asset-provenance.md`).
2. Un 4e axe au tirage de départ, l'événement : aucun, pluie (serpents plus lents), nuit (portée réduite,
   lucioles), vent (tirs déviés). Valeurs proposées puis vérifiées avec `npm run balance:lab`.
3. Tiré avec la graine, annoncé par une carte illustrée dans la préparation. Rendu en code
   (teinte, particules, son), sans nouvelle image.
4. Codes de départ : nouvelle version de code ; les anciens codes restent lisibles et donnent
   « aucun événement » et les lieux d'origine.

## Critères

- Même code = même partie.
- Taux de victoire de chaque mission dans le laboratoire d'équilibrage à ±10 points de l'actuel.
- Critères communs du README.

Référence : aucune trouvée pour ce point ; c'est une hypothèse de conception à tester avec les enfants.
