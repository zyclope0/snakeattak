# Validation sur graines séparées

Deux cohortes de 324 parties couvrent chacune les six missions, les 18 configurations et trois politiques. Les graines holdout 309031/1567319/37128893 sont disjointes des 104729/831947/20261105 initiales, y compris après les décalages par mission. Le moteur reste à la même empreinte `00f45e4a07fa5a41c237019e01713a74700dde8d60cee1cab523a8e4ff0785da`. La cohorte initiale est conservée séparément.

| Mission | Méthodique initial → holdout | Casual initial → holdout | Novice initial → holdout |
| --- | --- | --- | --- |
| refuge | 18/18 → 18/18 | 18/18 → 18/18 | 18/18 → 18/18 |
| trois-ponts | 18/18 → 18/18 | 18/18 → 18/18 | 18/18 → 18/18 |
| course | 18/18 → 18/18 | 18/18 → 18/18 | 18/18 → 18/18 |
| coquilles | 18/18 → 18/18 | 16/18 → 14/18 | 10/18 → 8/18 |
| sonnette | 18/18 → 18/18 | 10/18 → 15/18 | 0/18 → 1/18 |
| carrefour | 18/18 → 18/18 | 14/18 → 8/18 | 0/18 → 0/18 |

Le holdout compte 262 victoires et 62 défaites, aucune erreur et aucun blocage. Les deux cohortes réunies comptent 528 victoires sur 648, 120 défaites, aucune erreur et aucun dépassement de 300 secondes par vague. Le contrôle méthodique gagne 216/216 ; son cristal descend une fois à 91 dans le holdout sonnette. Les achats spontanés gagnent 25/36 à sonnette et 22/36 à carrefour. Les deux dernières missions restent sensibles aux décisions d’achat et au hasard ; les écarts observés sur la première cohorte n’établissaient pas un classement stable de difficulté.

Les combats actifs observés durent environ **1 à4 minutes** (69 à225 secondes sur les deux cohortes). Les temps de préparation choisis par le joueur s’ajoutent. Les données ne justifient aucune promesse de 5 à 8 minutes de combat actif.

Conserver les budgets et les tempos actuels pour cette livraison reste le conseil. Les novices perdent presque toujours les dernières missions avec beaucoup d’or inutilisé ; les rendre simplement plus riches ne traite pas ce comportement. Surveiller plutôt la compréhension des trois voies, des soins et des renforts. Aucune adaptation du moteur n’a été faite entre les deux cohortes. Ces simulations scriptées ne prouvent pas le plaisir des enfants.

Reproduction : `MISSION_COHORT_SUFFIX=-holdout MISSION_COHORT_SEEDS=309031,1567319,37128893 node --experimental-strip-types scripts/mission-balance-021.mjs`. Détails : [cohort-324-holdout.json](cohort-324-holdout.json). Contrôle du classique : `node --experimental-strip-types scripts/control-classic-021.mjs`, avec les sources 0.20 minimales archivées dans `baseline-0.20/src` et les 21 600 comparaisons dans [classic-control.json](classic-control.json). Les hashes de référence historiques du boss restent inchangés.
