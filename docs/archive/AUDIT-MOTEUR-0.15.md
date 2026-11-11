# Audit moteur et architecture — 0.15

Audit du 3 novembre 2026, comparé au snapshot 0.14. Le « backend » est ici le moteur local : aucune application serveur, base distante, connexion ou API payante n’est nécessaire pendant une partie. Cette architecture reste adaptée au jeu familial.

## Périmètre

Lecture de `AGENTS.md`, `docs/ARCHITECTURE.md`, du catalogue, des règles et des dépendances du moteur. Corrections limitées à `src/game.ts`, `src/session.ts`, `src/checkpoints.ts` et `src/navigation.ts`, avec le petit module pur `src/campLayout.ts` pour les camps exceptionnellement denses. `src/placement.ts` et `deploy/policy.ts` ont été contrôlés et conservés. Aucun changement des coûts, dégâts, chances, pouvoirs, vagues, obstacles ou règles de déplacement ; aucune dépendance ajoutée.

## Défauts reproduits et corrigés

| Entrée ou scénario                                        | Comportement 0.14                                                                                | Correction 0.15                                                                                                                                                                                  |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Recrue inconnue, `undefined`, `null`, nom hérité d’Object | `isUnlocked` pouvait annoncer un inconnu disponible ; le recrutement pouvait lever une exception | Vérification du type et de l’appartenance propre au catalogue avant toute lecture de statistiques. Refus sans dépense, y compris suggestions et sélection.                                       |
| `Game.step(NaN)`                                          | Horloge, recharges et incubation contaminées ; œufs supprimés                                    | Les durées non finies sont ignorées sans mutation.                                                                                                                                               |
| Pas nul ou négatif                                        | Une apparition et un tirage pouvaient se produire malgré zéro temps écoulé                       | Pas ignoré avant toute action. Une durée positive excessive garde la borne existante de 0,05 s.                                                                                                  |
| Vitesse de session corrompue à l’exécution                | `NaN` bloquait ensuite l’accumulateur ; `Infinity` aurait rendu la boucle infinie                | Le calcul utilise uniquement ×1 ou ×2, avec retour à ×1 pour une autre valeur. La propriété publique et les deux vitesses prévues sont conservées.                                               |
| Décodage de `null` ou `undefined`                         | Exception avant le bloc `try`                                                                    | Toute entrée autre qu’une chaîne est refusée.                                                                                                                                                    |
| Coordonnées non finies                                    | `blocked(NaN, y)` disait libre ; la projection pouvait renvoyer `NaN`                            | Collision bloquée et chemin vide ; une demande de projection invalide lève explicitement `RangeError`. Les entrées normales du joueur et les fichiers restaurés valident déjà leurs coordonnées. |
| Camp légal de 206 unités                                  | Écrit en 15 236 caractères, puis refusé par le plafond de lecture indépendant de 160             | Borne de lecture et d’écriture à 512 survivants, sans plafond de recrutement ajouté.                                                                                                             |
| Trame dépassant les bornes de lecture                     | L’encodeur pouvait produire une trame illisible                                                  | Refus au-delà de 100 000 caractères ou 512 survivants ; la synchronisation ne remplace alors pas le camp enregistré.                                                                             |
| Survivant avec `0 < hp < 0,001`                           | Conservé par le moteur et l’encodeur mais rejeté au chargement                                   | Lecture de toute santé finie strictement positive jusqu’au maximum du personnage. Aucun arrondi de combat et aucun mort restauré.                                                                |

La borne de 512 protège le lecteur sans limiter les placements du jeu. Les domiciles légaux sont espacés d’au moins 28 pixels dans un rectangle de 384 × 432 pixels. Un carré de 19 pixels a une diagonale de 26,87 pixels : il ne peut contenir deux domiciles. Le rectangle tient dans 21 × 23 cases, soit une borne supérieure de 483 domiciles. Cette borne géométrique ne garantit pas qu’un camp dense puisse être réorganisé sur toutes les cartes.

Le cas de santé très faible peut provenir des calculs existants : 25 soustractions de 13,2 à 330 laissent environ `1,53e-13` avec les nombres JavaScript. La sauvegarde respecte désormais le même critère `hp > 0` que le moteur. Les PV nuls, négatifs, non finis ou supérieurs au maximum restent refusés.

La clé locale `conquete-serpents:camp:v1`, l’écriture au format 2 et la lecture des formats 1/2 sont conservées. Identifiants uniques, types d’unités, coordonnées, économie, santé et effectif restent validés. Les temporisations, chemins et objets de rendu ne sont pas sauvegardés. Les échecs de stockage restent confinés à la sauvegarde locale. Cette validation ne constitue pas un mécanisme contre la modification volontaire d’une partie locale.

## Horloge, ressources et architecture

La session garde 30 calculs/s et un rattrapage limité à 0,1 s par image, multiplié par la vitesse valide : au plus trois ou six pas, plus le reliquat inférieur à un pas. Pause et fin de partie effacent le reliquat ; redémarrer restaure sélection, vitesse, horloge et partie neuve. Les tests existants couvrent ces transitions, les nouveaux couvrent les valeurs runtime invalides.

Le graphe des imports runtime des cinq modules audités comprend 17 modules internes et aucun import externe. Il n’atteint ni Phaser, ni DOM, ni réseau. Phaser reste dans l’assemblage et le rendu. Aucun import profond de `phaser/src` ou `phaser/dist` dans `src/`.

Le cache A* reste partagé et borné : sa clé distingue la carte et les cellules ; il rend des copies indépendantes. Une modification d’un chemin rendu ne modifie pas le chemin suivant. Le vidage existant borne le cache à 1 025 entrées au maximum. Aucune réécriture A*, boucle de rééquilibrage ou cache supplémentaire introduit.

La politique HTTP reste adaptée au site statique : HTML revalidé, cache d’un an uniquement pour `/assets/*` dont les noms sont produits avec empreinte par Vite, scripts de la même origine, refus d’iframe et permissions caméra/micro/géolocalisation désactivées. L’exception du prototype V4 et l’export portable sont conservés. L’application des en-têtes dépend de l’hébergeur ; `file://` n’a pas d’en-têtes HTTP. Ce contrôle de source ne remplace pas une vérification sur l’hébergement publié.

## Preuves et vérification

`tests/audit-engine-015.test.ts` ajoute douze tests : onze régressions observées rouges avant leur correction, plus un contrôle du plafond positif existant de durée. Les gardes portent sur le comportement réel, sans simuler Phaser ou le stockage du navigateur.

Comparaison déterministe reproductible, depuis le projet :

```sh
node --experimental-strip-types tests/compare-engine-015.mjs /workspace/conquete-serpents-baseline-0.14 /workspace/conquete-serpents-codex
```

Le comparateur accepte deux répertoires en arguments ; il reste facultatif, car la suite normale ne dépend pas d’un ancien snapshot. Neuf scénarios : graines `15`, `1234`, `4294967295` × vagues terminées `0`, `4`, `8`, 600 pas chacun, recrutement normal et les deux miels. S’y ajoutent 600 images par version avec vitesses ×1/×2, pause et redémarrage. Les 119 instantanés JSON sont strictement égaux entre 0.14 et 0.15 sur ces entrées valides. Empreinte SHA-256 du lot : `25da4f1b6ff6c4d9f9c30a92d81630da263718da01b752a56a2ae9e39dd3a7d8`.

Mesure indicative avec le même `scripts/benchmark.mjs`, exécuté sur les deux versions, avec plusieurs répétitions pendant la validation : 68 alliés, 120 apparitions prévues, 3 600 pas. Premier échantillon moyenne/p95 : 0.14 **0,204/0,434 ms**, 0.15 **0,208/0,446 ms**. Les répétitions fluctuent avec les autres vérifications dans le cloud ; ces mesures ne prouvent ni une amélioration ni une régression de performances. Elles excluent rendu, GPU et tablette physique.

Après les dernières corrections : **153/153 tests natifs passent**, le contrôle TypeScript et le contrôle de format des fichiers audités passent. Les contrôles de build et de navigateur de la livraison globale sont menés séparément avec la refonte d’interface ; aucun navigateur n’a été lancé par cet audit.

## Camps exceptionnellement denses

Un défaut supplémentaire a été reproduit en 0.14 : 200 ou 206 unités recrutées avec 100 000 pièces sur la grille de pas 28 déclenchaient `Aucune place libre dans le camp` aux passages 4→5 et 8→9. Une recherche au pas 6 après l’échec du pas 12 ne résolvait qu’un cas sur quatre ; cette tentative a été retirée.

La correction garde entièrement le placement ordinaire : les domiciles déjà légaux sont réservés, puis les autres sont projetés comme auparavant. Seulement si cette réservation échoue, `campLayout.ts` réorganise les domiciles sur un maillage hexagonal dont les points et les centres des cellules A* sont légaux. L’espacement de 28 pixels est respecté, avec une marge numérique de `0,000001` pixel. Ce maillage offre 239 points dans la clairière, 236 dans les deux cartes suivantes. Les unités sont traitées par identifiant, puis affectées au point libre le plus proche ; aucun hasard n’est consommé.

Les domiciles et positions sont planifiés avant de modifier les personnages. Si les positions existantes empêchent encore de projeter les personnages déplacés, tous reprennent leurs domiciles planifiés. Les quatre transitions 200/206 × 4/8 passent désormais avec domiciles distincts espacés d’au moins 28 pixels, positions légales, identifiants/PV/or/hasard conservés et sauvegarde rechargeable. Le comportement normal reste strictement égal au snapshot sur les 119 instantanés comparés.

Un fichier exceptionnel dépassant la capacité de ce maillage reste accepté jusqu’à la borne de 512 survivants si ses autres champs sont valides. En dernier recours, les occupants supplémentaires partagent un point légal, en choisissant d’abord les points les moins occupés puis le plus proche. Ils ne sont ni supprimés ni ressuscités. L’espacement des domiciles peut donc être dégradé uniquement dans ce cas de débordement ; aucune limite de recrutement n’est ajoutée. Un camp de 260 unités restauré et relancé vérifie ce comportement sans exception et sans perte de PV, d’unités, d’or ou d’état aléatoire pendant la normalisation.

Renforcer et mieux protéger le boss reste une évolution future explicite. Aucun renforcement du boss ni pouvoir supplémentaire n’est inclus dans cet audit.
