# Carte pilote — 0.23

La mission « Les trois ponts » reçoit un nouveau décor dans ses trois dispositions.
Le placement libre et toutes les règles de combat sont conservés.

## Changements visibles

- Fond de clairière généré avec Magnific, centre calme sans aplat rectangulaire.
- Trois ponts de pierre horizontaux aux vrais passages de la grille; petits bosquets
  bas entre les ouvertures, sans colonne de grands arbres.
- Chemins pavés issus des tracés du moteur et bordures de terre adoucies.
- Décor de bordure espacé, échelles et orientations variées, graine visuelle isolée.
- Ombres des acteurs et contours adaptés au terrain clair, repère chaud côté ennemi.
- Antres différenciés, refuge agrandi et cadré; aucun titre peint sur cette carte.
- Un titre de mission, indications de pose sous forme de petites clairières suggérées.

## Architecture

`stageLayout.ts` produit une composition visuelle bornée et reproductible, sans
objet Phaser ni état du combat. `refinedTerrain.ts` la dessine en consommant les
routes existantes. Le décor de fond reste cuit en RenderTexture; le premier plan
est trié selon y et nettoyé à chaque changement de terrain et à la fermeture.
La clef de cache inclut la mission et sa graine, pas l’état évolutif du RNG.
Les autres missions et l’aventure classique gardent leur rendu.

## Assets

Deux générations Nano Banana 2.1 sur Magnific (65 + 65 crédits), puis un détourage
(3 crédits), soit **133 crédits**. Projet « La Conquête des Serpents ».
Prompts, références et créations dans `art-assets-0.23.json`; originaux archivés
avec les sources. Le fond et l’atlas WebP ajoutent 741 788 octets avant compression
HTTP. Les acteurs existants restent utilisés; aucune vidéo ou dépendance 3D.

## Vérification

Résultats des commandes et empreintes : `reports/verification-0.23.json`.
Comparatif des trois dispositions : `artifacts/stage-023/before-layout-*.png`
et `after-layout-*.png`. Le scénario dédié couvre aussi Canvas, perte et
restauration WebGL, changements de mission sans fuite de premier plan et pose
tactile libre hors des suggestions.

Le téléphone n’est pas présent dans cet environnement. L’émulation tactile et la
synchronisation Capacitor ne prouvent pas 30 ou 60 images/s sur Android. Cette
mesure réelle reste nécessaire avant de généraliser la refonte aux autres cartes.
Les sauvegardes de camp restent en version 6; aucune migration nouvelle requise.

## Décisions de périmètre

Le Go utilisateur valide la proposition du lot 1, avec placement libre conservé.
Les ponts commandables, cartes de renforts et cartes par segments appartiennent
à un prochain lot de gameplay; le boss à trois têtes et ses protections demeurent.
