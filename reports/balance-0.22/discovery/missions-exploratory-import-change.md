# Cohorte tactique 0.22 — discovery

Commande : `TACTICAL_STAGE=discovery TACTICAL_MODE=missions node --experimental-strip-types scripts/tactical-balance-022.mjs`. Every job uses the real 0.21 engine and current default 0.22 engine with identical seed/configuration/bot. No LEGACY_BALANCE substitution. Serial execution in one process, no workers.

All actions use Game public commands; mixed/methodical buy at least 3 anti-air from rank6 when affordable, position medics near fort, buy diverse lane coverage, repair <=65 and use powers; melee deliberately has no anti-air; ranged purchases archers/dragons/tanks; casual random unlocked purchases and legal positions, 50% powers; novice one cheap clustered purchase. Public reward skip, no training. Mission prep 4s controlled/1s other; classic10s controlled/3s other.

| Mode | Moteur | Politique | Victoires | Cristal moy. | Pertes moy. | Secondes combat moy. | Volants tués/vus moy. | Retours/recharges moy. | Blessés survivants moy. |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| missions | 0.21 | methodical | 108/108 | 99.9 | 2.0 | 100.1 | 0.0/0.0 | 0.0/0.0 | 3.6 |
| missions | 0.21 | casual | 94/108 | 74.0 | 2.4 | 107.8 | 0.0/0.0 | 0.0/0.0 | 2.9 |
| missions | 0.21 | novice | 64/108 | 46.4 | 3.3 | 107.7 | 0.0/0.0 | 0.0/0.0 | 2.0 |
| missions | 0.22 | methodical | 108/108 | 99.5 | 2.0 | 99.8 | 1.0/1.0 | 0.8/0.6 | 3.8 |
| missions | 0.22 | casual | 83/108 | 66.3 | 2.6 | 104.3 | 0.0/0.9 | 3.1/2.7 | 3.4 |
| missions | 0.22 | novice | 66/108 | 46.6 | 3.1 | 105.6 | 0.0/0.7 | 0.0/0.0 | 2.1 |

Deaths are disappeared unit IDs. Flying kills are observed removals with HP<=0 and maxHp>0; Game marks escaped enemies with maxHp=0. Entity born and removed within a single step may be unobserved. Head kills are actual positive-to-zero transitions, court heals count consumed charges, supply return/refill count phase transitions. Injured survivors have 0<HP<maxHP at final state.

Descriptive scripted policies, configurations share seeds and are not independent samples. Comparisons do not isolate bandages, flight and boss effects. No human enjoyment estimate, no unit MVP inference. Holdout seeds are reserved and must run only after tuning choice.

Erreurs 0, dépassements 0. Calcul 54.7s. Sources avant/après : 0.21 00f45e4a07fa5a41c237019e01713a74700dde8d60cee1cab523a8e4ff0785da/00f45e4a07fa5a41c237019e01713a74700dde8d60cee1cab523a8e4ff0785da identiques=true; 0.22 0ba2794b47daf0532cbae04702459a5c8848155c69ac848dc6b0e44e96681abf/2ae7723ae4aa387ece776b40f9eeb50ba28dd0ff6d3efb3f17836c32ef679c0c identiques=false. Détails par partie, paire, mission/politique, vagues, achats, têtes et gardes dans missions.json.
