# Laboratoire d'équilibrage 0.16

Le laboratoire exécute le vrai `Game`, sans DOM, rendu ni réseau. Il ne change
jamais les PV, l'or, les positions d'unités existantes ou les apparitions. Ses
seules commandes sont `recruit`, `repair`, `offerFeast`, `startWave`, `step`.
Les prix, caractéristiques et déblocages viennent du catalogue du moteur.
Chaque campagne reçoit sa propre copie immuable du réglage.

## Exécution et conservation

```sh
node scripts/balance-lab.mjs --stage discovery --configs /tmp/candidates.json --out reports/discovery-016 --workers 3
```

Le fichier de configurations contient une liste, par exemple :

```json
[
  {
    "id": "baseline",
    "tuning": {
      "bossEnabled": false,
      "bossHpMultiplier": 6,
      "bossShieldFraction": 0,
      "bossShotDamage": 0,
      "splashSecondaryFactor": 1
    }
  },
  { "id": "candidate", "tuning": { "bossShieldFraction": 0.1 } }
]
```

`useDefault: true` appelle exactement `new Game(seed)`. Pour la validation finale,
ajouter aussi le réglage complet attendu dans `tuning` : une divergence avec le
défaut livré produit une erreur conservée, jamais un remplacement silencieux.

Les cohortes sont figées dans `cohortSeeds` : discovery 8 graines, confirmation 12,
holdout 24, sans intersection. Après le constat de pertes précoces du profil mutants,
une extension contrôlée ajoute discovery2 8 graines (offset44) et confirmation2
12 graines (offset52). Ces cinq cohortes totalisent 64 graines disjointes. Le
holdout originel (offset20, 24 graines) reste intact et réservé à la validation
finale ; aucune graine exploratoire ne le remplace. Les huit profils reçoivent les mêmes graines pour
chaque configuration. Les options `--seed-count 1` et `--profiles mixed,casual`
servent seulement aux contrôles exploratoires et marquent `exploratorySubset`.
Elles ne constituent pas un passage complet d'une cohorte.

Trois workers persistants au maximum exécutent les campagnes ; aucune requête
réseau. Les fichiers finaux sont triés par configuration, graine, profil. Chaque
campagne est enregistrée dès sa fin dans `campaigns/`, avec défaite, expiration ou
erreur. Les défaites et expirations incluent un état final complet. Une erreur
moteur conserve sa commande de rejeu et l'état disponible. Le manifeste archive
les empreintes SHA-256 du graphe des sources du moteur et des scripts du laboratoire.
Un changement de ces fichiers pendant la cohorte invalide `sourceUnchanged`.
Le temps réel et le temps CPU du thread sont mesurés séparément ; ils sont exclus
de `resultsHash`, qui couvre tous les résultats de simulation.

```sh
node scripts/balance-lab.mjs --replay reports/discovery-016/campaigns/EXEMPLE.json --out reports/replay-016
```

Le rejeu réexécute depuis la graine, le profil et le réglage conservés ; il compare
l'intégralité des métriques hors performance. Il ne reprend pas l'état final et
ne répare pas une défaite. `equivalent: true` signifie égalité de ces résultats.

## Politiques des bots

Chaque vague utilise un RNG séparé dérivé de graine × profil × vague. Le moteur
garde son propre RNG. Aucun choix ne dépend des callbacks de présentation.
Préparation de 10 secondes à 30 Hz ; durée active limitée à 240 secondes par vague.
Les achats sont tentés au camp puis toutes les 6 secondes de combat, toutes les
18 secondes pour casual. Un achat n'a lieu que si le moteur accepte recrutement,
prix, déblocage et placement. Une réparation est tentée sous 65 PV de refuge
(45 pour casual). Les soins ne ressuscitent personne.

| Profil    | Composition recherchée                                                                                                 | Placement et miel                                                     |
| --------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| mixed     | Archers, boucliers, ninjas, dragons, cavaliers, dinosaures, deux-têtes, tanks, chevaliers, raptors, mutants élastiques | Voie la moins défendue ; miel alterné                                 |
| melee     | Ninjas, batteurs, boucliers, cavaliers, deux-têtes, chevaliers, massues ; jusqu'à trois soigneurs                      | Front distribué ; miel attractif sur voie forte                       |
| ranged    | Archers, dragons, tanks ; soigneurs                                                                                    | Arrière distribué ; miel attractif sur voie forte                     |
| heavy     | Boucliers, chevaliers, deux-têtes, tanks, dinosaures, stégosaures                                                      | Épargne pour la prochaine unité lourde ; miel collant sur voie faible |
| dinosaurs | Raptors, tricératops, petits dinosaures, stégosaures, tyrannosaures                                                    | Front distribué ; miel collant sur voie faible                        |
| mutants   | Mutants roc et élastiques                                                                                              | Front distribué ; miel collant sur voie faible                        |
| casual    | Choix aléatoire parmi toutes les unités réellement accessibles, palissade comprise                                     | Positions libres aléatoires, achats et miel tardifs                   |
| clustered | Archers, dragons, tanks, boucliers ; soigneurs                                                                         | Remplit d'abord le secteur central puis les autres ; miel attractif   |

Les spécialistes achètent des massues avant le déblocage de leur famille. Les
profils organisés visent un ou deux soigneurs ; le profil mêlée en vise jusqu'à
trois. Les unités à longue portée sont placées plus en arrière. Tous les profils organisés conservent leur prochain achat jusqu'à disposer du
budget, sans remplacer systématiquement un tank par une recrue bon marché. Le
curseur de composition est réinitialisé à chaque vague. Les tentatives
ratées ne coûtent rien et sont limitées. Les actions réussies conservent heure,
vague, état, prix, or avant/après, type et coordonnées ou miel choisi.

Un hash séparé graine × profil choisit aussi une variante stable sur toute la
campagne : 25 % sans miel, 25 % alternance attractif/collant selon la parité de
vague, 50 % politique du tableau. Cette variation est appariée entre configurations.
Les profils couplent composition, placement et rythme : leurs différences ne
permettent pas d'attribuer isolément une cause à une seule de ces dimensions.

## Mesures et interprétation

Les sorties incluent victoires/défaites/vague d'arrêt, expirations et erreurs,
progression, morts par type, achats par type, réparations, économie, santé finale,
rencontre du boss, arrivée à x576, durée, protections cassées et crachats.
Le combat du boss commence à son entrée dans la défense ou au premier dégât
observé si celui-ci arrive plus tôt. Sa durée est arrêtée à sa mort. Les boss
non tués sont explicitement censurés : leur durée observée reste dans la campagne,
mais ils n'entrent pas dans la médiane/p90 des combats terminés.

Les taux par profil utilisent Wilson 95 %. Le taux global d'une configuration
utilise `winClusterBootstrap95` : 2 000 rééchantillonnages déterministes de graines
entières conservent tous leurs profils. Le point estimé reste le taux cumulé,
même lorsque les grappes ont des tailles différentes. `winWilson95` global est
conservé comme diagnostic nominal cumulé et porte ce libellé explicitement ; il
ne corrige pas la corrélation entre profils d'une même graine. Les intervalles
bootstrap sont empiriques et peuvent être dégénérés aux bornes ; avec peu de
graines, ils ne constituent pas une garantie sur les graines jamais observées.
Les durées affichent médiane et p90. Le bootstrap
apparié utilise 2 000 rééchantillonnages déterministes de graines entières,
conservant les profils associés dans chaque grappe ; il compare chaque candidat
à `baseline` (ou au premier identifiant trié si cet identifiant est absent).
Les pertes, expirations et erreurs restent dans le dénominateur des victoires.

Ces mesures décrivent des bots et leurs politiques figées. Elles n'établissent
pas le plaisir familial et ne constituent pas un entraînement de modèle d'IA.
Le premier tour discovery/confirmation est conservé avec ses limites. Le second
tour discovery2/confirmation2 évalue l'extension contrôlée sans recycler ses
graines. Les sources exactes du premier tour sont archivées dans
`reports/balance-0.16/source-snapshots/round1` pour rejouer ses rapports avec
leur schéma de réglage d'origine. Holdout vérifie ensuite un défaut déjà choisi.
