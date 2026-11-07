# Cohorte tactique 0.22 — discovery

Commande : `TACTICAL_STAGE=discovery TACTICAL_MODE=classic node --experimental-strip-types scripts/tactical-balance-022.mjs`. Every job uses the real 0.21 engine and current default 0.22 engine with identical seed/configuration/bot. No LEGACY_BALANCE substitution. Serial execution in one process, no workers.

All actions use Game public commands; mixed/methodical buy at least 3 anti-air from rank6 when affordable, position medics near fort, buy diverse lane coverage, repair <=65 and use powers; melee deliberately has no anti-air; ranged purchases archers/dragons/tanks; casual random unlocked purchases and legal positions, 50% powers; novice one cheap clustered purchase. Public reward skip, no training. Mission prep 4s controlled/1s other; classic10s controlled/3s other.

| Mode | Moteur | Politique | Victoires | Cristal moy. | Pertes moy. | Secondes combat moy. | Volants tués/vus moy. | Retours/recharges moy. | Blessés survivants moy. |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| classic | 0.21 | mixed | 16/16 | 100.0 | 15.3 | 427.5 | 0.0/0.0 | 0.0/0.0 | 1.4 |
| classic | 0.21 | melee | 5/16 | 24.5 | 23.3 | 465.0 | 0.0/0.0 | 0.0/0.0 | 3.1 |
| classic | 0.21 | ranged | 16/16 | 99.4 | 2.9 | 407.6 | 0.0/0.0 | 0.0/0.0 | 0.6 |
| classic | 0.21 | casual | 10/16 | 52.4 | 12.8 | 415.7 | 0.0/0.0 | 0.0/0.0 | 3.4 |
| classic | 0.22 | mixed | 11/16 | 68.8 | 15.9 | 411.9 | 10.1/10.4 | 16.9/16.3 | 5.2 |
| classic | 0.22 | melee | 7/16 | 19.9 | 20.9 | 412.0 | 0.4/9.5 | 19.1/18.4 | 6.9 |
| classic | 0.22 | ranged | 14/16 | 79.9 | 5.8 | 397.5 | 10.1/10.3 | 17.6/17.4 | 0.6 |
| classic | 0.22 | casual | 7/16 | 25.6 | 12.7 | 377.8 | 2.3/8.2 | 49.2/48.0 | 5.6 |

Deaths are disappeared unit IDs. Flying kills are observed removals with HP<=0 and maxHp>0; Game marks escaped enemies with maxHp=0. Entity born and removed within a single step may be unobserved. Head kills are actual positive-to-zero transitions, court heals count consumed charges, supply return/refill count phase transitions. Injured survivors have 0<HP<maxHP at final state.

Descriptive scripted policies, configurations share seeds and are not independent samples. Comparisons do not isolate bandages, flight and boss effects. No human enjoyment estimate, no unit MVP inference. Holdout seeds are reserved and must run only after tuning choice.

Erreurs 0, dépassements 0. Calcul 104.9s. Sources avant/après : 0.21 00f45e4a07fa5a41c237019e01713a74700dde8d60cee1cab523a8e4ff0785da/00f45e4a07fa5a41c237019e01713a74700dde8d60cee1cab523a8e4ff0785da identiques=true; 0.22 2ae7723ae4aa387ece776b40f9eeb50ba28dd0ff6d3efb3f17836c32ef679c0c/2ae7723ae4aa387ece776b40f9eeb50ba28dd0ff6d3efb3f17836c32ef679c0c identiques=true. Détails par partie, paire, mission/politique, vagues, achats, têtes et gardes dans classic.json.
