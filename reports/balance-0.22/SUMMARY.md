# Bilan final de l’équilibrage 0.22

Conserver les budgets, PV, vitesses et cadences initiaux. Le contrôle adapté gagne **31/32 classiques** et **216/216 missions** sur les cohortes finales ; les compositions aléatoires ou sans contre-aérien restent plus fragiles. La décision de conserver ces paramètres a été écrite avant la lecture du holdout dans [DECISION.md](DECISION.md). Aucun fichier source du moteur n’a été modifié par le travail d’équilibrage.

**1120 parties finales vérifiées, zéro erreur, zéro dépassement de durée.** Toutes les empreintes sources et script sont strictement identiques avant et après chaque cohorte. L’audit reproductible est dans [audit.json](audit.json).

## Classique : comparaison au vrai moteur 0.21

Chaque cellule avec une flèche compare les mêmes graines et la même politique, 0.21 → 0.22. Le holdout utilise 16 graines supplémentaires, distinctes des 16 de découverte.

| Profil | Découverte appariée | Holdout apparié | Total descriptif | Cristal moy. holdout 0.22 | Morts moy. holdout 0.22 | Secondes combat moy. holdout 0.22 |
| --- | --- | --- | --- | --- | --- | --- |
| mixed | 16/16 → 16/16 | 16/16 → 15/16 | 32/32 → 31/32 | 93.8 | 11.6 | 433.2 |
| ranged | 16/16 → 15/16 | 16/16 → 15/16 | 32/32 → 30/32 | 90.9 | 4.2 | 394.3 |
| melee | 16/16 → 10/16 | 16/16 → 14/16 | 32/32 → 24/32 | 45.1 | 15.9 | 443.9 |
| casual | 10/16 → 8/16 | 13/16 → 11/16 | 23/32 → 19/32 | 40.4 | 12.6 | 396.5 |

Le bot mixed lit le rang annoncé, achète réellement les contre-aériens et répartit les médecins à l’arrière par voie. Il a éliminé **317 vrais volants observés, sans fuite**, les trois têtes de chacun des 31 rois vaincus et leurs cours. Ce résultat dépasse l’objectif indicatif d’environ 80 % pour un contrôle compétent, sans réglage ciblé sur les 16 graines de découverte. La victoire n’est pas garantie à melee : ses échecs et son cristal moyen bas illustrent le coût de l’absence de contre-aérien.

La comparaison des explorations a d’abord montré un problème de placement des médecins : les grouper au centre du fort laissait une partie du front hors de leur rayon d’éligibilité depuis le domicile. Répartir légalement leurs positions par voie a amélioré les deux moteurs. Ces changements de bot sont séparés des résultats finaux et ne sont pas présentés comme un réglage des PV ou des cadences.

## Missions

Découverte : six missions × 18 configurations × 3 bots × 2 moteurs =648 parties. Holdout : six missions × 18 configurations × 2 bots sur le candidat uniquement =216 parties ; cette colonne vérifie de nouvelles graines sans comparaison 0.21 appariée.

| Politique | Découverte 0.21 → 0.22 | Holdout candidat seul | Cristal moy. découverte 0.22 | Morts moy. découverte 0.22 |
| --- | --- | --- | --- | --- |
| methodical | 108/108 → 108/108 | 108/108 | 100.0 | 1.03 |
| casual | 94/108 → 83/108 | 90/108 | 66.3 | 2.62 |
| novice | 64/108 → 66/108 | Non mesuré | 46.6 | 3.09 |

Le contrôle gagne 18/18 sur chacune des six missions, dans chaque cohorte. Le casual rencontre surtout une difficulté sur Sonnette et Carrefour : respectivement 8/18 et 5/18 en découverte, puis 10/18 et 8/18 en holdout. Leurs budgets restent 1050 et 1300 ; en découverte le casual y conserve 1073 et 891 pièces moyennes. Augmenter les budgets n’est donc pas étayé par ces observations. Une formation et des achats aléatoires ne profiteraient pas nécessairement des pièces supplémentaires.

## Mécaniques observées dans le holdout classique

Les valeurs volants, retours, recharges et blessés sont des moyennes par partie. Les têtes et escortes sont des totaux sur 16 parties ; l’ordre des têtes est gardienne/cracheuse/mixte, celui des escortes garde/soigneur.

| Profil | Volants tués / échappés | Retours / recharges | Blessés survivants | Têtes tombées | Escortes éliminées |
| --- | --- | --- | --- | --- | --- |
| mixed | 9.81 / 0.00 | 34.25 / 33.75 | 5.06 | 15/15/15 | 30/15 |
| ranged | 10.00 / 0.00 | 20.50 / 20.13 | 2.00 | 15/16/16 | 32/16 |
| melee | 0.00 / 9.81 | 36.56 / 36.00 | 9.94 | 14/14/14 | 28/14 |
| casual | 4.00 / 4.69 | 45.81 / 44.88 | 5.25 | 11/11/11 | 22/11 |

Le stock fini produit de vrais voyages et recharges. Le nombre supérieur de blessés survivants par rapport à 0.21 traduit aussi une armée qui ne se remet plus automatiquement aussi facilement à pleine santé ; les soins ne sont pas restaurés par le bot. Les têtes tombées et la cour sont observées depuis leurs états réels ; aucune attribution de type « meilleur soldat » n’est inventée.

## Paramètres retenus et limites

- Médecin : six bandages, 24 PV, cadence 1,6 s ; infirmier : quatre bandages, 14 PV, cadence 1,4 s. Recharge 4 s sur place au fort.
- Volants : PV × 0,65, vitesse × 1,2, apparition au rang 6 puis augmentation au rang 9 ; contres archer/dragon/tank.
- La vague 12 contient un volant : la cour occupe le slot 4, l’autre volant reste au slot 9. Le total d’un classique complet est donc de 10 vrais volants.
- Roi : PV × 6,5, têtes 50/20/30, deux gardes cuirassés et un soigneur à six charges de 35 PV ; aucune baisse de protection ou de charge recommandée.
- Missions : budgets 450/550/700/850/1050/1300, sans augmentation.

Les simulations décrivent ces politiques, elles ne mesurent pas le plaisir des enfants. Les configurations de mission partagent trois graines permutées ; elles ne sont pas des observations statistiquement indépendantes. Les durées moyennes mêlent victoires et défaites : une défaite plus précoce ne constitue pas une amélioration de rythme. Les trois nouveautés étant actives ensemble, leurs effets ne sont pas isolés. Aucun autre candidat numérique de PV/cadence n’a été simulé et aucun optimum n’est prétendu.

## Preuves et reproduction

- [Classiques de découverte](discovery/classic.md) et [JSON](discovery/classic.json) :128 parties.
- [Missions de découverte](discovery/missions.md) et [JSON](discovery/missions.json) :648 parties.
- [Holdout](holdout/all.md) et [JSON](holdout/all.json) :344 parties.
- [Méthode et commandes](README.md), [décision avant holdout](DECISION.md), [audit](audit.json).

Témoin 0.21 : `00f45e4a07fa5a41c237019e01713a74700dde8d60cee1cab523a8e4ff0785da`. Candidat 0.22 : `1f2da8dce576b5864ba2ec02f1fe174edb9ef8344d66c9b218b5efcf26ff82e5`. Script : `8eda168d6e3d4b096e71d29dcf83ba507b6d7bfe88ce80f55e27d0fbc47a4940`. Les 20 et 23 modules transitifs exacts figurent dans [source-snapshots](source-snapshots/). Les explorations antérieures au gel ont des noms distincts et ne sont pas incluses dans le total 1120.
