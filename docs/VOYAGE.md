# Le voyage — réglages et mesures (14 novembre 2026)

Mode décidé par le parent le 14 novembre 2026, sur maquettes : cinq étapes tirées d'une graine,
un bonus à garder entre deux étapes, le roi à trois têtes à la fin. Ce document donne les
réglages de la **version 1** du voyage et les mesures qui les justifient. Le modèle et le
branchement sur le moteur sont décrits dans [ARCHITECTURE.md](ARCHITECTURE.md), section
« Le voyage ». **La version 1 n'est pas publiée.**

Deux passages d'équilibrage ont eu lieu le même jour. Après le premier, le parent a validé
six choix (voir « Décisions prises ») et demandé : « Plus dur pour moyen en gérant l'impact
sur expert ». Le second passage répond à cette demande par **un seul réglage : la bourse de
la dernière étape, réduite de 300 pièces**. Il a aussi corrigé un défaut du joueur automatique
« moyen », qui faussait une partie des mesures du premier passage (voir « Méthode »).

## Ce que le voyage peut régler

Une seule table, `src/voyageTuning.ts`. Elle ne touche à aucune valeur des missions, des
caprices, des alliés ni des serpents : elle dit seulement quoi tirer à quelle étape.

| Réglage            | Version 1                                            | Voyage « brut » mesuré d'abord |
| ------------------ | ---------------------------------------------------- | ------------------------------ |
| Étape 1            | Le refuge ou Les trois ponts, sans caprice           | pareil                         |
| Étape 2            | Les trois ponts ou La course des vifs, sans caprice  | pareil                         |
| Étape 3            | La course ou Les coquilles, caprice petit            | n'importe quel caprice         |
| Étape 4            | Les coquilles ou La sonnette, caprice petit ou moyen | n'importe quel caprice         |
| Étape 5            | La sonnette ou Le carrefour, caprice moyen ou grand  | n'importe quel caprice         |
| Roi                | dernière vague de l'étape 5, vie × 6,5               | pareil                         |
| **Bourse du roi**  | **300 pièces de moins à l'étape 5** (second passage) | bourse de la mission           |
| Bourse des étapes  | celle de la mission aux étapes 1 à 4                 | pareil                         |
| Caprices écartés   | « Deux copains seulement », « Un seul copain »       | aucun                          |
| Cartes offertes    | trois, dont un allié, après les étapes 1 à 4         | pareil                         |
| Carte « pièces »   | +100 pièces à chaque étape suivante                  | pareil                         |
| Carte « cristal »  | garde de 18 à chaque étape suivante                  | pareil                         |
| Carte « miel »     | +4 s par pot à chaque étape suivante                 | pareil (valeur du moteur)      |
| Cartes « renfort » | un allié offert à chaque étape suivante              | pareil                         |

La bourse du roi : 1 000 pièces au carrefour au lieu de 1 300, 750 à la sonnette au lieu de
1 050, avant les pièces du sac et le caprice. Le plan le dit (`plan.stages[4].coins` vaut
−300) : la carte du voyage peut l'annoncer avant le départ, comme elle annonce le caprice.

Règles du tirage, fixes : jamais deux fois la même mission, toujours dans l'ordre du jeu (six
itinéraires possibles) ; le roi ne vient qu'à la dernière étape (« Le roi s'invite » n'est donc
jamais tiré avant) ; un voyage ne rencontre pas deux fois un caprice du même nom tant qu'il
peut l'éviter (« La tirelire » existe sur chaque mission) ; les trois cartes offertes sont
tirées comme dans la grande aventure (un allié et deux des trois autres cartes) ; une carte
peut revenir et se cumule (deux boucliers offerts, deux gardes du cristal). **Une offre
contient toujours trois cartes.**

## Méthode

`npm run balance:voyage` joue des voyages entiers sur le vrai moteur à 30 pas par seconde. Les
joueurs automatiques sont ceux de `balance:modes` et `balance:caprices`, qui posent en plus
les alliés offerts par le sac :

- **expert** : un soigneur, puis archers, boucliers et massues sur la voie la moins défendue ;
  miel collant et encouragement ;
- **moyen** : dépense tout en massues, boucliers et archers, une voie après l'autre ; ni miel
  ni encouragement ;
- **apprenti** (nouveau) : le joueur moyen, arrêté à quatre achats par vague ;
- **petit** (débutant) : deux achats par vague, le reste des pièces dort ;
- **massues** : seulement des massues, sur la voie la moins défendue.

Deux façons de remplir le sac : **allié** (la carte d'allié à chaque fois ; chaque offre en
contient une) et **hasard** (une des trois cartes au sort). Les graines sont les mêmes d'une
mesure à l'autre. Chaque étape est un nouveau camp : le laboratoire joue les cinq étapes de
chaque graine même après une défaite, ce qui donne la réussite de chaque étape sur toutes
les graines ; « voyages terminés » compte les voyages sans aucune défaite.

**Correction du second passage.** Les joueurs qui achètent « une voie après l'autre »
commençaient toujours par la première voie. Or ils marient la sorte d'allié à la voie : dans
une vague, chaque voie ne reçoit qu'une sorte, et la voie de départ décide laquelle reçoit les
archers. Un cadeau du sac posé d'abord décale ce mariage. Sur 200 graines sans aucun allié
offert, le joueur moyen terminait 37 voyages sur 100 en partant de la première voie et 61 en
partant d'une autre : l'écart venait du joueur automatique, pas du sac. La voie de départ suit
maintenant la graine du combat. Conséquence : **les chiffres du joueur moyen et du petit
joueur publiés après le premier passage ne valent plus**, en particulier « sac vide : moyen
31 % » ; ceux de l'expert et des massues, qui ne jouent pas ainsi, restent justes. Tous les
chiffres ci-dessous sont mesurés avec les joueurs corrigés, sauf mention contraire.

## Résultats : avant et après le second passage

300 graines, 3 000 voyages par table (15 000 étapes). « Avant » est la table du premier
passage (bourse du roi entière), rejouée avec les joueurs corrigés. Part de voyages terminés :

| Joueur   | Sac    | Avant | Version 1 |
| -------- | ------ | ----- | --------- |
| expert   | allié  | 83 %  | 81 %      |
| expert   | hasard | 76 %  | 66 %      |
| moyen    | allié  | 67 %  | **53 %**  |
| moyen    | hasard | 51 %  | 45 %      |
| apprenti | allié  | 26 %  | 26 %      |
| apprenti | hasard | 10 %  | 10 %      |
| petit    | allié  | 4 %   | 4 %       |
| petit    | hasard | 0 %   | 0 %       |
| massues  | allié  | 99 %  | 97 %      |
| massues  | hasard | 98 %  | 98 %      |

Sur 400 graines (les 300 ci-dessus et 100 autres), version 1 : expert 80,5 % et 65 %, moyen
54 % et 45 %. Une part mesurée sur 300 graines est connue à 5 ou 6 points près.

L'apprenti et le petit ne bougent pas d'une seule partie : ils ne dépensent pas toutes leurs
pièces, la bourse réduite ne les touche pas.

Version 1, sac « allié » : réussite de chaque étape, où le voyage s'arrête, cristal restant à
la fin des étapes gagnées, durée simulée des combats à vitesse normale.

| Joueur   | Étape 1 | Étape 2 | Étape 3 | Étape 4 | Étape 5 |
| -------- | ------- | ------- | ------- | ------- | ------- |
| expert   | 100 %   | 100 %   | 100 %   | 100 %   | 81 %    |
| moyen    | 100 %   | 100 %   | 100 %   | 99 %    | 54 %    |
| apprenti | 100 %   | 100 %   | 100 %   | 96 %    | 27 %    |
| petit    | 100 %   | 100 %   | 100 %   | 62 %    | 4 %     |
| massues  | 100 %   | 100 %   | 100 %   | 100 %   | 97 %    |

| Joueur   | Tombe à l'étape 3 | à l'étape 4 | à l'étape 5 | Étapes réussies (moyenne) |
| -------- | ----------------- | ----------- | ----------- | ------------------------- |
| expert   | 0 %               | 0 %         | 19 %        | 4,8                       |
| moyen    | 0 %               | 1 %         | 46 %        | 4,5                       |
| apprenti | 0 %               | 4 %         | 70 %        | 4,2                       |
| petit    | 0 %               | 38 %        | 58 %        | 3,7                       |

| Joueur   | Cristal restant, étapes 1 à 5 | Secondes de combat, étapes 1 à 5 |
| -------- | ----------------------------- | -------------------------------- |
| expert   | 100 / 100 / 100 / 96 / 92     | 76 / 89 / 91 / 142 / 190         |
| moyen    | 100 / 100 / 98 / 92 / 68      | 75 / 85 / 95 / 143 / 194         |
| apprenti | 100 / 100 / 95 / 78 / 54      | 75 / 87 / 97 / 145 / 191         |
| petit    | 100 / 99 / 86 / 52 / 39       | 78 / 89 / 99 / 145 / 154         |

Avec des cartes au hasard, le petit joueur gagne l'étape 3 91 fois sur 100 et l'étape 4 33
fois ; l'apprenti gagne l'étape 4 83 fois sur 100.

**Durée.** Inchangée : un voyage terminé compte 15 ou 16 vagues et 10 minutes de combat simulé
à vitesse normale (médiane 9,7 ; de 6,7 à 14,4 minutes sur 441 voyages de l'expert) ; 8,5
minutes pour les massues. Le temps de préparation n'est pas simulé. Avec 20 à 30 secondes de
préparation par vague et quatre choix de carte, un voyage dure 15 à 19 minutes à vitesse
normale, moins à vitesse ×2. À mesurer avec les enfants.

### Dernière étape, par mission et caprice (version 1, sac « allié », gagnées/jouées)

| Mission   | Caprice                      | expert | moyen  | apprenti | petit | massues |
| --------- | ---------------------------- | ------ | ------ | -------- | ----- | ------- |
| carrefour | La grande charge             | 77/106 | 40/106 | 14/106   | 1/106 | 100/106 |
| carrefour | Les carapaces                | 43/52  | 26/52  | 15/52    | 0/52  | 52/52   |
| carrefour | Le roi et sa grande fringale | 78/89  | 61/89  | 31/89    | 2/89  | 89/89   |
| sonnette  | La grande charge             | 11/14  | 6/14   | 6/14     | 2/14  | 13/14   |
| sonnette  | Les carapaces                | 8/9    | 7/9    | 4/9      | 2/9   | 8/9     |
| sonnette  | Serpents costauds            | 11/14  | 8/14   | 3/14     | 1/14  | 14/14   |
| sonnette  | Crocs pointus                | 16/16  | 14/16  | 9/16     | 5/16  | 15/16   |

### Graines extrêmes et graines impossibles

Sur 300 graines et deux sacs, **aucune graine n'est impossible** : chacune est terminée par
l'expert ou par les massues. 25 graines sur 300 ne sont terminées par le joueur « expert »
avec aucun des deux sacs ; les massues les terminent. Les trois plus faciles finissent à la
sonnette, et même le petit joueur les termine ; les trois plus dures finissent au carrefour.
`npm run balance:voyage` liste les trois plus dures et les trois plus faciles avec leur code.

## Les leviers essayés au second passage

200 graines par essai sauf mention. Part de voyages terminés, sac « allié » / « hasard ».
L'expert de l'essai « roi » a été mesuré au premier passage, sur 150 graines.

| Levier                                             | expert        | moyen       | Retenu ?                         |
| -------------------------------------------------- | ------------- | ----------- | -------------------------------- |
| Table du premier passage (300 graines)             | 83 / 76       | 67 / 51     | point de départ                  |
| **Bourse du roi −300** (400 graines)               | **80,5 / 65** | **54 / 45** | **oui**                          |
| Bourse du roi −200 (400 graines)                   | 80,5 / 72     | 59 / 50     | non : moyen trop haut            |
| Bourse du roi −250 (400 graines)                   | 80 / 65       | 62 / 49     | non : moyen trop haut            |
| Bourse du roi −400                                 | 78 / 59       | 53 / 40     | non : rien de plus, expert −5    |
| Bourse −200 aux étapes 4 et 5                      | 82 / 73       | 58 / 50     | non : l'étape 4 ne bouge pas     |
| Bourse −100, −200, −300 aux étapes 3, 4, 5         | 79 / 69       | 53 / 47     | non : pareil que −300 au roi     |
| Allié offert 3 fois sur 4                          | 84 / 75       | 65 / 53     | non                              |
| Allié offert 2 fois sur 4 (après les étapes 1, 2)  | 86 / 74       | 53 / 51     | non : effet irrégulier           |
| Allié offert 2 fois sur 4 (après les étapes 1, 3)  | 84 / 79       | 58 / 54     | non                              |
| Allié offert 1 fois sur 4                          | 82 / 72       | 62 / 55     | non                              |
| Aucun allié offert                                 | 83 / 75       | 54 / 50     | non : les offres sont identiques |
| Allié 2 fois sur 4 et bourse du roi −200           | 74 / 69       | 57 / 45     | non : expert −9                  |
| Roi plus solide, vie × 8                           | 81 / —        | 68 / 47     | non : gêne d'abord l'expert      |
| Roi plus solide, vie × 10                          | 77 / —        | 65 / 45     | non                              |
| Caprices plus tôt (moyen dès l'étape 3, grand à 4) | 83 / 76       | 69 / 50     | non : ne change rien pour eux    |
| Grand caprice obligatoire à l'étape 5              | 83 / 73       | 71 / 54     | non                              |
| Cartes « pièces » à +150 et « cristal » à 27       | — / 70        | — / 51      | non : +1 à +3 points au hasard   |

Ce que ça dit :

- **La bourse du roi est le seul levier qui sépare nettement les deux joueurs.** 300 pièces
  de moins : 14 points de moins pour le moyen, 2 pour l'expert. L'expert a un soigneur, vise
  la voie faible, sert le miel et encourage : il tient avec moins d'alliés. Le joueur moyen
  compense son placement par le nombre.
- **Le nombre d'alliés offerts compte peu et irrégulièrement** pour le joueur moyen : 54, 62,
  53 à 58, 65 et 67 voyages terminés pour 0, 1, 2, 3 et 4 alliés offerts. L'écart de 40
  points lu au premier passage venait surtout du joueur automatique (voir « Méthode »).
  Retirer tous les alliés donnerait le même résultat que la bourse réduite, mais les trois
  cartes offertes seraient alors toujours les mêmes (miel, cristal, pièces).
- **Répartir la difficulté plus tôt ne marche pas pour ces joueurs.** Ni des caprices plus
  durs aux étapes 3 et 4, ni une bourse réduite à l'étape 4 ne font tomber l'expert ou le
  moyen avant le roi ; les caprices plus durs arrêtent seulement le débutant.
- La valeur des cartes « pièces » et « cristal » ne change presque rien, et la changer
  demanderait des textes propres au voyage (les cartes disent « +100 pièces » et « Absorbe
  18 dégâts »).

## Effet de chaque carte (version 1)

100 graines. Le sac ne reçoit qu'une seule sorte de carte, une de plus après chaque étape
(quatre à la dernière) : c'est l'effet d'une carte seule, pas un voyage qu'un enfant peut
faire, puisque les cartes offertes changent. Part de voyages terminés ; sur 100 graines, une
part est connue à 10 points près.

| Sac                      | expert | moyen | apprenti | petit (réussite de l'étape 4) |
| ------------------------ | ------ | ----- | -------- | ----------------------------- |
| vide                     | 49 %   | 29 %  | 4 %      | 13 %                          |
| ninjas offerts           | 84 %   | 74 %  | 38 %     | 75 %                          |
| boucliers offerts        | 80 %   | 39 %  | 18 %     | 49 %                          |
| vélociraptors offerts    | 67 %   | 47 %  | 27 %     | 59 %                          |
| pièces                   | 73 %   | 47 %  | 4 %      | 13 %                          |
| garde du cristal         | 54 %   | 47 %  | 10 %     | 36 %                          |
| miel                     | 51 %   | 29 %  | 4 %      | 13 %                          |
| allié à chaque fois      | 77 %   | 49 %  | 33 %     | 64 %                          |
| une des trois, au hasard | 58 %   | 47 %  | 13 %     | 38 %                          |

Avec la bourse réduite, le sac compte pour tout le monde : l'expert termine 49 voyages sur
100 sans carte et 77 avec un allié à chaque étape. Les cartes ne se valent toujours pas : le
ninja est la meilleure pour tous, le miel n'aide que celui qui en sert, les pièces n'aident
pas celui qui ne dépense pas les siennes.

## Pourquoi ces réglages

| Réglage                             | Mesure                                                                                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Étapes 1 et 2 sans caprice          | Les cinq joueurs les gagnent 300 fois sur 300.                                                                                                                                                    |
| Étape 3 : caprice petit             | Brut, « La tempête » des coquilles arrêtait l'expert 7 fois sur 31 et « La grande charge » 4 fois sur 22. Avec un petit caprice : 300/300 pour tous, 299/300 pour le petit.                       |
| Étape 4 : petit ou moyen            | Expert 299/300, moyen 297/300, apprenti 96 %, petit 62 %. Des caprices plus durs ici ne changent rien pour l'expert et le moyen (83 % et 69 % de voyages terminés, comme sans eux).               |
| Étape 5 : moyen ou grand, et le roi | C'est l'étape qui départage. Un grand caprice obligatoire ne change rien (83 % et 71 %).                                                                                                          |
| Bourse du roi −300                  | Moyen 67 % → 53 %, expert 83 % → 81 % sur 300 graines ; 54 % et 80,5 % sur 400. −200 laisse le moyen à 59 %, −400 n'apporte rien de plus au moyen et coûte 5 points à l'expert.                   |
| Caprices « copains » écartés        | Les alliés du sac prennent la place des sortes d'alliés à choisir. Brut, sac « allié » : « Deux copains seulement » 30/44 pour l'expert (42/44 au hasard) ; « Un seul copain » avec le roi 16/46. |
| Vie du roi × 6,5                    | Vie × 8 puis × 10 : expert 81 % puis 77 %, moyen 68 % puis 65 %. Un roi plus solide gêne d'abord les meilleurs.                                                                                   |
| Un allié dans chaque offre          | En retirer change peu et irrégulièrement le résultat du moyen, et rend les offres pauvres.                                                                                                        |
| Cartes à leur valeur d'origine      | +150 pièces et garde de 27 : +1 point pour l'expert au hasard, +3 pour le moyen.                                                                                                                  |

## Les cibles, une par une

| Cible                                                   | Mesuré, version 1                                                       |
| ------------------------------------------------------- | ----------------------------------------------------------------------- |
| Moyen : environ un voyage sur deux (45 à 55 %, allié)   | **53 %** sur 300 graines, 54 % sur 400 ; 45 % avec des cartes au hasard |
| Expert : au moins 78 à 80 %                             | **81 %** sur 300 graines, 80,5 % sur 400 (83 % avant : −2 points)       |
| Débutant : deux premières étapes au moins 9 fois sur 10 | 100 % aux étapes 1 et 2, inchangé                                       |
| Aucune graine impossible                                | 0 sur 300 (expert ou massues)                                           |
| Durée dans les mêmes eaux                               | 10 minutes de combat, inchangé                                          |
| Pas de marche brutale d'une étape à l'autre             | **Non tenue pour l'expert et le moyen** : voir ci-dessous               |

**La marche devant le roi.** Pour l'expert et le joueur moyen, les étapes 1 à 4 se gagnent
presque toujours et tout se joue à la dernière : 99 % puis 54 % pour le moyen. Le cristal et
la durée des combats montent bien d'étape en étape, mais pas les défaites. Aucun réglage du
voyage essayé ne les répartit : des caprices plus durs ou une bourse réduite aux étapes 3 et
4 ne font pas tomber ces deux joueurs, ils arrêtent le débutant. Pour le débutant et
l'apprenti, la pente est plus régulière (100, 62, 4 et 100, 96, 27).

**L'expert qui prend ses cartes au hasard perd 10 points** (76 % → 66 %), plus que les 5
points fixés comme limite. Avec une bourse réduite, bien choisir ses cartes compte davantage :
c'est voulu par le réglage, mais c'est un prix à connaître. À −200, il ne perd que 4 points,
et le moyen reste à 59 %.

## Ce que la mesure ne dit pas

- Un joueur automatique n'est pas un enfant. Aucun ne répare le cristal, n'entraîne le héros,
  ne regarde la carte du voyage ni ne change de plan devant un caprice annoncé. Aucun ne se
  trompe de bouton, ne s'ennuie, ne s'énerve.
- **Si les enfants jouent comme l'apprenti, ils terminent un voyage sur quatre** avec un allié
  à chaque étape, un sur dix au hasard, et tombent presque toujours devant le roi. Le second
  passage n'a rien changé pour eux. Seuls des essais diront où ils se situent.
- Le défaut du joueur moyen trouvé au second passage rappelle qu'un écart de 20 points peut
  venir du joueur automatique. Les joueurs de `balance:modes` et `balance:caprices` gardent ce
  défaut ; leurs missions n'ont pas de cadeau à poser, il n'a donc pas été regardé là-bas.
- Le meilleur joueur automatique n'est pas l'« expert » mais les massues seules (97 %). C'est
  un fait du jeu d'aujourd'hui, pas du voyage ; il n'a pas été touché.
- La durée d'un voyage ne compte que les combats. Le temps de préparation et de lecture est
  une hypothèse.
- 300 ou 400 graines sur 1 048 576 : les parts sont connues à 5 points près, et les essais de
  200 graines à 7 points près. Deux essais voisins peuvent s'inverser.
- Rien n'a été joué à la main, sur téléphone, ni avec les enfants.

## Décisions prises par le parent (14 novembre)

Les deux caprices « copains » sont écartés du voyage ; une étape gagnée ne donne ni étoile ni
autocollant ; on ne peut pas passer son tour au choix de la carte et une carte peut être
prise deux fois ; une étape quittée en cours repart de son début ; le voyage n'est pas dans le
fichier de sauvegarde familiale ; la version 1 ne changera plus une fois publiée.

**La bourse du roi réduite de 300 pièces est acceptée par le parent le 14 novembre**, après
lecture des mesures du second passage, en sachant que l'expert qui prend ses cartes au hasard
y perd dix points et que la marche devant le roi reste.

## Décisions qui restent

1. **Dire la bourse du roi à l'enfant.** Aucun écran ne l'annonce encore ; une phrase sur le
   cinquième arrêt de la carte est proposée au parent.
2. **La marche devant le roi** : l'accepter (le voyage est une montée vers un combat final),
   ou demander une règle nouvelle pour les étapes 3 et 4, ce que la table du voyage ne sait
   pas faire.
3. **Essayer avec les enfants** avant de publier : si leur jeu ressemble à celui de
   l'apprenti, le voyage est trop dur pour eux à la dernière étape, et c'est la bourse des
   missions ou le roi qu'il faudrait regarder, pas la table du voyage.

## Refaire les mesures

```sh
npm run balance:voyage                                   # version 1, 100 graines, 9 sacs, 10 min
TABLE=brut npm run balance:voyage                        # le voyage brut
SEEDS=300 PROFILES=expert,moyen,apprenti,petit,massues POLICIES=raisonnable,hasard npm run balance:voyage
TABLE=mes-reglages.json npm run balance:voyage           # une autre table, au format de voyageTuning.ts
```

Dans une table, `coins` est ce qu'une étape ajoute ou retire à la bourse de sa mission, et
`ally` dit si l'offre qui suit l'étape contient un allié. Le rapport complet est écrit dans
`artifacts/voyage/rapport.json`, hors de Git.
