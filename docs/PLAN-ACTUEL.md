# Plan actuel — 0.37.0 publiée, remise en ordre en cours

## Remise en ordre — Claude Code, 11 novembre 2026

Trois objectifs du parent : moteur propre, interface stabilisée, projet nettoyé. Ordre retenu :
filet de tests, nettoyage, moteur, interface, conventions. Un lot par PR, sans changer une règle.

- **Lots 0 et 1 (PR nº 8, fusionnée).** Les recettes n'écrivent plus dans des fichiers suivis ;
  5 173 captures et gros rapports sortent du suivi Git (671,7 → 103,1 Mo), récupérables au
  commit `88fdf54` : [ARCHIVES.md](ARCHIVES.md). Aucun fichier de `src/` touché.
- **Tri des documents (PR nº 9, fusionnée).** 162 fichiers historiques rangés dans
  `docs/archive/`, neuf documents vivants listés dans [README.md](README.md).
- **Moteur découpé (cette PR).** `src/game.ts` passe de 1 303 à 395 lignes ; les règles d'un
  pas sont dans `src/engine/`, déplacées sans réécriture. Parties rejouées à l'identique :
  voir la fin d'[ARCHITECTURE.md](ARCHITECTURE.md).
- **Moteur de rendu.** Phaser 3 réévalué et gardé : voir la fin d'[ARCHITECTURE.md](ARCHITECTURE.md).
- **À suivre.** Pages
  Missions, Favoris et Aventure classique sur téléphone, puis `style.css` et `index.html`.
- **Pas vérifié.** Rien sur le S24 ni avec les enfants.

## Interface mobile courte — huit choix réalisés et publiés

La version Android **0.37.0 / code 49** applique les huit choix validés :
accueil court et reprise contextuelle, carnet de six autocollants par mission,
gestion repliée, préparation en sous-vues, catalogue natif paginé en pause avec
budget visible. Les 36 noms/annonces du créateur restent français dans les deux
langues ; moteur, données, sauvegardes et anciens codes sont préservés.

Source produit/tests figée : `b31933bf9f6dc56b9c7bf4d286068f52ff3bf28a`.
[Bilan](BILAN-0.37.0.md), [conseils simulés](archive/CONSEIL-0.37.0.md),
[preuves et reçus](../reports/interface-0370/README.md),
[cadrage](archive/superpowers/specs/2026-11-10-interface-mobile-0370.md).
La correction finale I1/M1/M2 révèle les résultats du catalogue, remet le focus
d’accueil dans la zone visible et répare la recette journey. Verify 549 tests,
9 régressions navigation, journey, gestes natifs cinq tailles + ordinateur,
menus et navigateur sont verts sur la source corrigée. APK debug et portable
HTML/ZIP sont reconstruits ; quatre démarrages froids FR/EN sont verts.
Les 21 gates et la partie authentique antérieurs restent explicitement en `9ca13bb`.
La nouvelle recette et les artefacts sont indexés dans le reçu de livraison. Les anciennes preuves et la version 0.36.2 restent conservées.

**Le site public est en 0.37.0, Sites24.** Revue globale et relecture des trois
correctifs approuvées ; PR7 fusionnée après CI verte. Les fichiers publics sont
identiques au paquet normal de l’APK. Voir le [reçu](../reports/deployment-0.37.0.json).
Les essais S24, TalkBack, enfants et
relecture anglophone native restent attendus. Le petit carnet 568×320 avec marges
conserve un défilement interne ; à 780×360 avec marges les six cartes tiennent.

Le comparatif d’images est séparé et arrêté au [devis partiel](archive/interface-0370/DEVIS-COMPARATIF.md) :
100 crédits Magnific, 1 crédit Higgsfield de base, prix Runway indisponible.
Aucune image ni dépense lancée.

## Avant la 0.37.0

Le journal de Codex jusqu'à la 0.36.2 est dans
[archive/PLAN-ACTUEL-avant-0.37.md](archive/PLAN-ACTUEL-avant-0.37.md).
