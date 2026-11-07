# Missions 0.21 — cohorte descriptive de 324 parties

Commande : `node --experimental-strip-types scripts/mission-balance-021.mjs`. Chaque mission couvre les 18 configurations réelles et les trois politiques. Les graines sont identiques entre politiques pour comparer les achats, et distribuées selon une permutation fixe entre configurations. Une seule graine par couple mission/configuration : les écarts ne séparent pas statistiquement terrain, plan et hasard.

Aucune mutation privée : achats, préparation, vagues, réparation, encouragement et miel passent par Game public. Durée plafonnée à 300 s par vague. Les unités mortes sont observées par disparition d’identité. Le contrôle dépense efficacement et soigne ; casual achète 1–3 unités au hasard ; novice achète une unité peu chère et groupe ses achats à l’arrière sans pouvoirs.

| Mission | Politique | Victoires | Cristal minimum | Secondes moy. (min–max) | Pertes moy. | Dépenses moy. | Or final moy. |
| --- | --- | --- | --- | --- | --- | --- | --- |
| refuge | methodical | 18/18 | 100 | 81.8 (74–92) | 0.0 | 830 | 313 |
| refuge | casual | 18/18 | 100 | 77.5 (69–87) | 0.2 | 617 | 526 |
| refuge | novice | 18/18 | 91 | 84.7 (73–99) | 0.8 | 277 | 864 |
| trois-ponts | methodical | 18/18 | 100 | 83.6 (76–98) | 0.1 | 1040 | 344 |
| trois-ponts | casual | 18/18 | 91 | 84.6 (74–97) | 0.1 | 890 | 493 |
| trois-ponts | novice | 18/18 | 55 | 96.7 (88–109) | 2.0 | 225 | 1131 |
| course | methodical | 18/18 | 100 | 88.2 (72–103) | 0.3 | 1280 | 395 |
| course | casual | 18/18 | 91 | 85.5 (71–105) | 0.8 | 1012 | 663 |
| course | novice | 18/18 | 46 | 103.3 (92–113) | 2.7 | 320 | 1331 |
| coquilles | methodical | 18/18 | 100 | 104.9 (88–133) | 1.7 | 1550 | 416 |
| coquilles | casual | 16/18 | 0 | 109.9 (85–139) | 3.3 | 1214 | 665 |
| coquilles | novice | 10/18 | 0 | 127.5 (113–141) | 4.6 | 320 | 1418 |
| sonnette | methodical | 18/18 | 100 | 100.0 (93–113) | 2.6 | 1800 | 483 |
| sonnette | casual | 10/18 | 0 | 125.2 (87–143) | 5.2 | 847 | 1110 |
| sonnette | novice | 0/18 | 0 | 117.4 (89–146) | 4.6 | 279 | 1403 |
| carrefour | methodical | 18/18 | 100 | 134.0 (119–159) | 2.1 | 2520 | 522 |
| carrefour | casual | 14/18 | 0 | 164.1 (121–225) | 4.9 | 1684 | 1098 |
| carrefour | novice | 0/18 | 0 | 116.8 (84–148) | 5.2 | 339 | 1620 |

Erreurs : 0. Délais dépassés : 0. Durée totale de calcul : 25.3 s. JSON détaillé : `cohort-324.json`, avec achats par type, vagues, pertes, morts, apparitions restantes et métriques par configuration.

Empreinte des sources : `00f45e4a07fa5a41c237019e01713a74700dde8d60cee1cab523a8e4ff0785da`. Les sources ont été vérifiées identiques avant et après mesure. Aucun ajustement de budget automatique. Ces bots ne prouvent ni le plaisir des enfants, ni une difficulté universelle.
