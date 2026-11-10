# Task 3 — relecture ciblée correction I1, round 1

**Verdict : APPROVED. I1 : ADDRESSED.**

Périmètre : FIX_BASE `37c2e2d6fae04ff8c194df2b467a62ddbddc0b82` → HEAD
`bf15c83ea57b816658ea9a7b65ee8aa082a263d6`. Brief, revue initiale, package de
diff fourni, script final, appendice du rapport et reçu `task-3-fix1.json` lus.
Les journaux RED/GREEN et le rapport GREEN hors Git ont été consultés. Aucun
diff Git reconstruit, test relancé, build, changement source/index/branche ou
appel distant ; seul ce rapport est écrit. Cette approbation porte sur le fix,
pas sur la revue globale de branche.

## I1 — ADDRESSED

- Le snapshot mesure désormais `scrollTop`, `clientHeight`, `scrollHeight` et la
  plage du vrai `.catalog-body`, au lieu des anciens conteneurs panel/shop.
- Après stabilisation, une montée native démarrant sur une carte doit augmenter
  l'offset de plus de 1 px ; le geste inverse doit le réduire de plus de 1 px.
  Ce sont les offsets constatés qui font foi, indépendamment de la distance
  demandée au doigt. Les gestes utilisent `Input.dispatchTouchEvent`.
- La limite inférieure est atteinte par gestes natifs, sans écriture de scrollTop
  pour préparer la preuve. Un geste supplémentaire vérifie le maintien à la
  limite réelle (tolérance 1 px) et l'absence de mouvement du document. Le retour
  en haut se fait également par gestes natifs.
- Les cas sans débordement peuvent être neutres ; une assertion finale impose
  au moins un cas réellement débordant et positif. Les cinq cas consignés sont
  positifs : plages 13/53/112/112/53 px, montées observées 13/17/18/18/17 px,
  retour à 0, limites atteintes puis conservées, document 0→0.
- Les protections prix/sélection/ouverture/document accompagnent les étapes de
  cette preuve. Les contrôles historiques cartes verrouillées, sélection armée,
  tap sans achat et navigation vers les 20 IDs sont conservés.

Le contrôle négatif injecte uniquement une CSS de test `touch-action:none`.
Son journal montre l'échec attendu sur la première assertion positive : corps
0→0, client185/scroll198, plage13. Le journal normal annonce 5 cas mobiles,
5 cas positifs, desktop et aucune erreur ; le rapport détaillé confirme les
mesures et 20 alliés atteints pour chacun des cinq cas. Le reçu compact et
l'appendice concordent avec ces preuves sauvegardées.

## Nouveaux défauts introduits dans le fix

Aucun défaut bloquant ou nouveau défaut établi dans le diff ciblé. Les ajouts
restent dans la recette et ses reçus ; aucun changement runtime ou de dépendance
n'apparaît dans le package fourni. Le dossier de sortie optionnel isole les
preuves du fix et conserve le chemin historique par défaut.

## Limites et hors périmètre

M1 journey reste explicitement différé à la revue globale du coordinateur ; il
n'est ni corrigé ni requalifié par cette approbation et ne bloque pas ce fix.
La preuve tactile reste Chromium/CDP, sans validation physique Android. Les
21 commandes et artefacts initiaux de source runtime `9ca13bb` ne sont pas
réexécutés/reconstruits : le reçu en conserve les empreintes et ne prétend pas
à une nouvelle passe globale. Aucune raison concrète de relancer les tests n'a
été trouvée dans cette relecture ciblée.
