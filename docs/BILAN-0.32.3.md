# Étape 2 — textes sources au tutoiement, 0.32.3

8 novembre 2026, Europe/Zurich. GO explicite du parent après le suivi de la
fluidité du S24 en 0.32.2. Base : 7932b56 ; branche fix/tutoiement-0323 dans
/workspace/conquete-serpents-0322. **Recette terminée, toutes les commandes ci-dessous vertes.**
L'étape 3 (icône et choix d'identifiant) n'est pas engagée.

## Constats de l'audit et résultats

| Constat                                              | Fait / pas fait                                                                                                                                                                             | Preuve                                                                                                                                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 — Dock et plateau ordinateur                       | Livraison 0.32.2 conservée ; aucun changement CSS/structure HTML à cette étape                                                                                                              | [Bilan 0.32.2](BILAN-0.32.2.md), git diff 7932b56 sans changement de src/style.css ni index.html                                                                                     |
| 2 — Bandeau d'événement                              | Position conservée ; présentation lit maintenant directement les textes sources                                                                                                             | src/render/presentation.ts:126 ; pas de changement de battleFeedback.ts ni battleNotices.ts                                                                                          |
| 3 — Tutoiement automatique et sources au vouvoiement | **Fait** : 24 chaînes formelles corrigées ; 1 autre phrase de vocabulaire, childCopy supprimé et ses 11 appels remplacés par une lecture directe ; garde automatique des sources et du HTML | [25 modifications détaillées](../reports/suivi-0.32.3/textes-modifies.json), tests/child-copy.test.ts ; src/waves.ts:14, src/missions.ts:30, src/game.ts:126, src/checkpoints.ts:233 |
| 4 — Trait blanc du héros                             | Correction 0.32.2 conservée ; aucun asset modifié ou généré                                                                                                                                 | src/style.css inchangé ; tous les fichiers src/assets inchangés                                                                                                                      |
| 5 — Tutoriel indulgent                               | Aucune règle ni difficulté changée ; mêmes parties pour les mêmes codes et commandes                                                                                                        | [Témoins](../reports/suivi-0.32.3/replay-summary.json), [contrôle lexical du moteur](../reports/suivi-0.32.3/domain-token-proof.json)                                                |

## Textes corrigés et suppression du convertisseur

Le chiffre initial de 13 était incomplet. La contre-vérification en trouvait 21
dans les trois fichiers cités et deux lors de la reprise. L'inventaire complet
ajoute « placez » dans l'explication des volants, que le convertisseur lui-même
oubliait : **24 chaînes au vouvoiement**. Une vingt-cinquième phrase remplace
« renforts » par « alliés » pour conserver le vocabulaire déjà affiché.

Répartition des 25 littéraux modifiés : game.ts 3, checkpoints.ts 2, waves.ts 11,
missions.ts 9. Le texte initial devient directement « Choisis un allié. », déjà
présenté à l'enfant par le cas spécial du convertisseur. Les phrases avec
« armée » et les trois conseils au pluriel utilisent directement « alliés »
comme auparavant. Aucun nom d'unité, pouvoir, statistique ou consigne tactique
n'est changé. Le tutoiement ne dépend plus d'une traduction par remplacement.

**Aucun adaptateur historique conservé.** encodeCheckpoint n'enregistre pas le
champ message ; decodeCheckpoint le reconstruit. Les anciens camps continuent
donc à charger, avec « Ton camp est prêt. » ou « Camp retrouvé ! Prépare la
prochaine vague. ». Les formats 1 à 7, clés de stockage et règles de validation
restent les mêmes. Les seuls changements de checkpoints.ts sont ces deux textes.

Le test de garde inspecte src/ et index.html sans distinguer écran ouvert ou
fermé : aucun mot « vous / votre / vos », ni les impératifs repérés dont
« placez ». Les fichiers de tests et les documents peuvent citer les anciens
textes pour expliquer et contrôler la migration. Pas d'extraction multilingue
ni de traduction de l'application dans cette étape.

## Instantanés : ce qui change, et pourquoi

1. **Témoin legacy de 180 états**, tests/boss-016.test.ts : l'ancienne empreinte
   complète est `18761719ae593f389cf84e34b1f96e97e50f0f7abfb5f553c5525f01ac2a0d1b`.
   Elle comprenait le champ humain game.message, désormais rédigé autrement.
   Avant toute édition, l'empreinte de la même projection sans ce seul champ a
   été mesurée sur 7932b56 :
   `27f9cf29d4caabf8f3f8f6108d2e09d5ed5a42721e5cf83a8ab9def565b8e34a`.
   C'est le nouveau témoin du test ; aucun autre champ supplémentaire n'est
   exclu. Les précédentes exclusions du témoin 0.15 restent celles d'origine.
   L'ancienne empreinte reste dans le commentaire et le reçu. Les six combats
   et leurs 180 états, dont le roi et les zones, sont toujours exercés.
2. **Deux anciens tests childCopy**, remplacés : ils prouvaient que le
   convertisseur changeait l'affichage en laissant les sources formelles.
   Ce comportement est précisément supprimé. Les quatre tests actuels contrôlent
   les sources, les messages réellement produits, les sept formats de camp et
   les témoins de départ. Le total natif passe ainsi de **423 à 425**.
3. **Nouvelle fixture de déterminisme**, capturée sur la base inchangée avant
   modification, jamais régénérée pour faire passer le code édité :
   tests/fixtures/tutoiement-0323-replays.json. Elle contient **24 départs**,
   **89 642 pas**, **3 212 états** et **119 camps**. Trois classiques et les
   six missions sur trois graines, plus les anciens départs du refuge sans
   rules:2. Tous les champs propres de Game sont comparés par empreinte hors
   seul message ; les sauvegardes sont comparées **octet pour octet**, sans
   exclusion. Les mêmes commandes publiques, achats, miel et encouragements
   sont rejoués à pas fixe de 1/30 s jusqu'à la fin. Résultats : 21 victoires et
   3 défaites classiques, identiques avant/après ; pas une recherche d'équilibrage.
4. **Autres témoins**, notamment les coordonnées des terrains classiques :
   inchangés. Aucun hash supplémentaire n'a été recalculé pour masquer un écart.

[Ancienne empreinte et projection, mesurées avant édition](../reports/suivi-0.32.3/legacy-baseline.json).
La relecture indépendante a rechargé en mémoire les sources exactes 7932b56 depuis
Git et reproduit séparément les 24 cas, les camps et les deux empreintes legacy.
[Compte rendu](../reports/suivi-0.32.3/review.json) : aucun point critique, important
ou mineur. Les recettes navigateur et l'inspection APK sont réalisées par le
responsable, distinctement de cette revue.

## Commandes et état de la recette

| Commande                                                           | Résultat                                                                          |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| npm test sur la base, avant édition                                | 423/423                                                                           |
| tests/child-copy.test.ts avant correction                          | 3 échecs éditoriaux attendus ; 1 témoin de parties vert                           |
| tests/child-copy.test.ts + tests/boss-016.test.ts après correction | 22/22                                                                             |
| npm run verify                                                     | **425/425, zéro échec** ; types, build, formatage et budgets OK                   |
| npm run test:browser                                               | Deux parcours principaux et deux tablettes ; zéro erreur JavaScript               |
| npm run test:audit                                                 | 13/13                                                                             |
| npm run test:child-mobile                                          | 6 configurations, zéro erreur                                                     |
| npm run test:departures                                            | 108 configurations du codec et parcours classique/import/reprise/copie/tactile OK |
| npm run test:threat-preparation                                    | 5 écrans, zéro erreur                                                             |
| npm run test:presentation                                          | 14 scénarios, zéro erreur                                                         |
| npm run test:offline                                               | 10 contrôles ; formats 1 à 7 et trois fonds embarqués, zéro erreur                |
| npm run test:interface-audit                                       | 24/24, zéro erreur                                                                |
| npm run android:apk:debug                                          | Compilé, puis assemblage offline avec configuration normale comme en 0.32.2       |

[Reçu consolidé](../reports/suivi-0.32.3/verification.json), [garde de sources](../reports/suivi-0.32.3/copy-guard.json).

Les sorties historiques des scripts sont sauvegardées et restaurées après copie
des reçus actuels dans reports/suivi-0.32.3. Les captures de 0.32.2 sont conservées ;
les nouvelles sont copiées dans docs/captures-0.32.3. Pas de nouvelle CI distante.

## APK, fichiers et limites

APK debug **0.32.3/code 38**, même identifiant com.conqueteserpents.famille et
certificat SHA256 d018e28e8ab916b4cb46ef53e2c696079415304be87cb0cf90662df94598d599.
Les 27 fichiers web embarqués correspondent octet pour octet au build vérifié.
Démarrage normal, sans surcouche de performance ; paysage conservé et aucune
permission INTERNET. [Reçu APK](../reports/suivi-0.32.3/apk.json).
Le retour de fluidité physique reçu concernait le contexte de l'APK 0.32.2 ;
aucun essai physique de ce nouvel APK ni mesure FPS/RAM n'est prétendu réalisé.

Fichiers applicatifs : game.ts, checkpoints.ts, missions.ts, waves.ts ; accès
simplifiés dans render/presentation.ts, ui/coaching.ts, ui/controls.ts,
ui/expeditions.ts, ui/hud.ts, ui/unitGuide.ts ; ui/childCopy.ts supprimé.
Version : package.json, package-lock.json, android/app/build.gradle.
Tests : child-copy.test.ts, boss-016.test.ts, tutoiement-replay.ts et sa fixture.
Suivi : ce bilan, PLAN-ACTUEL.md, IMPLEMENTATION-0.32.3.md, rapports et captures.

Aucun asset, SDK, achat, publicité, serveur, règle de difficulté ou identifiant
définitif ajouté. Pas de publication web/Play, de fusion ni poussée distante.
Le travail reste révisable sur sa branche locale ; les étapes 3 et 4 attendent
leur GO respectif. **STOP après cette étape 2.**

## Publication demandée après la livraison — 8 novembre 2026

Le parent demande explicitement « met a jours le site ». Publication de la
0.32.3 sur l'adresse existante, avec les correctifs0.32.2 et les textes 0.32.3.
Audience publique et identifiant Sites conservés, aucune étape 3 ou 4 commencée.

- Source applicative vérifiée : 2d47c3d62af16e0c406b77c08a1d7685147481c9.
- Commit du site statique poussé : 57ff7ce6293302f14edd29912cb30c63f5452ace.
- Archive de 28 fichiers, créée depuis ce commit, SHA256
  b800d05529324a9389c7436e36e95a79bed09bd49f50d2614a53958013226b97.
- Version Sites 16, déploiement confirmé réussi sur
  https://conquete-serpents-famille.zyclope.chatgpt.site.
- Chromium sur le vrai site : HTTP200, version visiblev0.32.3, mission lancée,
  quatre favoris, canvas 1065,95×600,81 à 1280×800 et zéro erreur JavaScript.
  [Recette en ligne](../reports/live-verification-0.32.3.json).
- Le paquet publié correspond aux 27 fichiers web du build déjà testé, avec le
  manifeste d'hébergement ; aucun code applicatif modifié lors de la publication.

[Reçu complet](../reports/deployment-0.32.3.json). La mention « pas de publication »
plus haut décrit l'état au STOP initial, avant cette nouvelle demande.
**STOP maintenu avant l'icône et le choix d'identifiant de l'étape 3.**
