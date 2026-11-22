# Bilan — étape d'hygiène (21 novembre 2026)

Demande du parent : pause dans les fonctionnalités, stabiliser avant d'en ajouter. Audit du
jeu, corrections confirmées, vérification en jouant.

## Verdict : prêt sous conditions

Prêt pour le test fermé **si** le build 64 passe la recette sur le vrai téléphone (liste à la
fin). Ce qui le justifie : aucune perte de progression trouvée sur le chemin des testeurs
(build 63 vers la version actuelle), quatre défauts confirmés sont corrigés, deux autres sont
décidés et viennent en lots séparés, toutes les recettes sont vertes. Ce qui manque : rien n'a été essayé sur un
téléphone ni avec les enfants.

## Référence

- Commit de départ : `c19c43a` (`main`, publié le 21 novembre), arbre propre, les 5 contrôles
  de la CI verts sur ce code.
- Points d'entrée : `index.html` → `src/main.ts` → `src/bootstrap.ts`. Le site (`npm run
build`, `dist/`) et l'application (`npm run build:android`, `dist-android/`, enveloppé par
  Capacitor) partagent tout `src/` ; `deploy/buildTargets.ts` retire de l'application ce qui
  n'existe que sur le site.
- Build des testeurs : 0.39.0 / build 63, commit `fb347dd`.
- Recettes de cette étape : `scripts/hygiene/`. Elles servent le paquet Android hors ligne à
  l'origine de l'application (`https://localhost`) et écrivent dans `artifacts/hygiene/`.
  Depuis le 22 novembre, quatre d'entre elles tournent dans la CI (tâche « sauvegardes »,
  `npm run test:saves:*`) : mise à jour depuis l'appareil figé d'un testeur, fichier familial,
  fermeture forcée, doubles appuis.

| Recette                | Ce qu'elle fait                                                           |
| ---------------------- | ------------------------------------------------------------------------- |
| `reference-refuge.mjs` | « Le refuge », code `REFUGE-2-0000-7X86-R0`, un achat, mêmes gestes       |
| `reference-charge.mjs` | Vague 11 de la grande aventure avec 48 alliés (graine 1234), compteur     |
| `upgrade-63.mjs`       | Joue avec le paquet du build 63, puis sert le paquet actuel sans effacer  |
| `forced-close.mjs`     | Tue le jeu sans prévenir, rouvre sur ce que l'appareil gardait            |
| `family-backup.mjs`    | Export, 11 imports invalides, restauration sur un appareil vide           |
| `double-taps.mjs`      | Chaque bouton qui donne ou dépense, touché deux fois                      |
| `reward-double-tap.ts` | Panneau des cadeaux de l'aventure sans fin, cinq places prises            |
| `first-game.mjs`       | Première partie d'un profil neuf à 780×360, en ne touchant que le bouton  |
| `memory.mjs`           | « Le refuge » rejoué dans la même page, tas relevé à chaque fin de partie |

## Défauts corrigés

Aucun ne change une règle, une valeur d'équilibrage ni une partie de référence.

### 1. Après un seul refus d'écriture, plus rien n'était sauvegardé de la séance

- **Impact** : perte de progression. Si l'appareil refuse une écriture une fois (stockage
  plein un instant), l'enfant continue de jouer, et tout ce qu'il gagne ensuite disparaît à la
  fermeture.
- **Reproduction** : stockage qui refuse une écriture puis remarche ; jouer 9 vagues, gagner
  deux chapitres, fermer. Avant : au redémarrage, étoiles `[0,0,0]`, vague 3. Après : étoiles
  `[3,2,0]`.
- **Fichiers** : `src/familyPersistence.ts`, `src/checkpoints.ts`. Un stockage qui n'a pas pu
  être **lu** reste intouché, comme avant.
- **Tests** : `tests/family-persistence-020.test.ts`, `tests/checkpoints.test.ts`.

### 2. Un fichier de sauvegarde illisible était remplacé sans copie

- **Impact** : perte de progression, cas rare (fichier abîmé, ou écrit par une version plus
  récente que celle qui le lit). La nouvelle partie écrasait l'ancienne dès sa première
  sauvegarde.
- **Reproduction** : mettre un fichier familial de « version 99 », démarrer, jouer. Avant :
  le fichier est remplacé. Après : son texte est d'abord recopié sous
  `conquete-serpents:family-refused:v1` (une clé par joueur, effacée avec lui).
- **Fichiers** : `src/familyPersistence.ts`, `src/storageKeys.ts`, `src/players.ts`.
- **Limite** : le jeu ne relit pas cette copie. Elle empêche la destruction ; un bouton pour
  la restaurer serait une fonctionnalité.
- **Tests** : `tests/family-persistence-020.test.ts`, `tests/storage-keys.test.ts`,
  `tests/players.test.ts`.

### 3. Un double appui prenait un cadeau à l'aveugle

- **Impact** : récompense faussée. Le deuxième appui d'un doigt qui rebondit tombait sur le
  bouton dessiné au même endroit.
- **Reproductions** (toutes sur le paquet Android, écran tactile 812×375) :
  - Expédition : gagner une étape, toucher deux fois « Continuer l'expédition ». Avant : un
    cadeau est pris sans choix (`boons: [solide]`, plus rien en attente). Après : les trois
    cadeaux attendent.
  - Voyage à finir : même défaut sur « Continuer le voyage » et ses bonus.
  - Aventure sans fin, cinq places prises : deux appuis sur un cadeau neuf remplaçaient « La
    longue-vue » sans choix ; deux appuis sur « Garder mes cadeaux » passaient toute l'offre.
- **Fichiers** : `src/ui/tapHold.ts` (la durée, 300 ms, a un nom et un seul lieu),
  `src/ui/voyage/voyagePage.ts`, `src/ui/voyage/voyageScreens.ts`,
  `src/ui/voyage/expedition/expeditionScreens.ts`, `src/ui/rewardControls.ts`.
- **Tests** : `scripts/hygiene/double-taps.mjs` (navigateur), `tests/reward-double-tap.test.ts`
  (lance `scripts/hygiene/reward-double-tap.ts`).

### 4. Un allié offert ne pouvait pas être posé sous « La tirelire »

- **Impact** : cadeau retardé, parfois perdu. Quand les pièces sont sous la somme mise à la
  banque, le jeu refusait aussi un allié gratuit. « La tirelire » revient quatre fois dans
  l'expédition.
- **Reproduction** : gardien du Marais, bourse de 150 pièces, un ninja offert dans le sac.
  Avant : `recruit('ninja')` refusé. Après : posé, aucune pièce dépensée ; un allié payant
  reste refusé.
- **Décision** : accord du parent le 21 novembre (un allié offert se pose toujours).
- **Fichier** : `src/game.ts` (`canRecruit`). Aucune partie de référence ne change.
- **Test** : `tests/expedition.test.ts`, qui échoue sans la correction.

## Défauts confirmés, décidés par le parent le 21 novembre, faits en lots séparés

### A. La sauvegarde familiale ne contenait ni l'expédition, ni les records, ni le voyage — corrigé

- **Impact** : perte de progression au changement de téléphone. Le fichier gardait l'aventure,
  la carrière, les missions et le carnet de caprices du joueur en cours, pas l'expédition en
  cours et son record, ni les records de l'aventure sans fin, ni le voyage à finir.
- **Décision** : les ajouter (parent, 21 novembre). Lot séparé, après l'étape d'hygiène.
- **Ce qui change** : un fichier « version 6 » porte en plus ces trois éléments, tels que
  l'appareil les garde. Un fichier sans eux reste écrit comme avant, à l'octet près, et les
  anciens fichiers restent lisibles. À la restauration, chaque élément est relu par ses propres
  règles : un fichier dont l'un est abîmé est refusé en entier, sans rien changer. Ce que le
  fichier ne porte pas reste tel quel sur l'appareil. Si l'appareil refuse une écriture, tout
  est remis comme avant. Après une restauration qui les ramène, la page se relit, comme au
  changement de joueur.
- **Fichiers** : `src/familyBackup.ts`, `src/familyExtras.ts`, `src/familyPersistence.ts`,
  `src/bootstrap.ts`, `src/ui/familyControls.ts`, quatre phrases dans `src/texts/`.
- **Relecture indépendante** (quatre angles) : aucune perte dans le chemin normal ; 1 980
  anciens fichiers lus comme avant, 5 556 exports sans extras identiques à l'octet, 35 fichiers
  hostiles refusés sans écriture. Elle a trouvé cinq défauts, corrigés : l'aperçu nomme
  maintenant chaque élément que le fichier remplace ; le record d'une expédition illisible
  part quand même ; la clé vivante refuse un fichier version 6 ; si l'appareil refuse aussi le
  retour arrière, le message le dit au lieu d'annoncer que rien n'a changé.
- **Tests** : `tests/family-extras.test.ts` ; `scripts/hygiene/family-backup.mjs` (export
  version 6, treize imports invalides, restauration identique sur un appareil vide).
- **Limites** : le fichier ne garde toujours que le joueur en cours (c'est annoncé dans la
  fenêtre). Une application plus ancienne refuse un fichier version 6.

### B. Un allié pouvait rester collé à un rocher sur les cartes de mission — corrigé pour les nouvelles parties

- **Impact** : gêne, peut coûter une bataille. Sur « Le carrefour des fougères » (un tiers
  des missions et des étapes d'expédition), 9 trajets d'allié sur 100 s'arrêtaient contre un
  rocher, jusqu'à 20 secondes. Les cartes de la grande aventure ne sont pas touchées.
- **Cause** : le chemin reliait deux cases voisines sans regarder le trait entre elles
  (`src/navigation.ts`). Le marcheur refusait d'entrer dans le rocher, redemandait le même
  chemin, et restait là.
- **Décision** : lot séparé, mesuré (parent, 21 novembre). La correction change des parties
  de référence : elle vient donc comme de nouvelles règles de chemin, pour les nouvelles
  parties seulement.
- **Ce qui change** :
  - « Secondes règles de chemin » : le trait entre deux cases doit être libre. Une mission
    les porte (`paths: 2`) ; une partie sans elles garde les premières.
  - Les nouveaux départs de mission et de défi les prennent. Leur code de départ commence par
    une nouvelle version (`VIFS-0-…` au lieu de `VIFS-4-…`) ; un ancien code rejoue l'ancienne
    partie, à l'identique.
  - La Grande Expédition passe en version 3 : la version 2, avec ces règles et rien d'autre
    (mêmes défis, même force). Une expédition commencée en version 2 se finit en version 2.
  - Un camp de mission sauvé avec ces règles a sa version de sauvegarde (16). Le voyage à
    finir et la grande aventure ne changent pas.
- **Reproduction** (`tests/path-rules.test.ts`) : mission sur la carte du carrefour, une massue
  posée juste au-dessus ou juste au-dessous du rocher de droite. Premières règles : immobile
  5 s et 20 s d'affilée. Secondes règles : moins d'une seconde (la pause ordinaire entre deux
  pas d'un combat).
- **Mesure** (laboratoire des caprices, 6 804 parties par règle : 6 missions et 36 défis,
  3 joueurs simulés, 54 départs chacun) :

  | Joueur simulé | Victoires avant | Victoires après | Cristal minimal avant → après |
  | ------------- | --------------: | --------------: | ----------------------------- |
  | Expert        |            90 % |            90 % | 77 % → 77 %                   |
  | Moyen         |            88 % |            88 % | 65 % → 65 %                   |
  | Petit         |            38 % |            38 % | 26 % → 26 %                   |

  1 072 parties sur 6 804 se jouent autrement (1 008 sur la carte du carrefour, 64 sur la carte
  des méandres, aucune sur la troisième) : 42 perdues deviennent gagnées, 21 gagnées deviennent
  perdues. Sur la carte du carrefour : expert 90 → 92 %, moyen 88 → 89 %, petit 40 → 41 %. Par
  défi et par joueur, l'écart le plus grand est de 3 parties sur 54, dans les deux sens : du
  bruit. **La difficulté ne change pas ; l'allié ne reste plus collé.**

- **Mesure de l'expédition** (20 expéditions entières par joueur simulé, chemins alternés) :

  | Joueur simulé         | Version 2 (premières règles) | Version 3 (secondes règles) |
  | --------------------- | ---------------------------: | --------------------------: |
  | Expert arrivé         |                         50 % |                        55 % |
  | Moyen arrivé          |                         15 % |                        20 % |
  | Apprenti au tableau 3 |                         40 % |                        35 % |

  Une expédition sur vingt vaut 5 points : ces écarts sont du bruit, dans les deux sens.

- **Fichiers** : `src/navigation.ts`, `src/routes.ts`, `src/engine/movement.ts`, `src/game.ts`,
  `src/missions.ts`, `src/departures.ts`, `src/checkpoints.ts`, `src/missionProgress.ts`,
  `src/expedition.ts`, `src/ui/expeditions.ts`, `src/ui/missionDraft.ts`.
- **Tests** : `tests/path-rules.test.ts` ; `tests/expedition.test.ts` (version 3) ; douze
  nouvelles parties de référence dans `tests/fixtures/engine-traces.ts`, les anciennes
  inchangées (missions, défis, voyage, rendu).
- **Accord du parent** sur cette mesure le 21 novembre ; publié le même jour.

### C. Non corrigé, cas théorique

Si l'appareil refuse la lecture mais accepte l'écriture, les records et l'expédition sont
remplacés. Aucun navigateur connu ne se comporte ainsi ; le fichier familial et le camp sont
protégés dans ce cas.

## Ce qui est sain

| Contrôle                       | Preuve                                                                                                                                                                                                                                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mise à jour depuis le build 63 | Navigateur : mission gagnée, aventure et voyage en cours, deuxième joueur, tout se relit et continue. Modèle : 26 scénarios, 232 contrôles, 26 400 sauvegardes abîmées, 0 écart                                                                                                                      |
| Isolation des profils          | 28 contrôles : chaque joueur n'écrit que ses clés ; supprimer un joueur efface ses clés et rien d'autre                                                                                                                                                                                              |
| Fermeture forcée               | 4 cas en navigateur ; 458 redémarrages simulés, 0 recul. Rien n'attend un clic « Continuer »                                                                                                                                                                                                         |
| Import invalide                | 11 fichiers en navigateur, 33 au modèle : refusés, l'appareil ne change pas d'un octet                                                                                                                                                                                                               |
| Anciens codes Voyage           | 800 plans sur 800 identiques à ceux du build 63 (versions 1 et 2)                                                                                                                                                                                                                                    |
| Fin de partie, blocages        | 1 560 parties simulées (grande aventure, sans fin, missions, 36 défis, voyage, expédition) : aucun blocage, aucune exception, aucun nombre invalide                                                                                                                                                  |
| Retour d'arrière-plan          | 10 minutes d'absence en une image : +0,1 s de jeu. La pause n'est rendue qu'à la dernière fenêtre fermée                                                                                                                                                                                             |
| Placement et achats            | 86 contrôles et 20 000 points au hasard : refus propre partout                                                                                                                                                                                                                                       |
| Même graine, même partie       | 20 parties rejouées deux fois, deux processus : identiques. « Le refuge » en navigateur : passages identiques                                                                                                                                                                                        |
| Première partie, profil neuf   | 780×360 : le grand bouton suffit pour gagner, aucune cible de moins de 48 px, pas de défilement de côté                                                                                                                                                                                              |
| Recettes existantes            | `npm run verify` (914 tests à la fin des trois lots), expédition, aventure sans fin, navigateur, hors-ligne, paquet Android, menus (5 764 contrôles), interruptions, langue FR/EN, audit d'interface (0 écart), petit écran enfant (6 tailles), parcours des missions (16 cas), sauvegarde familiale |

À savoir : les anciens codes Voyage ne peuvent plus être tapés (décision du 21 novembre :
l'expédition remplace le voyage). Leurs plans restent lisibles par le code.

## Mesures

Même machine, même paquet Android, même scénario (vague 11, 48 alliés, 40 secondes), quatre
passages alternés avant (`c19c43a`) et après les corrections.

| Mesure                       | Avant                  | Après                  |
| ---------------------------- | ---------------------- | ---------------------- |
| Accueil utilisable (ms)      | 537, 529, 606, 643     | 588, 567, 536, 608     |
| Plateau utilisable (ms)      | 2052, 1986, 1234, 1942 | 2262, 2040, 1165, 1232 |
| Images par seconde, médiane  | 29,0 29,1 27,9 28,0    | 29,9 28,9 28,5 27,8    |
| Images par seconde, minimum  | 19,9 15,4 17,8 17,3    | 18,8 15,7 17,8 20,1    |
| Image la plus longue (ms)    | 86, 121, 101, 74       | 69, 103, 78, 79        |
| Calcul du jeu, 95e cent (ms) | 5,3 5,0 5,0 5,1        | 5,6 5,0 5,5 5,6        |

**Gain non démontré**, et aucune régression : les écarts se confondent avec la variabilité
des essais. Rien n'a été optimisé. Ces nombres viennent d'un navigateur sans écran ni carte
graphique : ils comparent deux versions, ils ne disent pas la fluidité d'un téléphone. Le
calcul du jeu (5 ms) laisse de la marge ; c'est le dessin qui limite ici.

Mémoire, huit parties du « refuge » dans la même page, tas JavaScript après ramasse-miettes :

| Partie              | 1      | 2      | 3      | 4      | 5      | 6      | 7      | 8      |
| ------------------- | ------ | ------ | ------ | ------ | ------ | ------ | ------ | ------ |
| Tas (Ko)            | 10 821 | 12 220 | 11 006 | 11 069 | 11 363 | 11 289 | 11 331 | 11 455 |
| Écouteurs           | 369    | 369    | 369    | 369    | 369    | 369    | 369    | 369    |
| Éléments de la page | 1 421  | 1 421  | 1 421  | 1 421  | 1 421  | 1 421  | 1 421  | 1 421  |

Pas de fuite visible : le tas ne monte pas de partie en partie, les écouteurs et les éléments
de la page ne bougent pas. Le navigateur compte 4 nœuds détachés de plus par partie (4 090 à
4 118) : négligeable, non cherché plus loin.

## Publication

Les trois lots (étape d'hygiène, sauvegarde familiale version 6, secondes règles de chemin)
sont dans `main` (PR 107, 108, 109) et sur le site depuis le 21 novembre : publication n° 39,
contrôle du site en ligne vert. L'application Android n'en a rien : build 64 à faire.

## Contrôles bloqués

| Contrôle                                            | Cause                                                                                    |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Installer le build suivant par-dessus le build 63   | Pas d'outils Android ni de téléphone dans cet environnement ; joué au niveau du stockage |
| Navigation par gestes et à trois boutons            | Demande un téléphone                                                                     |
| Fluidité et mémoire réelles                         | Demande un téléphone représentatif ; mesuré ici sans carte graphique                     |
| Délai d'écriture sur disque du stockage par Android | Hors du code du jeu : un jeu tué dans la seconde qui suit une écriture peut la perdre    |
| Les enfants                                         | Aucune séance                                                                            |

## Recette à faire sur le téléphone avec le build 64

- [ ] Installer par-dessus le build 63 : étoiles, aventure en cours, voyage en cours, joueurs.
- [ ] Gagner une mission, tuer l'application (bouton carré, balayer), rouvrir : les étoiles
      sont là, l'accueil dit « Jouer ».
- [ ] Acheter un allié, tuer l'application avant de lancer la vague, rouvrir : l'allié et les
      pièces vont ensemble.
- [ ] Toucher deux fois vite « Continuer l'expédition » : les trois cadeaux attendent.
- [ ] Retour par geste et par le bouton « retour » depuis chaque écran.
- [ ] Une vague dense à ×2 : le jeu reste fluide (`?perf=1` donne le relevé).
