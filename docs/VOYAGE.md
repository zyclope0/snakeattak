# Le voyage — réglages et mesures (14 novembre 2026)

Mode décidé par le parent le 14 novembre 2026, sur maquettes : cinq étapes tirées d'une graine,
un bonus à garder entre deux étapes, le roi à trois têtes à la fin. Ce document donne les
réglages proposés pour la **version 1** du voyage et les mesures qui les justifient. Le modèle
et le branchement sur le moteur sont décrits dans [ARCHITECTURE.md](ARCHITECTURE.md), section
« Le voyage ». **Les réglages attendent l'accord du parent ; rien n'est publié.**

## Ce que le voyage peut régler

Une seule table, `src/voyageTuning.ts`. Elle ne touche à aucune valeur des missions, des
caprices, des alliés ni des serpents : elle dit seulement quoi tirer à quelle étape.

| Réglage                  | Version 1 proposée                             | Voyage « brut » mesuré d'abord |
| ------------------------ | ---------------------------------------------- | ------------------------------ |
| Étape 1                  | Le refuge ou Les trois ponts, sans caprice     | pareil                         |
| Étape 2                  | Les trois ponts ou La course des vifs          | pareil                         |
| Étape 3                  | La course ou Les coquilles, caprice petit      | n'importe quel caprice         |
| Étape 4                  | Les coquilles ou La sonnette, petit/moyen      | n'importe quel caprice         |
| Étape 5                  | La sonnette ou Le carrefour, moyen/grand       | n'importe quel caprice         |
| Roi                      | dernière vague de l'étape 5, vie × 6,5         | pareil                         |
| Caprices écartés         | « Deux copains seulement », « Un seul copain » | aucun                          |
| Carte « pièces »         | +100 pièces à chaque étape suivante            | pareil                         |
| Carte « cristal »        | garde de 18 à chaque étape suivante            | pareil                         |
| Carte « miel »           | +4 s par pot à chaque étape suivante           | pareil (valeur du moteur)      |
| Cartes « renfort »       | un allié offert à chaque étape suivante        | pareil                         |
| Bourse de départ en plus | 0 à toutes les étapes                          | 0                              |

Règles du tirage, fixes : jamais deux fois la même mission, toujours dans l'ordre du jeu (six
itinéraires possibles) ; le roi ne vient qu'à la dernière étape (« Le roi s'invite » n'est donc
jamais tiré avant) ; un voyage ne rencontre pas deux fois un caprice du même nom tant qu'il
peut l'éviter (« La tirelire » existe sur chaque mission) ; les trois cartes offertes sont
tirées comme dans la grande aventure (un allié et deux des trois autres cartes) ; une carte
peut revenir et se cumule (deux boucliers offerts, deux gardes du cristal).

## Méthode

`npm run balance:voyage` joue des voyages entiers sur le vrai moteur à 30 pas par seconde. Les
joueurs automatiques sont ceux de `balance:modes` et `balance:caprices`, qui posent en plus
les alliés offerts par le sac :

- **expert** : un soigneur, puis archers, boucliers et massues sur la voie la moins défendue ;
  miel collant et encouragement ;
- **moyen** : dépense tout en massues, boucliers et archers, une voie après l'autre ; ni miel
  ni encouragement ;
- **petit** (débutant) : deux achats par vague, le reste des pièces dort ;
- **massues** : seulement des massues, sur la voie la moins défendue.

Deux façons de remplir le sac : **allié** (la carte d'allié à chaque fois — chaque offre en
contient une, et c'est ce que la mesure de chaque carte seule désigne comme le meilleur choix)
et **hasard** (une des trois cartes au sort). Les graines sont les mêmes d'une mesure à
l'autre. Chaque étape est un nouveau camp : le laboratoire joue les cinq étapes de chaque
graine même après une défaite, ce qui donne la réussite de chaque étape sur toutes les
graines ; « voyages terminés » compte les voyages sans aucune défaite.

## Résultats : avant et après réglage

300 graines, 2 400 voyages par table (12 000 étapes). Part de voyages terminés :

| Joueur  | Sac    | Brut | Version 1 |
| ------- | ------ | ---- | --------- |
| expert  | allié  | 75 % | 83 %      |
| expert  | hasard | 71 % | 76 %      |
| moyen   | allié  | 64 % | 71 %      |
| moyen   | hasard | 53 % | 60 %      |
| petit   | allié  | 2 %  | 3 %       |
| petit   | hasard | 0 %  | 0 %       |
| massues | allié  | 71 % | 99 %      |
| massues | hasard | 83 % | 98 %      |

Réussite de chaque étape, sac « allié » (brut → version 1) :

| Joueur  | Étape 1   | Étape 2   | Étape 3  | Étape 4  | Étape 5 |
| ------- | --------- | --------- | -------- | -------- | ------- |
| expert  | 100 → 100 | 100 → 100 | 96 → 100 | 94 → 100 | 83 → 83 |
| moyen   | 100 → 100 | 100 → 100 | 94 → 100 | 94 → 100 | 72 → 72 |
| petit   | 100 → 100 | 100 → 100 | 57 → 100 | 45 → 59  | 10 → 3  |
| massues | 100 → 100 | 100 → 100 | 99 → 100 | 88 → 100 | 81 → 99 |

Version 1, sac « allié » : où le voyage s'arrête, cristal restant à la fin des étapes gagnées,
durée simulée des combats à vitesse normale.

| Joueur | Tombe à l'étape 3 | à l'étape 4 | à l'étape 5 | Étapes réussies (moyenne) |
| ------ | ----------------- | ----------- | ----------- | ------------------------- |
| expert | 0 %               | 0 %         | 17 %        | 4,8                       |
| moyen  | 0 %               | 0 %         | 28 %        | 4,7                       |
| petit  | 0 %               | 41 %        | 57 %        | 3,6                       |

| Joueur | Cristal restant, étapes 1 à 5 | Secondes de combat, étapes 1 à 5 |
| ------ | ----------------------------- | -------------------------------- |
| expert | 100 / 100 / 100 / 96 / 96     | 76 / 89 / 91 / 142 / 191         |
| moyen  | 100 / 100 / 98 / 94 / 73      | 74 / 82 / 97 / 143 / 190         |
| petit  | 100 / 97 / 84 / 50 / 55       | 77 / 87 / 100 / 145 / 159        |

**Durée.** Un voyage terminé compte 15 ou 16 vagues et 9,8 minutes de combat simulé à vitesse
normale (médiane 9,7 ; de 6,6 à 16,2 minutes sur 477 voyages de l'expert) ; 8,5 minutes pour
les massues. Le temps de préparation n'est pas simulé : les joueurs automatiques posent leurs
alliés en trois secondes. Avec 20 à 30 secondes de préparation par vague et quatre choix de
carte, un voyage dure 15 à 19 minutes à vitesse normale, moins à vitesse ×2. À mesurer avec
les enfants.

### Dernière étape, par mission et caprice (version 1, sac « allié », gagnées/jouées)

| Mission   | Caprice                      | expert | moyen  | petit | massues |
| --------- | ---------------------------- | ------ | ------ | ----- | ------- |
| carrefour | La grande charge             | 81/106 | 69/106 | 0/106 | 105/106 |
| carrefour | Les carapaces                | 48/52  | 30/52  | 0/52  | 51/52   |
| carrefour | Le roi et sa grande fringale | 78/89  | 77/89  | 0/89  | 89/89   |
| sonnette  | La grande charge             | 10/14  | 9/14   | 1/14  | 14/14   |
| sonnette  | Les carapaces                | 9/9    | 5/9    | 2/9   | 9/9     |
| sonnette  | Serpents costauds            | 9/14   | 13/14  | 0/14  | 14/14   |
| sonnette  | Crocs pointus                | 14/16  | 12/16  | 5/16  | 16/16   |

Aux étapes 3 et 4 de la version 1, l'expert et le moyen gagnent chacun 599 étapes sur 600 et
les massues 600 sur 600 ; le petit joueur gagne 300/300 à l'étape 3 et 178/300 à l'étape 4 (« Grosse fringale » 5/29,
« Les carapaces » de la sonnette 27/72, « Crocs pointus » 49/96).

### Graines extrêmes et graines impossibles

Sur 300 graines et deux sacs, **aucune graine n'est impossible** : chacune est terminée par
l'expert ou par les massues. 20 graines sur 300 ne sont terminées par le joueur « expert »
avec aucun des deux sacs ; les massues les terminent toutes. Les trois plus faciles finissent
à la sonnette, et même le petit joueur les termine ; deux des trois plus dures finissent au
carrefour.
`npm run balance:voyage` liste les trois plus dures et les trois plus faciles avec leur code.

## Effet de chaque carte

100 graines, version 1. Le sac ne reçoit qu'une seule sorte de carte, une de plus après
chaque étape (quatre à la dernière) : c'est l'effet d'une carte seule, pas un voyage qu'un
enfant peut faire, puisque les cartes offertes changent. Part de voyages terminés :

| Sac                      | expert | moyen | petit (réussite de l'étape 4) |
| ------------------------ | ------ | ----- | ----------------------------- |
| vide                     | 73 %   | 31 %  | 10 %                          |
| boucliers offerts        | 87 %   | 59 %  | 46 %                          |
| ninjas offerts           | 84 %   | 73 %  | 74 %                          |
| vélociraptors offerts    | 83 %   | 74 %  | 54 %                          |
| pièces                   | 79 %   | 41 %  | 10 %                          |
| miel                     | 78 %   | 31 %  | 10 %                          |
| garde du cristal         | 74 %   | 36 %  | 37 %                          |
| allié à chaque fois      | 83 %   | 69 %  | 59 %                          |
| une des trois, au hasard | 76 %   | 57 %  | 39 %                          |

Ce que ça dit :

- **Le sac compte beaucoup sans rendre la fin facile.** Le joueur moyen termine 31 voyages
  sur 100 sans carte et 69 avec un allié à chaque étape ; même avec quatre boucliers offerts,
  l'expert perd encore la dernière étape 12 fois sur 100.
- **Les cartes ne se valent pas.** Un allié offert à chaque étape vaut bien plus que 100
  pièces ou qu'une garde de 18. Le miel n'aide que le joueur qui sert du miel ; les pièces
  n'aident pas le joueur qui ne dépense pas les siennes.
- Dans le voyage brut, l'écart était le même : expert 47 % sans carte, 92 % avec des boucliers.

## Pourquoi ces réglages

| Réglage                             | Mesure                                                                                                                                                                                                                           |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Étapes 1 et 2 sans caprice          | Les quatre joueurs les gagnent 300 fois sur 300, bruts. Rien à régler.                                                                                                                                                           |
| Étape 3 : caprice petit             | Brut, le petit joueur gagnait l'étape 3 57 fois sur 100 ; « La tempête » des coquilles arrêtait l'expert 7 fois sur 31 et « La grande charge » 4 fois sur 22. Avec un petit caprice : 300/300 pour tous.                         |
| Étape 4 : petit ou moyen            | Expert et moyen : 299/300 chacun. Petit : 59 %. Les grands caprices à cette étape gênent peu l'expert et le moyen (90 à 100 % par caprice, brut) mais arrêtent le petit (0 à 21 %).                                              |
| Étape 5 : moyen ou grand, et le roi | C'est l'étape qui départage : expert 83 %, moyen 72 %. Avec les petits caprices en plus, l'expert monterait vers 9 sur 10 et le moyen vers 8 sur 10 (estimation à partir des mesures brutes par caprice, pas un voyage rejoué).  |
| Caprices « copains » écartés        | Les alliés du sac prennent la place des sortes d'alliés à choisir. Brut, sac « allié » : « Deux copains seulement » 30/44 pour l'expert (42/44 au hasard), 9/44 pour les massues ; « Un seul copain » avec le roi 16/46 et 0/46. |
| Vie du roi × 6,5                    | 150 graines, vie × 6,5, × 8 et × 10 : expert 83 %, 81 %, 77 % ; moyen 71 %, 70 %, 68 %. Un roi plus solide gêne d'abord les meilleurs.                                                                                           |
| Cartes à leur valeur d'origine      | +100 pièces et garde de 18 sont écrits sur les cartes de la grande aventure. Voir « Décisions ».                                                                                                                                 |
| Bourse de départ inchangée          | Aucune mesure ne demande plus de pièces ; en retirer serait un malus caché, alors qu'un caprice s'annonce.                                                                                                                       |

## Les cibles, une par une

| Cible proposée                                          | Mesuré, version 1                                                      |
| ------------------------------------------------------- | ---------------------------------------------------------------------- |
| Débutant : deux premières étapes au moins 9 fois sur 10 | 100 % aux étapes 1, 2 et 3 (étape 3 : 90 % avec des cartes au hasard)  |
| Moyen : environ un voyage sur deux                      | **71 %** avec un allié à chaque étape, 60 % avec des cartes au hasard  |
| Expert : au moins 8 ou 9 sur 10                         | 83 % (76 % au hasard) ; 99 % pour les massues                          |
| Aucune graine impossible pour l'expert                  | 0 sur 300 (expert ou massues)                                          |
| Difficulté qui monte sans marche brutale                | Cristal et durée montent d'étape en étape ; les défaites sont à la fin |
| Le sac ne rend pas la fin triviale                      | Dernière étape : 73 % sans carte, 88 % au mieux pour l'expert          |

**La cible « un voyage sur deux pour le joueur moyen » n'est pas atteinte, et ne peut pas
l'être en même temps que « 8 ou 9 sur 10 pour l'expert » avec ce que le voyage peut régler.**
Les deux joueurs automatiques jouent presque pareil dans une mission : aux étapes 3 et 4, tous
deux gagnent quel que soit le caprice. Ils ne se séparent que devant le roi, de 10 à 15 points.
Tout ce qui rend la fin plus dure pour le moyen la rend plus dure pour l'expert : roi × 10,
77 % et 68 %. La version 1 garde l'expert au-dessus de 8 sur 10 et laisse le joueur moyen à
7 voyages sur 10 avec un bon sac, 6 sur 10 avec des cartes au hasard, 3 sur 10 sans carte.

## Ce que la mesure ne dit pas

- Un joueur automatique n'est pas un enfant. Aucun ne répare le cristal, n'entraîne le héros,
  ne regarde la carte du voyage ni ne change de plan devant un caprice annoncé. Aucun ne se
  trompe de bouton, ne s'ennuie, ne s'énerve.
- Les enfants jouent sans doute entre le « petit » et le « moyen ». Entre les deux, le
  laboratoire n'a pas de joueur : le petit ne dépense presque rien (deux achats par vague).
- Le meilleur joueur automatique n'est pas l'« expert » mais les massues seules (99 %). C'est
  un fait du jeu d'aujourd'hui, pas du voyage ; il n'a pas été touché.
- La durée d'un voyage ne compte que les combats. Le temps de préparation et de lecture est
  une hypothèse.
- 300 graines sur 1 048 576. Une part de voyages mesurée à 83 % sur 300 graines est connue à
  4 points près.
- Rien n'a été joué à la main, sur téléphone, ni avec les enfants : il n'y a pas encore
  d'écran.

## Décisions qui reviennent au parent et à son fils

1. **Valider la table de la version 1**, ou demander un voyage plus dur. Deux réglages
   mesurés : roi × 10 (expert 77 %, moyen 68 %) ; grands caprices dès l'étape 4 (ne gêne que le
   débutant). Pour un voyage plus facile : petits caprices aussi à la dernière étape.
2. **Les deux caprices « copains »** sont écartés du voyage parce que les alliés du sac
   prennent les places. Les garder demanderait que les alliés offerts ne comptent pas comme
   une sorte : c'est une règle du caprice, donc du fils.
3. **Les cartes ne se valent pas.** Les laisser comme sur les cartes de la grande aventure
   (proposé), ou donner au voyage ses propres valeurs (par exemple +150 pièces, garde de 27),
   ce qui demande de nouveaux textes sur les cartes et une nouvelle mesure.
4. **Une étape gagnée ne donne ni étoile ni autocollant** à la mission qu'elle emprunte : le
   voyage a son propre record. À confirmer.
5. **On ne peut pas passer son tour** au choix de la carte, et une carte peut être prise deux
   fois (elle se cumule).
6. **Une étape quittée en cours repart de son début.** Reprendre au milieu d'une étape est
   possible plus tard, avec une nouvelle version des camps.
7. **Le record** est le nombre d'étapes réussies du plus long voyage (0 à 5), par joueur. Ni
   temps, ni classement.
8. **Le voyage n'est pas dans le fichier de sauvegarde familiale.**
9. Une fois publiée, la version 1 ne change plus : un code `VOYAGE-1-…` doit toujours donner
   le même voyage. De nouveaux réglages seront une version 2.

## Refaire les mesures

```sh
npm run balance:voyage                                   # version 1, 100 graines, 9 sacs, 8 min
TABLE=brut npm run balance:voyage                        # le voyage brut
SEEDS=300 PROFILES=expert,moyen,petit,massues POLICIES=raisonnable,hasard npm run balance:voyage
TABLE=mes-reglages.json npm run balance:voyage           # une autre table, au format de voyageTuning.ts
```

Le rapport complet est écrit dans `artifacts/voyage/rapport.json`, hors de Git.
