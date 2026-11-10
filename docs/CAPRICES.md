# Caprices des serpents — moteur 0.36 (branche `claude/caprices`)

## Annotation 0.36.2 — nouveaux départs uniquement

Les tableaux historiques ci-dessous restent la référence de la révision 1.
La révision 2 approuvée applique cinq changements : `carrefour-grand` count 1,2 ;
`sonnette-grand` hp 1,75 ; `refuge-createur-moyen` shellEvery 2, shellHp 5,
shellArmor 0,7, shellSpeed 0,6 et shellBite 1,5 ;
`trois-ponts-createur-moyen` et `course-createur-moyen` shellEvery 2,
shellHp 5, shellArmor 0,6 (shellSpeed 0,5 conservé). Le bite global reste 1.
Seules les carapaces frappent plus fort au refuge ; représailles 2/3 et entrée
au cristal 9 restent identiques. Les noms **et annonces** français du fils
restent exacts, y compris en anglais. Codes et camps historiques gardent leurs
valeurs ; voir le [bilan 0.36.2](BILAN-0.36.2.md).

9 novembre 2026. Catalogue validé par le fils le jour même, avec le parent. Document
de suivi pour le parent : [Caprices des serpents — liste à valider](https://claude.ai/artifact/BcvDr6KNm4sj8yGoV6r3oF).

Chaque mission d'expédition reçoit deux rangées de trois défis : les caprices des
serpents, variantes de règles annoncées comme les lubies de serpents gourmands, et le
défi du créateur, inventé par le fils. Le petit s'ouvre dès que la mission est gagnée, le moyen
à 2 étoiles, le grand à 3 étoiles. Un caprice change des nombres ou retire une aide ;
les six règles du fils restent vraies (soldats autonomes, achat avec les récompenses,
œufs qui éclosent, roi à trois têtes, serpents qui cherchent la voie la moins défendue,
pas de résurrection). Ni minuteur, ni série de jours, ni achat : aucun critère PEGI 2026.

## Ce que contient cette branche

| Fichier                    | Rôle                                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/caprices.ts`          | Catalogue figé des 36 défis (deux rangées), nom, annonce, règles, déblocage par étoiles, helpers           |
| `src/missions.ts`          | `MissionRun.caprice` facultatif, validé par `readMissionRun` ; nombre de serpents et œufs du plan de vague |
| `src/game.ts`              | Bourse, réserve en banque, cadence, vitesse, PV, morsures, carapaces, miel, sortes d'alliés, ruse, roi     |
| `tests/caprices.test.ts`   | 15 tests : catalogue, règles du fils, déblocage, déterminisme des 36, chaque levier, roi                   |
| `scripts/caprices-lab.mjs` | `npm run balance:caprices` : joue les 36 défis et les missions normales avec trois joueurs automatiques    |

Sans caprice, le moteur est inchangé : les 458 tests existants passent, y compris les
empreintes de partie de la 0.15 et les départs historiques. Un caprice inconnu ou d'une
autre mission rend le `MissionRun` invalide.

## Caprices des serpents

| Id                  | Nom                          | Règles                                       |
| ------------------- | ---------------------------- | -------------------------------------------- |
| `refuge-petit`      | Serpents pressés             | cadence × 0,55                               |
| `refuge-moyen`      | Méga serpent                 | serpents × 2, PV × 1,5                       |
| `refuge-grand`      | La tempête                   | serpents × 1,75, PV × 1,75, morsures × 2     |
| `trois-ponts-petit` | Bourse trouée                | bourse × 0,5                                 |
| `trois-ponts-moyen` | Blindcrocs                   | morsures × 3, PV × 2                         |
| `trois-ponts-grand` | Grandes rafales de serpents  | serpents × 1,75, PV × 1,75, morsures × 2,5   |
| `course-petit`      | Rafales de serpents          | vitesse × 1,4, PV × 0,8                      |
| `course-moyen`      | La petite tempête            | serpents × 1,5, PV × 1,5, morsures × 2,5     |
| `course-grand`      | Le roi s'invite              | roi, morsures × 2, PV × 1,5, serpents × 1,25 |
| `coquilles-petit`   | Pique-nique d'œufs           | 2 œufs de plus (3 au plus), éclosion × 0,6   |
| `coquilles-moyen`   | Grosse fringale              | serpents × 2                                 |
| `coquilles-grand`   | La tempête                   | serpents × 1,5, PV × 1,5, morsures × 1,5     |
| `sonnette-petit`    | Deux copains seulement       | 2 sortes d'alliés                            |
| `sonnette-moyen`    | Crocs pointus                | morsures × 1,5                               |
| `sonnette-grand`    | Serpents costauds            | PV × 2                                       |
| `carrefour-petit`   | Plus de miel !               | ni goûter ni miel collant                    |
| `carrefour-moyen`   | Un seul copain               | 1 sorte d'allié                              |
| `carrefour-grand`   | Le roi et sa grande fringale | roi, serpents × 1,5                          |

Noms et annonces sont ceux du fils ; ne pas les reformuler sans son accord. Leviers en
réserve dans le moteur, non utilisés : `smart` (« Serpents malins », refusé le 9 novembre)
et `noHealers`. Le fils prépare son propre caprice : il s'ajoutera au catalogue après
mesure au laboratoire.

## Le défi du créateur

Inventé par le fils le 9 novembre 2026, nommé avec lui. Rangée `createur`, mêmes règles
de déblocage. Ids `<mission>-createur-<niveau>`.

| Niveau    | Nom              | Annonce                              | Règles                                                                      |
| --------- | ---------------- | ------------------------------------ | --------------------------------------------------------------------------- |
| Facile    | La tirelire      | Garde des pièces dans la banque !    | un tiers de la bourse de départ reste à la banque, non dépensable           |
| Moyen     | Les carapaces    | Lents, mais durs comme des pierres ! | un serpent sur trois : vitesse × 0,5, blindage 50 %, PV × 3 (× 4 en 5 et 6) |
| Difficile | La grande charge | On fonce, on mord, on tient !        | tous les serpents plus rapides, plus solides et plus mordants               |

| Mission   | Tirelire (pièces bloquées) | Grande charge (vitesse, PV, morsures) |
| --------- | -------------------------- | ------------------------------------- |
| Refuge    | 150                        | × 2, × 2, × 3                         |
| Ponts     | 200                        | × 1,8, × 2, × 3                       |
| Course    | 250                        | × 1,5, × 2, × 2,5                     |
| Coquilles | 300                        | × 1,4, × 1,75, × 2                    |
| Sonnette  | 350                        | × 1,2, × 1,3, × 1,3                   |
| Carrefour | 450                        | × 1,15, × 1,25, × 1,25                |

La réserve bloque aussi la réparation du cristal et l'entraînement du héros sous le
seuil. Les carapaces sont les serpents 3, 6, 9… de chaque vague (pas le roi ni les
éclosions). Interface : afficher les pièces bloquées dans la bourse, et dessiner les
carapaces plus grandes avec une coquille (rendu en code, sans nouvelle image).

Joueur moyen, part de victoires (facile / moyen / difficile) : 100/100/78, 100/100/74,
100/100/74, 100/100/48, 98/93/67, 94/89/44 pour les missions 1 à 6.

## Difficulté mesurée

3 888 parties, 54 départs par point (3 terrains, 3 attaques, 2 couvées, 3 graines). Joueur
moyen : 99 % de victoires en mission normale, 56 % en moyenne avec le grand caprice.
Détail et graphique dans le document de suivi. Les trois joueurs automatiques ne sont pas
des enfants : recaler après les premières parties réelles.

## Reste à faire (Codex)

1. **Écran de préparation.** Après une victoire, la carte de mission montre ses deux
   rangées (`capricesForMission(id, 'serpents')` puis `'createur'`, titres dans
   `CAPRICE_SET_NAMES`) : ouverts selon `capriceUnlocked(tier, meilleures étoiles)`, fermés avec le
   nombre d'étoiles demandé. Annonce (`announce`) avec icône, lue à voix haute si la voix
   existe. Lancer = `createMissionRun(...)` puis `{ ...run, caprice: id }`.
2. **Copains.** Pour `kinds > 0`, l'enfant choisit ses sortes d'alliés avant de lancer ;
   appeler `game.chooseCapriceKinds([...])`. Sans choix, les premières sortes recrutées sont
   retenues. Le dock ne montre que les sortes permises (`game.capriceAllows(kind)`).
3. **Sauvegarde.** `MissionRun.caprice` est déjà sérialisé avec la mission. Ajouter au
   checkpoint `game.capriceKindsChosen` et le rejouer avec `chooseCapriceKinds` à la
   restauration (nouvelle version de schéma, anciens schémas inchangés).
4. **Progression et carnet.** Enregistrer par caprice la réussite (victoire) dans la
   progression familiale, par profil d'enfant ; un autocollant par caprice réussi, sans
   classement entre enfants.
5. **Codes de départ.** Nouvelle version de code avec un suffixe de caprice ; les codes v1
   et v2 restent lisibles et donnent « aucun caprice ».
6. **Traduction.** 36 noms et 36 annonces en anglais ; garder les noms du fils en français.
7. **Résultat.** Victoire sous caprice : « Caprice réussi ! » et l'autocollant gagné.
   Défaite : rappeler la règle du caprice en une phrase.
8. **Défi du créateur.** Deuxième rangée sous les caprices de chaque mission, titre
   `CAPRICE_SET_NAMES.createur`. Tirelire : afficher dans la bourse les pièces bloquées
   (`game.caprice.reserve`) et griser les achats qui entameraient la réserve. Carapaces :
   dessiner les serpents `e.shell` plus gros, avec une coquille, rendu en code sans
   nouvelle image.

Ne pas changer les règles des caprices dans ce lot ; toute nouvelle valeur passe par
`npm run balance:caprices` et l'accord du fils.

## Réalisation de l’interface — candidate 0.36.0

Les huit points de la liste historique ci-dessus sont implémentés : deux rangées
par mission et déblocage par étoiles ; choix facultatif vide/partiel/complet des
copains ; checkpoint 8 avec choix conservés ; carnets par enfant ; codes 3 avec
caprice ; textes de contexte FR/EN ; résultat avec autocollant ; tirelire et
carapaces visibles. Les règles et les36définitions restent celles du catalogue
validé, sans nouvelle mesure d’équilibrage dans ce lot.

Le point 6 historique est précisé par la dernière instruction du parent : **les
36noms ET les36annonces restent exactement français, y compris dans l’interface
anglaise**. Les menus et les explications autour sont traduits en anglais.
La voix est facultative, sur action explicite et seulement si une voix française
locale est disponible ; aucune génération ou service payant.

Formats actuels : checkpoint 8 (lecture 1–7 conservée), code 3 (lecture1/2 sans
caprice conservée), enveloppe familiale 4 (lecture 1–3 conservée). Les carnets
acceptent1–8enfants et des noms de 24 caractères au plus, avec36cases chacun.
Le carnet actif n’est pas un profil de campagne : étoiles et progression restent
partagées. Une expédition conserve son propriétaire lors d’un changement de
carnet, d’un retour en classique, d’une reprise ou d’un réessai ; un nouveau
départ préparé prend le carnet actif.

Importer une enveloppe 4 remplace aussi les carnets ; importer une ancienne
enveloppe remplace les carnets par un carnet vide, après avertissement explicite.
Ce n’est pas une fusion et aucune réussite historique n’est inventée. Une erreur
de validation ou d’écriture laisse le fichier familial actuel intact.

[Bilan et preuves0.36.0](BILAN-0.36.0.md). Candidate privée : pas de fusion ou
publication avant la suite autorisée par le parent ; revue finale et conseil
encore en attente au moment de la préparation de livraison.
