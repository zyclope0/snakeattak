# Caprices des serpents — moteur 0.36 (branche `claude/caprices`)

9 novembre 2026. Catalogue validé par le fils le jour même, avec le parent. Document
de suivi pour le parent : [Caprices des serpents — liste à valider](https://claude.ai/artifact/BcvDr6KNm4sj8yGoV6r3oF).

Chaque mission d'expédition reçoit trois caprices : variantes de règles annoncées comme
les lubies de serpents gourmands. Le petit s'ouvre dès que la mission est gagnée, le moyen
à 2 étoiles, le grand à 3 étoiles. Un caprice change des nombres ou retire une aide ;
les six règles du fils restent vraies (soldats autonomes, achat avec les récompenses,
œufs qui éclosent, roi à trois têtes, serpents qui cherchent la voie la moins défendue,
pas de résurrection). Ni minuteur, ni série de jours, ni achat : aucun critère PEGI 2026.

## Ce que contient cette branche

| Fichier                    | Rôle                                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/caprices.ts`          | Catalogue figé des 18 caprices (nom, annonce, règles), déblocage par étoiles, helpers                      |
| `src/missions.ts`          | `MissionRun.caprice` facultatif, validé par `readMissionRun` ; nombre de serpents et œufs du plan de vague |
| `src/game.ts`              | Bourse, cadence, vitesse, PV, morsures, miel, sortes d'alliés, ruse des serpents, roi en dernière vague    |
| `tests/caprices.test.ts`   | 12 tests : catalogue, règles du fils, déblocage, déterminisme des 18, chaque levier, roi                   |
| `scripts/caprices-lab.mjs` | `npm run balance:caprices` : joue les 18 caprices et les missions normales avec trois joueurs automatiques |

Sans caprice, le moteur est inchangé : les 458 tests existants passent, y compris les
empreintes de partie de la 0.15 et les départs historiques. Un caprice inconnu ou d'une
autre mission rend le `MissionRun` invalide.

## Catalogue

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

## Difficulté mesurée

3 888 parties, 54 départs par point (3 terrains, 3 attaques, 2 couvées, 3 graines). Joueur
moyen : 99 % de victoires en mission normale, 56 % en moyenne avec le grand caprice.
Détail et graphique dans le document de suivi. Les trois joueurs automatiques ne sont pas
des enfants : recaler après les premières parties réelles.

## Reste à faire (Codex)

1. **Écran de préparation.** Après une victoire, la carte de mission montre ses trois
   caprices : ouverts selon `capriceUnlocked(tier, meilleures étoiles)`, fermés avec le
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
6. **Traduction.** 18 noms et 18 annonces en anglais ; garder les noms du fils en français.
7. **Résultat.** Victoire sous caprice : « Caprice réussi ! » et l'autocollant gagné.
   Défaite : rappeler la règle du caprice en une phrase.

Ne pas changer les règles des caprices dans ce lot ; toute nouvelle valeur passe par
`npm run balance:caprices` et l'accord du fils.
