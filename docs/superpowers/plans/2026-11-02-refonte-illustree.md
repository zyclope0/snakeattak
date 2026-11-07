# Refonte illustrée Implementation Plan

> Réalisation autonome autorisée. Domaines indépendants répartis suivant
> superpowers:dispatching-parallel-agents ; intégration et vérification par l'agent racine.

**Goal:** Livrer une 0.11 illustrée, lisible, avec IA moins hésitante et trois clairières.
**Spec:** docs/superpowers/specs/2026-11-02-refonte-illustree-design.md
**Architecture:** Moteur pur, cartes explicites, atlas Vite, Phaser observateur, HTML tactile.
**Stack:** Node24, TypeScript, Phaser3, Vite, aucun backend.

## Contraintes

Conserver les règles et catalogue validés. Source 0.10 conservée dans
/workspace/conquete-serpents-baseline-0.10 et archives précédemment livrées.
Ne pas fusionner les responsabilités : moteur, interface et rendu ont des propriétaires.

## Tâches

- [x] Générer et inspecter planche test, puis famille d'atlas, terrain et objets.
- [x] Domaine interface : supprimer l'habillage de site vitrine, conserver commandes/IDs,
      clavier/tactile, guide et statuts ; intégrer portraitStyle fourni par racine.
- [x] Domaine moteur : tests RED→GREEN des cartes, transitions, mécaniques ennemies et IA.
- [x] Racine : intégrer art.ts, atlas et terrain, animation procédurale cohérente, indicateurs.
- [x] Vérifier puis comparer 100 campagnes réelles, contrôler les cas limites et performances.
- [x] Revue finale indépendante, verify/browser/portable, provenance et livraison HTTPS.

## Risques à examiner

Atlas mal cadré ou mauvaise transparence ; fausse route dessinée ; unité dans un rocher
après transition ; changement de carte global cassant deux simulations simultanées ;
méchant impossible à arrêter ; changement de cible permanent ; formulaire ou dialogue
inaccessible au tactile ; budget d'images sur tablette ; répétition simplement cachée
par les nouvelles images. Les impressions de plaisir restent à recueillir en famille.

## Bilan d'exécution

Générations, interface, moteur, atlas et terrain intégrés ;90tests natifs et contrôles
web/présentation réussis.100campagnes finales87/100victoires, aucun blocage. Revue
indépendante sans Critical/Important, doublons mineurs de l'aide corrigés. Le décor
a été mis en cache après profilage d'une chute de cadence ; restaurationWebGL
et classification du roi ont été corrigées sur reproductions RED→GREEN.

Choix assumés : poses fixes animées procéduralement ;3terrains pour12vagues, pas
3campagnes séparées ; A* en cache conservé au vu des mesures ; statut de camp partagé
entre chapitres, coordonnées invalides relogées. Coût potentiel : pas d'animations
image-par-image et avantage des armées à distance encore à surveiller en famille.
Les essais physiques et le plaisir d'enfants ne sont pas certifiés.

BudgetMagnific2389/2500crédits, vérifié surcompte. Le code et les images demeurent
modulaires ; l'export HTML autonome est un livrable compilé, pas la source de travail.
