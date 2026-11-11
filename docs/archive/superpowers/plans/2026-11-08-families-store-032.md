# Lots 8–9 — plan de préparation

> Exécution inline avec superpowers:executing-plans ; revue indépendante finale.

**Goal:** rendre les prochaines décisions commerciales et le dossier Play vérifiables.
**Architecture:** données de publication et outils séparés du moteur/rendu ; zéro SDK
commercial actif. Préflight strict avec motifs précis, captures du build existant.
**Tech Stack:** Node 24, TypeScript, Playwright, Vite/Capacitor inchangés.
**Spec:** docs/superpowers/specs/2026-11-08-families-store-design.md.

## Contraintes et revue

- Gratuit avec pubs rares, suppression des pubs et cosmétiques sans avantage.
- Au plus une pub par dix minutes entre missions, après deux missions, jamais en vague.
- Aucune limitation de contenu, changement de règles/sauvegardes ou SDK ajouté.
- « Non personnalisé » n'est pas synonyme de « aucune collecte ».
- Préflight bloquant sur compte/identité, tarifs, SDK/achats, confidentialité, IARC,
  icône et validation humaine ; aucun état « prêt à publier » artificiel.
- Images du jeu réel, pas de modification privée des résultats de combat.

### 1. Contrat commercial et préflight

- [x] Écrire contrat, sources, copies et données de préparation.
- [x] RED : défauts de cadence, avantages vendus, confidentialité incompatible,
      traductions trompeuses, images absentes/invalides, empreintes et faux GO.
- [x] Implémenter validateur et CLI strict/draft ; GREEN, suite et build ; commit.

### 2. Dossier visuel et livraison

- [x] Script reproductible de captures sur build de production : trois combats
      téléphone, préparation, tablette et bannière ; dimensions/empreintes exactes.
- [x] Enrichir la recette et produire dossier consultable + ZIP de travail.
- [x] GREEN, revue indépendante/council cinq regards ; corriger défauts importants
      RED→GREEN ; état du plan actualisé et commit.

## Suivi

Ledger manuel : .superpowers/sdd/families-store-032/progress.md ; helpers cloud
indisponibles sur disque. Les actions du parent restent distinctes de la recette locale.

## Résultat

Préparation des lots 8/9 livrée,391 tests/build verts. Revue indépendante et
corrections RED→GREEN. Les services commerciaux et Play restent à intégrer/tester ;
ce plan de préparation ne les déclare pas terminés. Voir le bilan et PLAN-ACTUEL.md.
