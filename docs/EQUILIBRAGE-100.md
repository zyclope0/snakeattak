# Équilibrage et chemins — 100 campagnes sur la 0.9

Les chemins sont assez longs pour laisser un temps de réaction. Les rallonger ajouterait
de l’attente ; la priorité mesurée est de vérifier l’avantage des armées à distance.
Ce diagnostic ne change aucune règle du jeu.

## Résultat des campagnes

96/100 victoires ; 4 défaites ; aucun blocage jusqu’au délai de 240 secondes par vague.

| Politique       | Victoires | Base finale moyenne | Morts alliés moyens | Durée médiane des victoires, préparation comprise |
| --------------- | --------- | ------------------- | ------------------- | ------------------------------------------------- |
| Équilibrée      | 20/20     | 92.7/100            | 0.55                | 7.75 min                                          |
| Mêlée et soins  | 20/20     | 94.0/100            | 0.60                | 8.01 min                                          |
| Distance        | 20/20     | 100.0/100           | 0.05                | 6.93 min                                          |
| Unités lourdes  | 18/20     | 73.8/100            | 0.75                | 8.84 min                                          |
| Choix spontanés | 18/20     | 79.7/100            | 1.90                | 8.01 min                                          |

Les durées sont des secondes de jeu à ×1. Chaque vague a une préparation fixe de 10 s,
sans temps de lecture ni délai de clic. Les moyennes de base et de morts incluent les défaites.
Les valeurs de durée concernent uniquement les victoires.

## Longueur et rythme

540 traversées de contrôle, hors campagnes : vagues 1/6/12, trois variantes et trois
voies d’entrée, 20 graines. Un seul serpent, aucun défenseur ni œuf, pas de miel.
Le script force le type et la voie d’entrée après le premier spawn ; les choix aux
jonctions, obstacles, vitesses et passage dans la base restent ceux du moteur réel.
Les variantes rapides/blindées des sondes à la vague 1 sont théoriques et ne prétendent
pas décrire les ennemis réellement débloqués à cette vague.

À la vague 12, temps médians depuis le départ à gauche :

| Type   | Première jonction | Entrée du camp, x ≥ 600 | Base atteinte, x > 1000 |
| ------ | ----------------- | ----------------------- | ----------------------- |
| Normal | 4,9 s             | 12,6 s                  | 24,4 s                  |
| Rapide | 3,4 s             | 8,6 s                   | 16,3 s                  |
| Blindé | 6,9 s             | 17,4 s                  | 33,2 s                  |

Le chemin médian représente environ 1 190 unités du plateau, avec les détours.
La première attaque médiane des vraies vagues arrive entre 7,8 et 13,3 s ; leur
durée médiane va de 24,6 à 37,8 s. La vitesse ×2 est déjà disponible.
Les médianes de traversée ne sont pas déduites des seuls survivants des campagnes :
ce biais aurait caché les serpents éliminés avant le camp.

## Où se trouve l’avantage à examiner

La politique à distance gagne 20/20 fois, avec zéro dégât au camp et un seul mort allié
sur les vingt campagnes. 3987/4000 ennemis tués par cette politique meurent
avant x ≥ 600. Les défenseurs à portée longue interceptent en amont ; c’est une piste
à isoler avant d’ajuster portée, dégâts ou prix. Le test ne prouve pas qu’une seule
unité ou règle explique ce résultat.

Les défaites des armées lourdes surviennent aux vagues 6 et 12 sans mort alliée :
survivre ne suffit pas à empêcher les passages. La mobilité et la couverture des voies
méritent donc autant d’attention que les PV. Les choix spontanés perdent aux vagues 8
et 11, avec des achats moins fréquents et davantage d’or conservé.

Suite recommandée : garder le terrain ; comparer les mêmes politiques en isolant
portée, soins et couverture ; proposer les éventuels réglages plus exigeants dans un
défi distinct, après un essai avec l’enfant. Ne pas durcir le jeu familial sur ces seuls bots.

## Méthode et limites

- Moteur de production `src/game.ts`, sans rendu, à 30 Hz ; pas de modification des
  PV, récompenses, coûts, ennemis, œufs ou ressources pour les 100 campagnes.
- 20 graines initiales appariées × 5 politiques ; décisions d’achat avec un générateur
  distinct. Les états et tirages suivants peuvent diverger avec les actions des politiques.
- Les quatre politiques structurées achètent des médecins : les labels indiquent une
  préférence offensive, pas une armée composée exclusivement d’un seul type.
- Achats avant les vagues uniquement, réparation si la base est à 65 PV ou moins,
  miel à 8 s vers la voie la mieux défendue ; politique spontanée : 1–3 achats aléatoires,
  placements légaux aléatoires et miel entre 3 et 11 s sur une voie aléatoire.
- Les médecins peuvent soigner pendant les 10 s de préparation, comme dans le jeu.
  Il faut une comparaison dédiée pour mesurer leur contribution, pas les accuser d’un bug.
- Le signal `attackStateSeconds` compte des états d’attaque observés ; ce n’est pas une
  mesure fiable du temps d’engagement continu ni du plaisir ressenti. Il n’est pas utilisé
  pour déduire un taux d’ennui. Les attaques alliées sont ponctuelles, les attaques ennemies
  peuvent rester actives entre deux coups.
- 1,418,304 pas du moteur ; coût moyen 0.046 ms,
  95e percentile 0.159 ms échantillonné un pas sur 30 sur ce cloud.
  Hors rendu Phaser/GPU, hors téléphone ou tablette physique. Ce n’est pas une garantie FPS.
- 20 graines par politique, pas 100 enfants ; les écarts de 20/20 à 18/20 ne suffisent pas
  à établir un classement statistique définitif. Aucun nouveau niveau de difficulté livré.

## Reproduire

Node 24 et `npm ci`, puis `npm run balance` et `npm run balance:paths`.
`npm run balance` s’arrête en erreur si une campagne reste bloquée ; le résultat est
dans `reports/balance-100.json`, le résumé dans `reports/balance-summary.json`.
Les 540 sondes sont dans `reports/path-transit.json`.
Pour le CSV, le graphique et le PDF : `python scripts/balance-report.py`
(matplotlib requis uniquement pour ce rapport, pas pour jouer ou simuler).

Empreinte SHA-256 des fichiers TypeScript à la racine de `src/` lors de la mesure :
`8b631ed0f82097ead519e6858e77f9535b5a79e4f220b99564329c470f44ac6d`. Les scripts exacts accompagnent le rapport.
