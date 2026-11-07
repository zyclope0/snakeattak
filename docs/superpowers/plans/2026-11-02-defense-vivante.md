# Défense vivante Implementation Plan

> Exécution inline avec superpowers:executing-plans, autonomie déjà demandée.

**Goal:** Répartir les défenses et varier les vagues sans dénaturer le jeu.
**Architecture:** Règles de secteur dans defenders.ts ; tempos dans waves.ts ;
game.ts orchestre, Phaser observe. Sauvegarde rétrocompatible.
**Tech Stack:** Node 24, TypeScript, Phaser 3, Vite ; aucune nouvelle dépendance.
**Spec:** docs/superpowers/specs/2026-11-02-defense-vivante-design.md

## Global Constraints

Trois voies, autonomie, morts définitives, catalogue et graphismes conservés.
Pas de serveur ni de génération payante. Les réglages restent des propositions.

## Review Focus

- Menace derrière un gardien : protéger le cristal au lieu de regarder son secteur.
- Unités près des rochers : retour et interception doivent avoir un chemin légal.
- Ancienne sauvegarde au bord : ancrage de migration explicite, pas de perte du camp.
- Pause et reprise : aucun saut d'éclosion ou de tempo.
- Tireur attaqué au contact : riposte possible, sans danse infinie de recul.

## Tâche 1 — Diagnostic et rôles

- [x] Ajouter mesure de regroupement au banc de 100 parties, conserver les résultats 0.9.
- [x] Tests régressifs : attente à domicile avant entrée ennemie, trois secteurs,
      retour au placement, renfort mobile, riposte au pont, priorité cristal.
- [x] Observer échecs, puis ajouter defenders.ts, homeX et intégrer les comportements.
- [x] Tests sauvegarde v2 et lecture v1 ; implémenter migration sans changer la clé.
- [x] Exécuter toute la suite et comparer un lot isolant les rôles.

## Tâche 2 — Vagues et lisibilité

- [ ] Tests d'intégration : cadence des ruées, trois départs distincts,
      incubations décalées et pause.
- [x] Implémenter wavePattern/interval/lane ; reprendre les annonces dans waves.ts.
- [x] Montrer les points de défense en préparation, expliquer gardiens/tireurs/mobiles.
- [x] Contrôles navigateur spécifiques de ces règles ; aucune fixture en production.

## Tâche 3 — Validation et livraison

- [x] Refaire les 100 politiques/graines et comparer regroupement, victoire et rythme.
- [x] Ajuster seulement si les mesures ou les essais révèlent une régression ; tracer les choix.
- [x] verify, navigateur, présentation et export portable ; revue indépendante finale.
- [x] Documenter chiffres, limites et choix. Livrer jeu et sources via liens HTTPS vérifiés.

## Registre

Dépôt fourni sous forme d'archive sans .git : pas de branche à créer ni à fusionner.
Instantané de référence complet dans /workspace/conquete-serpents-baseline-0.9.
Le travail réversible se fait dans le dossier de projet déjà partagé.
Tests de référence : 56/56, résultat dans /tmp/serpents-baseline-tests.log.

Décisions pendant l’exécution : les médecins ne réparent plus les palissades en bois ; les soigneurs ne bloquent pas seuls une progression ennemie ; les gardiens peuvent fermer la dernière distance et secourir un blocage, pour éviter les duels sans issue. Tests observés en échec avant correction. Une adaptation de l’ancien scénario d’armée était nécessaire : les domiciles réservés empêchent désormais le recrutement infini sur cinq positions vacantes.

Résultat de la revue indépendante : deux problèmes importants reproduits et corrigés avec tests RED→GREEN (objectif de tir dans un rocher, domicile v1 migré dans un rocher), description de recul corrigée. Aucune issue critique. Aucun problème mineur laissé en attente.

Limites maintenues : origine horizontale des anciens placements inconnue, reprise sur un point légal approximatif ; risque d’un placement tactique moins favorable. Les 100 parties et la scène navigateur ne certifient ni le plaisir d’enfants ni la performance sur tablette physique. Les armées à distance restent les plus sûres dans ce lot. Dernier lot : 87/100 victoires, aucun délai maximal atteint, regroupement non mobile 86,5 % → 5,4 %.
