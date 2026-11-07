# Cohorte tactique 0.22 — holdout

Commande : `TACTICAL_STAGE=holdout TACTICAL_MODE=all node --experimental-strip-types scripts/tactical-balance-022.mjs`. Discovery and classic holdout jobs use the real 0.21 engine and current default 0.22 engine with identical seed/configuration/bot. Mission holdout uses only the candidate, 6 missions ×18 configurations ×2 bots=216. No LEGACY_BALANCE substitution. Serial execution in one process, no workers.

All actions use Game public commands; mixed/methodical buy at least 3 anti-air from rank6 when affordable, position medics near fort at x924 across lanes with the fewest medics, buy diverse lane coverage, repair <=65 and use powers; melee deliberately has no anti-air; ranged purchases archers/dragons/tanks; casual random unlocked purchases and legal positions, 50% powers; novice one cheap clustered purchase. Public reward skip, no training. Mission prep 4s controlled/1s other; classic10s controlled/3s other.

| Mode | Moteur | Politique | Victoires | Cristal moy. | Pertes moy. | Secondes combat moy. | Volants tués/vus moy. | Retours/recharges moy. | Blessés survivants moy. |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| missions | 0.22 | methodical | 108/108 | 100.0 | 0.9 | 98.6 | 1.0/1.0 | 3.8/3.1 | 3.3 |
| missions | 0.22 | casual | 90/108 | 68.0 | 2.4 | 108.2 | 0.2/0.9 | 3.8/3.4 | 3.1 |
| classic | 0.21 | mixed | 16/16 | 100.0 | 9.5 | 458.8 | 0.0/0.0 | 0.0/0.0 | 1.9 |
| classic | 0.21 | melee | 16/16 | 91.4 | 16.9 | 463.1 | 0.0/0.0 | 0.0/0.0 | 2.6 |
| classic | 0.21 | ranged | 16/16 | 99.4 | 2.8 | 401.0 | 0.0/0.0 | 0.0/0.0 | 0.4 |
| classic | 0.21 | casual | 13/16 | 72.6 | 9.8 | 446.7 | 0.0/0.0 | 0.0/0.0 | 2.1 |
| classic | 0.22 | mixed | 15/16 | 93.8 | 11.6 | 433.2 | 9.8/9.8 | 34.3/33.8 | 5.1 |
| classic | 0.22 | melee | 14/16 | 45.1 | 15.9 | 443.9 | 0.0/9.9 | 36.6/36.0 | 9.9 |
| classic | 0.22 | ranged | 15/16 | 90.9 | 4.2 | 394.3 | 10.0/10.0 | 20.5/20.1 | 2.0 |
| classic | 0.22 | casual | 11/16 | 40.4 | 12.6 | 396.5 | 4.0/8.9 | 45.8/44.9 | 5.3 |

Deaths are disappeared unit IDs. Flying kills are observed removals with HP<=0 and maxHp>0; Game marks escaped enemies with maxHp=0. Entity born and removed within a single step may be unobserved. Head kills are actual positive-to-zero transitions, court heals count consumed charges, supply return/refill count phase transitions. Injured survivors have 0<HP<maxHP at final state.

Descriptive scripted policies, configurations share seeds and are not independent samples. Comparisons do not isolate bandages, flight and boss effects. No human enjoyment estimate, no unit MVP inference. Holdout seeds are reserved and must run only after tuning choice.

Erreurs 0, dépassements 0. Calcul 159.5s. Sources avant/après : 0.21 00f45e4a07fa5a41c237019e01713a74700dde8d60cee1cab523a8e4ff0785da/00f45e4a07fa5a41c237019e01713a74700dde8d60cee1cab523a8e4ff0785da identiques=true; 0.22 1f2da8dce576b5864ba2ec02f1fe174edb9ef8344d66c9b218b5efcf26ff82e5/1f2da8dce576b5864ba2ec02f1fe174edb9ef8344d66c9b218b5efcf26ff82e5 identiques=true. Détails par partie, paire, mission/politique, vagues, achats, têtes et gardes dans all.json.
