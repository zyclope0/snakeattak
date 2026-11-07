# Cohorte tactique 0.22 — discovery

Commande : `TACTICAL_STAGE=discovery TACTICAL_MODE=classic node --experimental-strip-types scripts/tactical-balance-022.mjs`. Discovery and classic holdout jobs use the real 0.21 engine and current default 0.22 engine with identical seed/configuration/bot. Mission holdout uses only the candidate, 6 missions ×18 configurations ×2 bots=216. No LEGACY_BALANCE substitution. Serial execution in one process, no workers.

All actions use Game public commands; mixed/methodical buy at least 3 anti-air from rank6 when affordable, position medics near fort at x924 across lanes with the fewest medics, buy diverse lane coverage, repair <=65 and use powers; melee deliberately has no anti-air; ranged purchases archers/dragons/tanks; casual random unlocked purchases and legal positions, 50% powers; novice one cheap clustered purchase. Public reward skip, no training. Mission prep 4s controlled/1s other; classic10s controlled/3s other.

| Mode | Moteur | Politique | Victoires | Cristal moy. | Pertes moy. | Secondes combat moy. | Volants tués/vus moy. | Retours/recharges moy. | Blessés survivants moy. |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| classic | 0.21 | mixed | 16/16 | 99.4 | 8.7 | 453.1 | 0.0/0.0 | 0.0/0.0 | 2.1 |
| classic | 0.21 | melee | 16/16 | 87.6 | 17.2 | 477.3 | 0.0/0.0 | 0.0/0.0 | 2.9 |
| classic | 0.21 | ranged | 16/16 | 100.0 | 1.8 | 386.1 | 0.0/0.0 | 0.0/0.0 | 0.6 |
| classic | 0.21 | casual | 10/16 | 52.4 | 12.8 | 415.7 | 0.0/0.0 | 0.0/0.0 | 3.4 |
| classic | 0.22 | mixed | 16/16 | 100.0 | 11.2 | 432.4 | 10.0/10.0 | 34.6/33.9 | 6.1 |
| classic | 0.22 | melee | 10/16 | 32.3 | 16.1 | 435.3 | 0.0/9.9 | 35.7/34.9 | 9.7 |
| classic | 0.22 | ranged | 15/16 | 90.2 | 6.9 | 407.2 | 10.0/10.0 | 23.1/22.8 | 2.1 |
| classic | 0.22 | casual | 8/16 | 26.5 | 12.6 | 379.2 | 1.9/7.6 | 49.8/48.0 | 5.4 |

Deaths are disappeared unit IDs. Flying kills are observed removals with HP<=0 and maxHp>0; Game marks escaped enemies with maxHp=0. Entity born and removed within a single step may be unobserved. Head kills are actual positive-to-zero transitions, court heals count consumed charges, supply return/refill count phase transitions. Injured survivors have 0<HP<maxHP at final state.

Descriptive scripted policies, configurations share seeds and are not independent samples. Comparisons do not isolate bandages, flight and boss effects. No human enjoyment estimate, no unit MVP inference. Holdout seeds are reserved and must run only after tuning choice.

Erreurs 0, dépassements 0. Calcul 126.4s. Sources avant/après : 0.21 00f45e4a07fa5a41c237019e01713a74700dde8d60cee1cab523a8e4ff0785da/00f45e4a07fa5a41c237019e01713a74700dde8d60cee1cab523a8e4ff0785da identiques=true; 0.22 1f2da8dce576b5864ba2ec02f1fe174edb9ef8344d66c9b218b5efcf26ff82e5/1f2da8dce576b5864ba2ec02f1fe174edb9ef8344d66c9b218b5efcf26ff82e5 identiques=true. Détails par partie, paire, mission/politique, vagues, achats, têtes et gardes dans classic.json.
