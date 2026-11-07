# Cohorte tactique 0.22 — discovery

Commande : `TACTICAL_STAGE=discovery TACTICAL_MODE=smoke node --experimental-strip-types scripts/tactical-balance-022.mjs`. Every job uses the real 0.21 engine and current default 0.22 engine with identical seed/configuration/bot. No LEGACY_BALANCE substitution. Serial execution in one process, no workers.

All actions use Game public commands; mixed/methodical buy at least 3 anti-air from rank6 when affordable, position medics near fort, buy diverse lane coverage, repair <=65 and use powers; melee deliberately has no anti-air; ranged purchases archers/dragons/tanks; casual random unlocked purchases and legal positions, 50% powers; novice one cheap clustered purchase. Public reward skip, no training. Mission prep 4s controlled/1s other; classic10s controlled/3s other.

| Mode | Moteur | Politique | Victoires | Cristal moy. | Pertes moy. | Secondes combat moy. | Volants tués/vus moy. | Retours/recharges moy. | Blessés survivants moy. |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| missions | 0.21 | methodical | 6/6 | 100.0 | 1.8 | 100.3 | 0.0/0.0 | 0.0/0.0 | 4.0 |
| missions | 0.21 | casual | 6/6 | 89.2 | 2.5 | 112.8 | 0.0/0.0 | 0.0/0.0 | 3.3 |
| missions | 0.21 | novice | 4/6 | 47.2 | 3.5 | 104.6 | 0.0/0.0 | 0.0/0.0 | 2.0 |
| missions | 0.22 | methodical | 6/6 | 100.0 | 1.7 | 99.4 | 1.0/1.0 | 0.5/0.5 | 4.2 |
| missions | 0.22 | casual | 5/6 | 75.8 | 2.8 | 109.3 | 1.0/1.0 | 4.5/4.0 | 3.8 |
| missions | 0.22 | novice | 4/6 | 47.2 | 3.2 | 104.9 | 0.7/0.8 | 0.0/0.0 | 2.0 |
| classic | 0.21 | mixed | 1/1 | 100.0 | 16.0 | 410.2 | 0.0/0.0 | 0.0/0.0 | 2.0 |
| classic | 0.21 | melee | 0/1 | 0.0 | 25.0 | 469.9 | 0.0/0.0 | 0.0/0.0 | 8.0 |
| classic | 0.21 | ranged | 1/1 | 100.0 | 1.0 | 377.3 | 0.0/0.0 | 0.0/0.0 | 4.0 |
| classic | 0.21 | casual | 0/1 | 0.0 | 21.0 | 418.4 | 0.0/0.0 | 0.0/0.0 | 4.0 |
| classic | 0.22 | mixed | 0/1 | 0.0 | 12.0 | 272.1 | 3.0/3.0 | 11.0/11.0 | 6.0 |
| classic | 0.22 | melee | 0/1 | 0.0 | 25.0 | 429.3 | 11.0/11.0 | 21.0/20.0 | 7.0 |
| classic | 0.22 | ranged | 1/1 | 100.0 | 3.0 | 378.3 | 11.0/11.0 | 17.0/17.0 | 0.0 |
| classic | 0.22 | casual | 0/1 | 0.0 | 16.0 | 385.8 | 8.0/9.0 | 35.0/34.0 | 3.0 |

Deaths are disappeared unit IDs. Flying kills are observed removals with HP<=0; positive HP removals count as escapes. Entity born and removed within a single step may be unobserved. Head kills are actual positive-to-zero transitions, court heals count consumed charges, supply return/refill count phase transitions. Injured survivors have 0<HP<maxHP at final state.

Descriptive scripted policies, configurations share seeds and are not independent samples. Comparisons do not isolate bandages, flight and boss effects. No human enjoyment estimate, no unit MVP inference. Holdout seeds are reserved and must run only after tuning choice.

Erreurs 0, dépassements 0. Calcul 11.1s. Sources avant/après : 0.21 00f45e4a07fa5a41c237019e01713a74700dde8d60cee1cab523a8e4ff0785da/00f45e4a07fa5a41c237019e01713a74700dde8d60cee1cab523a8e4ff0785da identiques=true; 0.22 0ba2794b47daf0532cbae04702459a5c8848155c69ac848dc6b0e44e96681abf/0ba2794b47daf0532cbae04702459a5c8848155c69ac848dc6b0e44e96681abf identiques=true. Détails par partie, paire, mission/politique, vagues, achats, têtes et gardes dans smoke.json.
