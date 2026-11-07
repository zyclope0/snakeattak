# Équilibrage et roi à trois têtes — version 0.16

Le jeu conserve ses douze vagues, ses trois voies interconnectées et ses combats autonomes. Le roi reçoit des protections finies et un crachat annoncé au sol. Les deux mutants gagnent en puissance ; les autres statistiques et les dégâts secondaires du dragon/tank sont conservés. Aucun service réseau ajouté.

## Ce qui est livré

- Dégâts des deux mutants multipliés par 1.75 : roc 42, élastique 52.5. Prix, vie, portée et vitesse inchangés.
- Roi : multiplicateur de vie 6.5, protection de 12,0 % de sa vie maximale, phases aux seuils 60 % et 25 %.
- Protection : dégâts à distance ×0.45, autres attaques ×1.6. Le débordement frappe sa vie après armure ordinaire.
- Crachat : 18 dégâts bruts, zone de rayon 38, annonce 1.8 s, recharge 7 s. Un seul impact ; pas de poison périodique.
- La pause suspend le vrai compte à rebours. Une cible morte ne supprime pas la marque ; la mort du roi l’annule. Boucliers alliés et armures restent actifs.
- Le rendu lit le même état que le moteur : protection bleue, phase, annonce au sol et signal de protection brisée. Aucun nouveau générateur graphique payant utilisé.

## Protocole et choix

Les bots jouent le moteur de production avec ses prix, ses ressources et ses règles publiques. Ils ne reçoivent aucun supplément de pièces, de vie ni de recrutement. Huit politiques couvrent compositions mixtes, mêlée, distance, lourds, dinosaures, mutants, achats occasionnels et regroupement. Les politiques de miel sont déterministes : aucune utilisation, alternance ou préférence du profil. Les profils combinent composition et placement ; ils ne représentent pas huit âges ni huit enfants.

| Série         | Graines | Réglages | Campagnes complètes |
| ------------- | ------: | -------: | ------------------: |
| discovery     |       8 |        7 |                 448 |
| confirmation  |      12 |        4 |                 384 |
| discovery2    |       8 |        5 |                 320 |
| confirmation2 |      12 |        4 |                 384 |
| holdout       |      24 |        2 |                 384 |

**Total : 1 920 campagnes complètes**, sans erreur ni dépassement de la limite de 240 s par vague. Les cinq cohortes de graines sont disjointes. La validation finale comprend les 24 graines originales réservées, soit 384 campagnes, et n’a servi à aucun choix de paramètres.

Un premier lancement interrompu de 140 campagnes est conservé mais exclu de la sélection : l’identifiant de référence ne correspondait pas à celui attendu par le comparateur. Les essais de fumée et replays sont des diagnostics supplémentaires, hors total ci-dessus.

Les 832 premières campagnes montraient surtout une faiblesse des mutants, souvent avant le boss : seulement 1/12 victoire en confirmation. Des réglages plus durs du boss ou des dégâts de zone diminués ne corrigeaient pas cette faiblesse. Une seconde exploration a donc isolé le facteur de dégâts des mutants à boss identique (contrôle, ×1,25, ×1,5, ×1,75), puis confirmé les deux meilleurs candidats sur 12 nouvelles graines. Ce second tour est un développement adaptatif ; seule la cohorte finale restée intacte constitue la validation du réglage livré.

Le score de développement combine taux de victoire, écart entre compositions, avantage de la distance, nouvelles défaites précoces appariées, régressions des profils occasionnels, durée du boss et utilisation réelle des protections/tirs. Les fichiers selection.json conservent ses composantes et l’empreinte du score ; chosen-config.json conserve la décision antérieure à la validation finale.

Une relecture indépendante a aussi conduit à corriger l’affichage des décimales et un résidu numérique infinitésimal lors de l’absorption. Les sources originales de chaque tour sont conservées pour les replays ; la validation finale utilise le moteur et le défaut réellement livrés.

## Résultats de la validation finale

| Politique du bot | Référence 0.15 | Version 0.16 | Wilson 95 % de la version 0.16 |
| ---------------- | -------------: | -----------: | -----------------------------: |
| Mixte            |          23/24 |        23/24 |                79,8 % – 99,3 % |
| Corps à corps    |          24/24 |        24/24 |               86,2 % – 100,0 % |
| À distance       |          24/24 |        24/24 |               86,2 % – 100,0 % |
| Lourds           |          22/24 |        22/24 |                74,2 % – 97,7 % |
| Dinosaures       |          19/24 |        19/24 |                59,5 % – 90,8 % |
| Mutants          |           6/24 |        22/24 |                74,2 % – 97,7 % |
| Occasionnel      |          20/24 |        22/24 |                74,2 % – 97,7 % |
| Regroupé         |          24/24 |        24/24 |               86,2 % – 100,0 % |

Au total : référence **162/192** (84,4 %), version livrée **180/192** (93,8 %).
Comparaison scénario par scénario : **20 nouvelles victoires et 2 nouvelles défaites**. Le gain est global, pas une amélioration de chaque partie.
Nouvelles défaites avant la vague 12 par rapport au même scénario de référence : **1**. Défaites précoces totales : 10 → 3.

Le taux global de 93,8 % confirme une version accessible à ces bots, au-dessus du repère de développement de 75 %. Ce lot vise surtout la viabilité des familles et la lisibilité du boss ; il ne démontre pas une difficulté idéale pour tous les âges. Un éventuel mode plus difficile devra être évalué séparément, sans changer le réglage final à partir de ces résultats.

Les huit profils d’une même graine sont corrélés. Les intervalles globaux suivants rééchantillonnent donc des graines entières (2 000 tirages) ; les Wilson globaux conservés dans les JSON ne sont que des diagnostics nominaux. Les Wilson par profil restent pertinents pour ces 24 scénarios distincts.

- baseline : 79,7 % – 88,5 % pour le taux global (24 grappes de graines).
- shipped-016 : 90,6 % – 96,9 % pour le taux global (24 grappes de graines).

Gain apparié du taux de victoire : **+9.4 points**, intervalle bootstrap 95 % **[+5.7 ; +12.5] points** (24 graines, 2 000 tirages).

Boss de la version livrée : vu dans 189 campagnes, entré en zone dans 178, tué dans 180. Durée médiane après engagement **19.2 s**, p90 **37.4 s**, calculés uniquement sur les boss tués. Rencontres censurées (boss vu mais non tué) : **9**. Moyennes parmi les boss vus : 2.88 protections brisées, 1.95 crachats. Ces durées conditionnelles ne prouvent pas que les combats perdus sont courts.

## Reproduire et interpréter

Node 24, puis `npm ci`. Les configurations sont dans `reports/balance-0.16/`. Chaque lot comprend manifest.json (graines, prix, sources et empreintes), summary.json, balance-lab.json et les campagnes individuelles avec commandes, état des échecs et paramètres de replay. Les sources historiques sont dans source-snapshots/round1, round2-before-precision-fix et round2-confirmation ; la version finale utilise la source livrée, indiquée par son manifeste.

```sh
npm run balance:lab -- --stage holdout --configs reports/balance-0.16/holdout-configs.json --out reports/reproduction --workers 3
node scripts/balance-lab.mjs --replay chemin/campagne.json --out reports/replay
```

Pour rejouer un ancien tour à l’identique, lancer le script depuis son snapshot exact avec des chemins absolus vers la campagne et la sortie. Les temps CPU/muraux dépendent de la machine ; le hash des résultats exclut ces temps. Les données sources restent nécessaires pour distinguer erreurs, défaites et succès.

Ces simulations guident des réglages explicites ; aucun poids de modèle d’IA n’a été entraîné. Une victoire de bot ne mesure ni le plaisir ni la compréhension d’un enfant. Les intervalles sont larges par composition et les profils ne couvrent pas toutes les stratégies. Le choix des voies conserve une estimation heuristique de la défense fondée sur le catalogue ; elle ne recalcule pas toute la force réelle du combat et n’intègre pas le facteur mutant. Les essais familiaux restent indispensables, surtout pour juger la lisibilité du crachat et l’envie de rejouer. La prochaine étape utile est un essai des enfants avant d’ajouter du contenu.

## Contrôles de livraison

186 tests natifs réussis, format, TypeScript strict et compilation web/portable vérifiés. Essais navigateur du jeu et de l’interface réussis en web et fichier local, sept formats d’écran, clavier et tactile simulé. Quatorze scénarios de présentation couvrent notamment protection du roi, marque verrouillée, pause et impact réel. Restauration WebGL vérifiée. Aucun appareil physique testé.

Les budgets web passent : HTML de 15 931 octets, code du jeu de 85 349 octets, moteur Phaser séparé. Le test de rendu cloud avec 21 alliés mesure environ33,3ms par image en médiane et50ms au95e percentile ; ce scénario ne mesure pas un téléphone réel ni toutes les charges de combat. Les polices et leurs licences sont incluses ; aucune nouvelle génération graphique payante. Les preuves structurées sont dans reports/verification-0.16.json.
