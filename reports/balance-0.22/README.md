# Équilibrage tactique 0.22

Le script `scripts/tactical-balance-022.mjs` compare le vrai moteur 0.21 au moteur 0.22 par défaut. Chaque bot agit uniquement par les commandes publiques de `Game` : recrutement, départ de vague, réparation, encouragement, miel et choix de passer les récompenses. Aucun déplacement manuel, ajout d’or, modification de santé, promotion d’un serpent en roi ou injection de combattant.

## Cohortes finales

- Découverte missions : six missions × 18 configurations × 3 bots × 2 moteurs =648 parties. Les configurations et graines reproduisent la cohorte historique 0.21 ; chaque paire utilise exactement la même politique et la même graine.
- Découverte classique :16 graines × 4 profils × 2 moteurs =128 parties.
- Holdout classique :16 autres graines × 4 profils × 2 moteurs =128 parties, après choix de conserver ou modifier les paramètres.
- Holdout missions : six missions × 18 configurations × 2 bots (methodical/casual), sur le candidat seulement =216 parties. Cette validation est indépendante des graines de découverte et ne fournit pas d’effet apparié 0.21/0.22.

Les profils contrôlés répartissent les combattants selon les défenses de voie, les contre-aériens selon la défense des seuls archer/dragon/tank et les médecins près du fort à x 924 sur les voies ayant le moins de soignants. Mixed/methodical achètent au moins trois contre-aériens à partir du rang 6 quand l’or le permet. Ranged achète archers, dragons et tanks ; melee conserve volontairement une composition sans contre-aérien ; casual reste aléatoire ; novice achète une unité peu chère par vague à l’arrière. Les défaites de melee face aux volants ne déclenchent aucun objectif de victoire universelle.

Le calcul avance à 30 Hz, avec plafond de 300 s par vague. La préparation est finie : missions 4 s pour methodical et 1 s pour casual/novice ; classique 10 s pour les profils contrôlés et 3 s pour casual. Les récompenses de chapitre sont passées par l’API publique, aucun entraînement n’est choisi. Un seul processus, aucun worker de simulation.

## Mesures et preuves

Les JSON contiennent chaque partie, les achats, les vagues, les paires et leurs différences. Les morts sont observées par disparition d’identité alliée. Les vrais volants correspondent à `isFlying` : snake + variant flying + !boss. Un serpent éliminé conserve maxHp>0 ; le moteur marque une fuite avec maxHp=0. Les retours/recharges sont les transitions réelles des stocks, les têtes tombées sont des transitions positives vers zéro et les soins de la cour sont les charges consommées. Les blessés survivants ont 0<HP<maxHp à la fin de la partie. Aucune attribution individuelle de performance n’est déduite.

Chaque rapport conserve les SHA 256 de tous les modules transitifs de Game avant et après la mesure ainsi que celui du script. Les empreintes doivent être strictement identiques. Les sources de ces moteurs figurent dans `source-snapshots/`, et les explorations antérieures au gel sont distinctes sous `discovery/*exploratory*`. Un résultat exploratoire ne remplace pas la cohorte finale.

Les premiers rapports exploratoires comptaient le roi portant variant=flying parmi les volants, alors que `isFlying` l’excluait. Ces chiffres de volants sont impropres à une conclusion finale ; les taux de victoire restaient valides pour leur moteur et leur politique. Une autre exploration a traversé la suppression d’un import inutilisé : son manifeste indique explicitement le changement et son source initial a été reconstruit puis vérifié octet par octet.

## Reproduction

Depuis le projet avec Node 24 :

```sh
TACTICAL_MODE=missions node --experimental-strip-types scripts/tactical-balance-022.mjs
TACTICAL_MODE=classic node --experimental-strip-types scripts/tactical-balance-022.mjs
TACTICAL_STAGE=holdout TACTICAL_MODE=all node --experimental-strip-types scripts/tactical-balance-022.mjs
```

Le témoin se trouve par défaut à `/workspace/conquete-serpents-baseline-0.21`. Pour utiliser le témoin archivé, définir `TACTICAL_BASELINE` avec le chemin absolu de `reports/balance-0.22/source-snapshots/baseline-0.21`. Pour rejouer exactement le candidat archivé, exécuter sa copie du script dans `source-snapshots/candidate-0.22/scripts/`, avec `TACTICAL_BASELINE` pointant sur le témoin archivé ; les sorties de cette exécution se trouvent sous le dossier du candidat archivé.

Ces simulations décrivent quelques politiques. Les 18 configurations partagent trois graines permutées et ne constituent pas 108 observations statistiquement indépendantes. Les 16 graines classiques ne suffisent pas à optimiser précisément une cible de pourcentage ; le holdout sert à vérifier la tendance après la décision de réglage. Les trois nouveautés étant activées ensemble, leurs effets ne sont pas isolés. Aucune mesure du plaisir des enfants n’est prétendue.

Après les trois cohortes finales, `node scripts/audit-tactical-022.mjs` vérifie le total de 1120 parties, les fichiers sources archivés, les empreintes avant/après, les paires attendues, l’absence de recouvrement des graines de holdout et les invariants des métriques observées. Il écrit `audit.json` sans relancer de simulation.
