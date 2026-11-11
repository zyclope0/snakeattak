# Identité des chapitres — 0.19

Le périmètre reste celui des douze vagues. La première partie conserve son
apprentissage des voies, des vifs et des œufs ; le bosquet montre une escorte
parapluie/cracheur ; les vieilles pierres ouvrent avec les ressorts groupés et
une ruée moins serrée. Aucun ennemi supplémentaire ni statistique renforcée.

## Cartographie exacte

`variantFor(wave, index)` reçoit le nombre de serpents **restant à faire entrer**,
donc les grands indices arrivent avant les petits. Les indices ci-dessous sont
ceux de cette API, pas des numéros d'arrivée.

| Vague | Modification 0.19                                                                          | Conséquence observable                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| 1–6   | Aucune composition ni cadence modifiée                                                     | L'apprentissage initial reste identique.                                                                                   |
| 7     | Permutation des indices 8 et 11 : le cracheur de 8 passe en 11, le normal de 11 passe en 8 | Début réel : normal, parapluie, cracheur. Un spécialiste à distance suit une protection mobile.                            |
| 8     | Aucune                                                                                     | La grande couvée reste inchangée.                                                                                          |
| 9     | Permutation des indices 11 et 14 : le ressort de 11 passe en 14, le vif de 14 passe en 11  | Premier trio réel : ressort, carapace, ressort. Les quatre ressorts de la vague restent les quatre mêmes types de menaces. |
| 9     | Délais après chaque apparition : 0,6 / 0,6 / 1,6 s au lieu de 0,4 / 0,4 / 2 s              | Même budget de 2,8 s par trio ; pointes moins serrées, respiration plus courte.                                            |
| 10–12 | Aucune                                                                                     | Trois fronts, mamba et roi conservent leur ordre et leurs règles.                                                          |

Les briefings 7 et 9 décrivent ces arrivées. Celui de 7 conserve explicitement
le rôle du cracheur à distance ; celui de 9 conserve les impulsions des ressorts.

Règle d'arbitrage : ne pas inventer de nouveaux renforts ni accélérer la campagne.
Deux permutations d'ennemis existants et un rythme sont suffisants pour cet
essai. Le coût possible est un changement de difficulté lié à l'ordre, même
quand les budgets sont égaux : le laboratoire apparié tranche cette question.

## Invariants vérifiés

- Effectif prévu, multiensemble des variantes et somme des PV réguliers conservés
  pour chacune des douze vagues. Le test calcule les PV avec les multiplicateurs
  de variante et le bonus ×1,6 de certains indices des vagues paires, puis vérifie
  les PV effectivement créés par `Game`. Le roi distinct est exclu de cette somme
  régulière ; aucune branche du boss n'est modifiée.
- Chaque permutation échange deux indices de même reste modulo 3. Elle conserve
  ainsi la classe de bonus PV, en plus des quantités de chaque spécialiste.
- Aux 30 calculs/s du moteur, les seize arrivées de la vague 9 restent espacées
  de 430 ticks entre première et dernière : environ 14,333 s dans les deux
  versions. Le minuteur existant ajoute un tick après les délais courts ;
  il n'est pas modifié pour contourner cet arrondi.
- Signatures de `variantFor`, `spawnDelay`, `entryLane`, `eggIncubation`
  inchangées. `entryLane`, `eggIncubation` et `wavePattern` sont inchangés.
- Introductions existantes conservées : sonnette 4, rouages 5, parapluie 6,
  cracheur 7, royal 8, ressort 9, mamba 10. Une seule sonnette par vague.
- Aucun changement de prix, gains par mort, récompenses, dégâts, PV individuels,
  poison à impact unique, réactions de mort de 2/3 PV ou règles des œufs.
  Les œufs prévus gardent leurs quantités, voies et incubations. Les résultats
  de combat, dont les éclosions effectivement rencontrées, peuvent dépendre de
  sa durée ; l'égalité des budgets ne promet pas des parties identiques.
- Aucun tirage aléatoire ajouté, aucune règle adaptative. Les paramètres sont
  fixés avant partie et ne lisent pas les performances du joueur.

## API pour le menu et la préparation

`src/waves.ts` exporte `ChapterIdentity` et la fonction pure
`chapterIdentityForWave(wave: number): ChapterIdentity`.

```ts
type ChapterIdentity = Readonly<{
  firstWave: number;
  lastWave: number;
  focus: string;
  tip: string;
}>;
```

Les objets retournés sont gelés et stables pendant un même chapitre. `focus`
reste court (36 caractères maximum), `tip` tient en 110 caractères maximum.
Les chapitres portent les intentions « Découvrir les trois voies »,
« Déjouer les escortes » et « Tenir le dernier rempart ». Les noms de lieux
restent fournis par `levelForWave` ; aucun nom de carte n'est dupliqué ici.
Les bornes reprennent sa convention : vague 0 ou négative et entrée non finie
vers le premier chapitre ; au-delà de 12 vers le dernier. Aucun état de partie,
stockage ou objet du navigateur n'est nécessaire à cette lecture.

## Vérifications et gel

`tests/chapter-rhythm-019.test.ts` exerce les vraies apparitions du moteur et
les données publiques, sans remplacer le combat par des mocks. Les premières
assertions ont produit trois échecs attendus sur les anciennes compositions et
cadences ; le test de budgets était déjà vert. L'API de métadonnées a ensuite
été vérifiée en RED avant son implémentation. Les cinq tests de chapitre et les
six tests d'aventure passent ensemble.

Preuves locales :

- `/tmp/019-chapters-red.log` : 3 échecs attendus, 1 invariant vert.
- `/tmp/019-chapters-green.log` : 4/4 verts avant ajout des métadonnées.
- `/tmp/019-chapters-metadata-red.log` : échec attendu sur l'API absente.
- `/tmp/019-chapters-targeted-final.log` : résultat ciblé final.
- `/tmp/019-chapters-native.log` : premier passage global, échec du briefing
  7 sur le mot « distance », corrigé et revérifié avec les tests existants.
- `/tmp/019-chapters-native-final.log` : 239/240 verts ; seul échec concurrent
  dans le nouveau test de séparation des étiquettes d'œufs de l'autre tâche,
  encore en RED pendant ce passage. Aucun échec restant de cette tâche.
- `/tmp/019-chapters-build.log` : compilation interrompue par l'inférence de
  type de `map(Object.freeze)`, corrigée avec une fonction explicite, et par
  l'API d'étiquettes de l'autre tâche encore absente. La compilation et la suite
  globale cohérente sont à refaire après gel des tâches par l'intégrateur.

À la demande de l'intégrateur, aucun long laboratoire concurrent n'est lancé.
Les permutations et délais ci-dessus sont gelés pour sa comparaison appariée
0.18/0.19, puis sa validation sur graines distinctes. Aucun verdict d'équilibrage
global n'est revendiqué avant ces résultats. Aucun déploiement effectué ici.

## Conseil simulé à cinq regards

| Regard                     | Appréciation et réserve                                                                                                                                                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Game designer              | L'apprentissage initial reste familier ; le bosquet illustre une escorte et le dernier chapitre annonce les ressorts. Variation limitée à deux vagues, donc identité à confirmer en jeu.                                               |
| Équilibrage                | Quantités, variantes et budgets PV exacts conservés. L'escorte peut mieux protéger le cracheur et deux ressorts précoces peuvent être plus dangereux : acceptation conditionnée au laboratoire apparié puis à la validation distincte. |
| Interface / DA             | Les intentions courtes sont disponibles pour les cartes et la préparation ; les briefings nomment la menace réelle. La tâche ne modifie aucun rendu ni nom de lieu. Vérifier leur lisibilité mobile lors de l'intégration.             |
| Développement / mobile     | Fonctions pures, objets gelés, zéro tirage ou allocation par tick de simulation supplémentaire ; coût négligeable. Suite globale et build final restent les portes de livraison de l'intégrateur.                                      |
| Projection joueur 8–10 ans | « Un parapluie suivi d'un cracheur » donne un problème concret à résoudre avec ses unités autonomes. La compréhension des escortes et le plaisir n'ont pas été observés chez un enfant réel.                                           |

Verdict technique de cette tâche : prêt pour mesure et intégration, sans hausse
de budgets. Les réserves d'équilibrage et d'usage restent explicites jusqu'aux
mesures de l'intégrateur et à un éventuel essai humain.
