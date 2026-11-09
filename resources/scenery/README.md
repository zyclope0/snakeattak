# Cadres graphiques fournis — 0.34.0

Les deux originaux PNG HD sont conservés, sans modification, dans
`docs/resources-2026-11/assets`. Leur provenance fournie par le créateur est
[documentée](../../docs/resources-2026-11/PROVENANCE.md).

`python scripts/export-scenery-034.py` (Python3 et Pillow) produit les deux WebP
1600×900, qualité88/méthode6. Recadrage central géométrique et redimensionnement
Lanczos uniquement ; aucune retouche ou génération. [Manifeste](manifest.json) :
SHA256 des originaux et dérivés, dimensions et tailles. Pas de nouvelle dépendance
JavaScript ni service dans le jeu.

Le rendu utilise uniquement les bords, fondus sur les sols calmes sculptés :
crue aux clairières classiques et géométries0/2, marais aux géométries1 et jardin
des vieilles pierres. Bosquet ambré inchangé. Il ne s’agit pas de nouveaux lieux
ou événements météorologiques. Les routes, collisions, ponts et spawns sont ceux
du jeu existant. Aucune nouvelle mécanique n’est déduite de l’image.

Une seule texture de cadre utile est demandée par le chargeur Phaser ; aucune
au menu. Les copies recadrées sont dessinées une fois dans le RenderTexture
existant puis détruites. Aucun masque WebGL, filtre ou animation permanente.
