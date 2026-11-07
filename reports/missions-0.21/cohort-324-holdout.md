# Missions 0.21 — cohorte descriptive de 324 parties-holdout

Commande : `MISSION_COHORT_SUFFIX=-holdout MISSION_COHORT_SEEDS=309031,1567319,37128893 node --experimental-strip-types scripts/mission-balance-021.mjs`. Chaque mission couvre les 18 configurations réelles et les trois politiques. Les graines sont identiques entre politiques pour comparer les achats, et distribuées selon une permutation fixe entre configurations. Une seule graine par couple mission/configuration : les écarts ne séparent pas statistiquement terrain, plan et hasard.

Aucune mutation privée : achats, préparation, vagues, réparation, encouragement et miel passent par Game public. Durée plafonnée à 300 s par vague. Les unités mortes sont observées par disparition d’identité. Le contrôle dépense efficacement et soigne ; casual achète 1–3 unités au hasard ; novice achète une unité peu chère et groupe ses achats à l’arrière sans pouvoirs.

| Mission | Politique | Victoires | Cristal minimum | Secondes moy. (min–max) | Pertes moy. | Dépenses moy. | Or final moy. |
| --- | --- | --- | --- | --- | --- | --- | --- |
| refuge | methodical | 18/18 | 100 | 83.3 (76–92) | 0.0 | 830 | 313 |
| refuge | casual | 18/18 | 100 | 79.6 (74–87) | 0.1 | 718 | 425 |
| refuge | novice | 18/18 | 100 | 86.5 (75–99) | 0.7 | 275 | 868 |
| trois-ponts | methodical | 18/18 | 100 | 87.8 (78–94) | 0.1 | 1040 | 344 |
| trois-ponts | casual | 18/18 | 91 | 82.4 (78–88) | 0.3 | 930 | 453 |
| trois-ponts | novice | 18/18 | 64 | 92.5 (79–110) | 1.5 | 313 | 1058 |
| course | methodical | 18/18 | 100 | 88.8 (76–100) | 0.3 | 1280 | 395 |
| course | casual | 18/18 | 46 | 89.3 (75–110) | 1.3 | 875 | 787 |
| course | novice | 18/18 | 55 | 105.3 (95–113) | 2.8 | 312 | 1333 |
| coquilles | methodical | 18/18 | 100 | 106.0 (89–164) | 1.5 | 1550 | 416 |
| coquilles | casual | 14/18 | 0 | 124.8 (103–146) | 3.6 | 740 | 1074 |
| coquilles | novice | 8/18 | 0 | 128.7 (115–148) | 4.2 | 313 | 1391 |
| sonnette | methodical | 18/18 | 91 | 103.0 (91–117) | 2.6 | 1800 | 482 |
| sonnette | casual | 15/18 | 0 | 133.5 (99–167) | 5.6 | 1075 | 1082 |
| sonnette | novice | 1/18 | 0 | 114.8 (82–145) | 3.9 | 209 | 1458 |
| carrefour | methodical | 18/18 | 100 | 134.4 (122–155) | 3.3 | 2520 | 522 |
| carrefour | casual | 8/18 | 0 | 154.3 (113–186) | 5.2 | 1426 | 1129 |
| carrefour | novice | 0/18 | 0 | 113.2 (91–144) | 4.0 | 239 | 1649 |

Erreurs : 0. Délais dépassés : 0. Durée totale de calcul : 24.2 s. JSON détaillé : `cohort-324-holdout.json`, avec achats par type, vagues, pertes, morts, apparitions restantes et métriques par configuration.

Empreinte des sources : `00f45e4a07fa5a41c237019e01713a74700dde8d60cee1cab523a8e4ff0785da`. Les sources ont été vérifiées identiques avant et après mesure. Aucun ajustement de budget automatique. Ces bots ne prouvent ni le plaisir des enfants, ni une difficulté universelle.
