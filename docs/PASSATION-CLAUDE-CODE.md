# Passation à Claude Code — La Conquête des Serpents

État au 10 novembre 2026, version 0.36.2. Écrit par Claude (session d'audit dans l'app Claude)
pour l'agent qui reprend le code. Tout ce qui est marqué « vérifié » a été rejoué ce jour-là sur
le code de `main` (commit `336410e`) ; le reste vient des bilans de Codex ou des décisions du parent.

Ordre de lecture conseillé : ce document, puis `CLAUDE.md`, `AGENTS.md`, `GAME_DESIGN.md`, le haut
de `docs/PLAN-ACTUEL.md`, et `docs/CAPRICES.md`. L'audit complet (benchmark, finance, conformité,
sources) est copié dans `docs/passation/AUDIT-2026-11.md` ; sa version vivante est
[ici](https://claude.ai/artifact/MZV247wikz227ThaqxuNNg).

## 1. Le projet en une page

- **Le jeu.** Un tower defense pour enfants, inventé sur papier par le fils de Yannick. Des
  serpents sortent de trois antres à gauche et attaquent un refuge à droite par trois voies
  reliées entre elles. Le joueur recrute des alliés qui se battent seuls. Titre français « La
  Conquête des Serpents », titre anglais « Snake Attack TD ».
- **Les personnes.** Yannick : parent, développeur, vit en Suisse, travaille sous Windows, parle
  français. Son fils : l'inventeur, il a le dernier mot sur les règles, les noms et les idées.
  Deux enfants jouent : environ 6–7 ans et 8–10 ans.
- **L'objectif.** D'abord un jeu pour les deux enfants, puis une publication pour les 6–10 ans en
  Europe et en Suisse (français, allemand, italien, anglais) sur Android (Google Play) et dans un
  navigateur d'ordinateur. Yannick veut « publier et monétiser », avec « maximum et qualité ».
- **Les moyens.** 5 à 10 heures par semaine, moins de 100 CHF de budget. Pas de traduction
  professionnelle, pas de serveur, pas d'API payante.
- **Jusqu'ici.** Codex (OpenAI) a écrit presque tout le code. Claude a audité, testé, fait la
  recherche de marché, conçu et codé le moteur des caprices (branche `claude/caprices`, fusionnée
  via la PR nº 3). Yannick passait les prompts de l'un à l'autre.
- **Maintenant.** Claude Code reprend le développement. Codex garde, tant que rien n'est déplacé,
  la publication du site public, hébergé par son outil.

## 2. État au 10 novembre 2026

| Sujet              | État                                                                                                                          | Source                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Version            | 0.36.2, Android versionCode 48                                                                                                | `package.json`, `android/app`            |
| `main`             | commit `abef9ee` ; PR nº 1 à 5 fusionnées (la nº 5 n'ajoute que des documents au code `336410e`)                              | GitHub `zyclope0/snakeattak`             |
| Build et tests     | 548 tests unitaires sur 548, build vert                                                                                       | vérifié                                  |
| Audit d'interface  | 13 contrôles sur 13                                                                                                           | vérifié (`npm run test:audit`)           |
| Parcours téléphone | 29 écrans en 780×360 tactile, aucune erreur JavaScript, reprise après rechargement                                            | vérifié en navigateur, pas sur le S24    |
| Site public        | <https://conquete-serpents-famille.zyclope.chatgpt.site/>, annoncé en 0.36.2                                                  | reçu de Codex, non vérifié par Claude    |
| APK                | debug 0.36.2, signé en debug, identifiant provisoire `com.conqueteserpents.famille`                                           | bilan de Codex                           |
| Langues du jeu     | français et anglais ; allemand et italien absents                                                                             | vérifié                                  |
| Essais réels       | un essai du parent sur Galaxy S24 Ultra en 0.30.0 (« les enfants apprécient ») ; aucune séance enfant consignée depuis        | `docs/ANDROID.md`                        |
| Monétisation       | dossier écrit, rien dans le code : ni pub, ni achat, ni permission Internet                                                   | `docs/publication/`                      |
| Compte Google Play | compte personnel créé, validation d'identité en attente au 8 novembre                                                         | `docs/publication/PLAY-CONSOLE.md`       |
| Taille du dépôt    | 671 Mo suivis, 6 681 fichiers ; `reports/` 442 Mo et `docs/` 197 Mo, surtout des captures                                     | vérifié ; plan dans `HYGIENE-DEPOT`      |
| Suite demandée     | pause sur les fonctionnalités ; audit des menus et de la direction artistique fait par Codex, contre-analyse et choix à faire | `docs/AUDIT-VISUEL-MOBILE-2026-11-10.md` |

Le téléphone de la famille est un Galaxy S24 Ultra. Les contrôles de Claude et de Codex utilisent
780×360 et 812×375 : mesure `window.innerWidth` et `innerHeight` sur le vrai appareil avant de
conclure sur une mise en page.

## 3. Décisions prises, à ne pas rouvrir sans Yannick

| Date       | Décision                                                                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| avant nov. | Les six règles du fils (voir `CLAUDE.md`). Pas de licornes.                                                                                                            |
| 7 nov.     | Cibles : enfants de 6–7 et 8–10 ans ; Android et navigateur ; Europe en quatre langues ; budget inférieur à 100 CHF.                                                   |
| 8 nov.     | Monétisation : jeu gratuit, pubs rares et non personnalisées, un achat unique qui supprime la pub, cosmétiques. Ni hasard payant, ni monnaie virtuelle.                |
| 8 nov.     | Première version sans serveur : achat validé dans l'app. Aucune pub tant que Yannick ne l'a pas vue sur son téléphone.                                                 |
| 8 nov.     | Direction artistique pâte à modeler / papier mâché ; l'icône `docs/resources-2026-11/assets/icone-source.png` fait foi.                                                |
| 8 nov.     | Tutoiement partout, écrit directement dans les textes sources.                                                                                                         |
| 9 nov.     | Titre anglais « Snake Attack TD » ; ton décalé inspiré de Mars Attacks, sans reprendre ni le nom ni les visuels du film.                                               |
| 9 nov.     | Caprices : trois par mission, ouverts à 1, 2 et 3 étoiles ; 13 gardés, 4 renommés par le fils, « Serpents malins » refusé et remplacé par « Bourse trouée ».           |
| 9 nov.     | Le défi du créateur, inventé par le fils : La tirelire, Les carapaces, La grande charge. Le nom de rangée évite son prénom.                                            |
| 9 nov.     | Carnets d'autocollants séparés par enfant, campagne et étoiles partagées par la famille. Pas de classement.                                                            |
| 10 nov.    | Équilibrage : cinq réglages de caprices, tyrannosaure 340, bébé dragon 210, tank 440, rappel « Tu as des pièces, recrute ! ». Nouveaux départs seulement (révision 2). |
| 10 nov.    | Pause sur les nouvelles fonctionnalités ; priorité à l'étude des menus, de l'ergonomie et de la cohérence graphique.                                                   |

## 4. Le jeu tel qu'il est

### Modes

| Mode                  | Contenu                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| Les missions          | 6 missions, 19 vagues en tout ; terrain, type d'attaque et couvée d'œufs tirés avec une graine |
| Caprices des serpents | 3 par mission (18), variantes de règles ouvertes par les étoiles                               |
| Le défi du créateur   | 3 par mission (18) : tirelire, carapaces, grande charge                                        |
| La grande aventure    | 12 vagues, roi à trois têtes à la fin, cartes de récompense entre les chapitres                |

| Mission                      | Bourse | Vagues | Alliés qui s'ajoutent                                                                             |
| ---------------------------- | -----: | -----: | ------------------------------------------------------------------------------------------------- |
| 1. Le refuge                 |    450 |      3 | massue, ninja, médecin, archer, vélociraptor, mutant roc, bouclier, batteur, infirmier, palissade |
| 2. Les trois ponts           |    550 |      3 | bébé dragon, mutant élastique, chevalier                                                          |
| 3. La course des vifs        |    700 |      3 | tricératops, cavalier                                                                             |
| 4. Les premières coquilles   |    850 |      3 | petit dinosaure, stégosaure                                                                       |
| 5. Dragon et sonnette        |  1 050 |      3 | chevalier à deux têtes                                                                            |
| 6. Le carrefour des fougères |  1 300 |      4 | tyrannosaure (le tank arrive à la vague 9 de la grande aventure)                                  |

La mission 1 sert de tutoriel : attaques au centre, puis sur deux voies, puis sur trois. Sur
téléphone, un dock montre 4 alliés favoris et 2 miels (attirer, ralentir) ; « Tous les alliés »
ouvre le catalogue.

### Ce qu'il faut savoir du code

- **Pile.** Phaser 3 pour le plateau, TypeScript, Vite, interface en HTML et CSS, Capacitor 8.6
  pour Android (minSdk 24, targetSdk 36, paysage verrouillé).
- **Séparation.** Les règles sont en TypeScript pur dans `src/*.ts` (`game.ts`, `missions.ts`,
  `caprices.ts`, `data.ts`, `waves.ts`, `ai.ts`…), sans navigateur ni réseau. Le rendu est dans
  `src/render`, l'interface dans `src/ui`, les textes dans `src/i18n` (le français sert de clé,
  un dictionnaire donne l'anglais).
- **Hasard.** Graine tirée par Web Crypto, aucun `Math.random`. Même code de départ, même partie :
  des tests comparent des empreintes de parties entières. Toute modification du moteur qui change
  une partie historique les fait échouer, et c'est voulu.
- **Sauvegardes locales.** Camp, progression, famille, carnets, dans le stockage du navigateur.
  Formats actuels : code de départ 4, camp 9, progression 2, enveloppe familiale 5, carnets 1.
  Les anciens formats se relisent ; export et import par fichier.
- **Révisions d'équilibrage.** `src/balanceRevision.ts` : la révision 1 est historique, la 2 est
  la courante. Un ancien code ou un ancien camp rejoue avec ses règles et ses prix d'origine.
- **Caprices.** `src/caprices.ts` : catalogue figé et leviers (bourse, réserve en banque, cadence,
  vitesse, PV, morsures, nombre, œufs, miel, sortes d'alliés, roi, carapaces). `docs/CAPRICES.md`
  donne les valeurs et leur mesure.
- **Tests.** 548 tests unitaires (`node --test`), une trentaine de recettes navigateur avec
  Playwright (`scripts/*-browser.mjs`), une CI GitHub (`.github/workflows/check.yml`).
- **Simulation.** `npm run balance:caprices` (les 36 défis, trois joueurs automatiques) et
  `npm run balance:modes` (tous les modes, cinq styles de joueur, variables `REVISION`, `SETS`,
  `CLASSIC`, `PROFILES`). Environ 10 parties de mission par seconde et par cœur.

### Pièges déjà rencontrés

- Sous Node, les tests et les laboratoires chargent le TypeScript avec
  `--experimental-strip-types` : pas d'énumérations ni de syntaxe qui demande une compilation.
- Les scripts navigateur importent `playwright-core` ou `@playwright/test` : installe Chromium
  une fois (`npx playwright install chromium`).
- `npm run build` contrôle des budgets de taille (`scripts/check-dist.mjs`) ; `npm run verify`
  échoue aussi sur un fichier mal formaté (`npm run format`).
- La politique de sécurité de la page interdit les scripts injectés : pour un contrôle
  d'accessibilité avec axe, ouvre le contexte Playwright avec `bypassCSP`.
- Dans un onglet caché, le jeu tombe à 0–2 images par seconde : un test en temps réel doit avoir
  sa fenêtre visible, ou tourner sans affichage.
- Un champ ajouté à l'état du jeu peut casser les empreintes historiques : garde les ajouts
  privés ou hors des instantanés.

## 5. L'audit en bref

| Version | Date    | Ce que l'audit a trouvé                                                                                                             | Suite                                                       |
| ------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 0.26    | 7 nov.  | Code sain, mais 310 mots à lire avant la première vague, plateau décalé sur ordinateur, boutons de 36 px, jamais essayé sur Android | 13 recommandations, 9 lots                                  |
| 0.32.1  | 8 nov.  | Affichage corrigé ; 21 mots sur téléphone ; tutoriel progressif ; reste le catalogue sur ordinateur, le vouvoiement caché, l'icône  | corrigé en 0.34                                             |
| 0.34    | 9 nov.  | Corrections tenues ; des « conseils de personas » simulés à la place d'essais réels ; dépôt de 580 Mo                               | mention « simulé » ajoutée ; hygiène non faite              |
| 0.35    | 9 nov.  | Anglais propre ; campagne trop facile ; repli de langue, bouton Dangers, « portée 45 »                                              | corrigé en 0.36.1                                           |
| 0.36.0  | 10 nov. | Caprices jouables de bout en bout ; 12 défauts d'interface sur téléphone ; la massue écrase les autres alliés                       | interface corrigée en 0.36.1, équilibrage partiel en 0.36.2 |
| 0.36.2  | 10 nov. | Les 12 défauts sont corrigés, revus un par un                                                                                       | ce document                                                 |

Ce que l'audit recommandait et qui n'est toujours pas fait :

- **Essai avec les enfants.** Trois séances de 15 minutes sur le téléphone, sans aide, avec une
  fiche d'observation : comprend seul (écran par écran), moments de blocage, ce qui fait rire,
  envie de rejouer, disputes à deux. C'est le point le plus important de tout le projet.
- **Mesure de fluidité sur le vrai téléphone** (mission 6 et vague 12 de la grande aventure).
- **Allemand et italien.** Les textes sont sortis du code depuis la 0.35 ; il manque les deux
  dictionnaires et une relecture par une personne qui parle chaque langue.
- **Mode Facile et appel anticipé de la vague** (inspirés de Bloons TD 6 et Kingdom Rush) : ils
  changent des règles, donc à proposer au fils d'abord.
- **Nouveaux lieux.** Deux fonds générés attendent dans `docs/resources-2026-11/assets`
  (`terrain-crue.png` prêt, `terrain-marais.png` à montrer au parent). Prévu après la sortie.
- **Hygiène du dépôt.** Plan chiffré de Codex dans `docs/archive/HYGIENE-DEPOT-0361.md` : environ 480 Mo
  de captures et de gros JSON à sortir de Git. Décision de Yannick requise, surtout pour
  l'historique.

## 6. Équilibrage : ce que les simulations ont appris

Les 9 et 10 novembre, Claude a fait jouer plus de 50 000 parties à des joueurs automatiques sur
le vrai moteur. Résumés dans `docs/passation/simulations/`. Les joueurs : « expert » (place sur
la voie la plus faible, soigneur, miel), « moyen » (dépense tout, place à tour de rôle massue,
bouclier, archer), « petit » (deux achats par vague), « massues » (massues seules, voie la plus
faible), « gros » (le plus gros allié disponible d'abord, à tour de rôle).

Mesure sur la 0.36.2, révision 2, 2 992 parties (54 par mission et par joueur, 100 pour la grande
aventure) :

| Mode                            |                    Moyen | Petit |    Massues |                      Gros |
| ------------------------------- | -----------------------: | ----: | ---------: | ------------------------: |
| Missions 1 à 3, normales        |                    100 % | 100 % |      100 % |                     100 % |
| Mission 4, normale              |                    100 % |  72 % |      100 % |                     100 % |
| Mission 5, normale              |                     96 % |  26 % |      100 % |                     100 % |
| Mission 6, normale              |                    100 % |   0 % |      100 % |                      44 % |
| Grands caprices, missions 1 à 6 | 83, 74, 69, 50, 50, 59 % |   0 % | 96 à 100 % | 85, 100, 24, 17, 67, 17 % |
| Grande aventure                 |                      0 % |   0 % | non mesuré |                      45 % |

Dans la grande aventure, l'expert gagne 58 % des parties.

Ce qu'il faut en retenir :

1. **Les grands caprices sont maintenant bien placés** pour le joueur moyen : entre 50 et 83 %.
2. **La massue à 55 pièces reste l'achat qui gagne tout.** Pour une pièce, elle frappe plus de
   trois fois plus que le tyrannosaure, même à 340. Un enfant qui achète les alliés qui font rêver est
   puni dès la mission 6. La baisse de trois prix a aidé (grande aventure : 36 % puis 45 % pour le
   style « gros ») sans régler le fond. Pistes mesurées sur la 0.36.0 : tous les alliés de 200
   pièces et plus à −30 % améliorent ce style, et le joueur moyen, qui n'en achète pas, n'est
   pas concerné ; monter la
   massue à 75 pièces fait perdre tout le monde.
3. **La grande aventure est hors de portée d'un joueur moyen** : 0 victoire sur 100, défaites
   entre les vagues 8 et 11. Elle n'a pas été retouchée. À essayer avec l'aîné avant tout réglage.
4. **Le joueur qui dépense peu se bloque à la mission 5.** Le rappel « Tu as des pièces, recrute ! »
   de la 0.36.2 vise ce cas ; son effet réel ne se mesure qu'avec un enfant.
5. **Les missions 1 à 3 n'opposent aucune résistance.** La mission 1 se gagne sans placer un seul
   allié. Acceptable pour un tutoriel ; les caprices donnent l'étage de difficulté.
6. **Trois petits caprices sont de pure ambiance** (Serpents pressés, Bourse trouée, Plus de
   miel !) : ils ne font perdre personne. Gardés ainsi pour le plus jeune.

Limite : ce sont des robots. Ils rangent les difficultés entre elles, ils ne disent pas ce qu'un
enfant ressent. Toute nouvelle valeur se mesure, se propose à Yannick et à son fils, puis
s'ajoute comme révision 3.

## 7. Rejouabilité et marché

Le rapport de recherche du 9 novembre (non versé au dépôt, résumé dans l'audit) recommandait deux
choses.

- **Les caprices des serpents**, sur le modèle des défis de Kingdom Rush : fait.
- **Un mode duo sur une seule tablette.** L'aîné joue normalement ; le cadet pilote un petit
  assistant (nom provisoire « Picoti », le fils choisira) qui chatouille un œuf, lâche des
  miettes qui ralentissent, encourage les alliés, et ne peut jamais faire perdre. Pas commencé.
  Première étape sans code : faire jouer la version actuelle à deux et regarder les doigts qui
  se gênent.

À éviter, parce que cela relève l'âge PEGI ou enfreint la politique Familles de Google : objets
aléatoires payants (PEGI 16), offres limitées dans le temps et pénalités d'absence (PEGI 12),
récompenses de retour quotidien (PEGI 7 avec mention), publicité personnalisée, classement entre
enfants. Attente financière réaliste pour un premier jeu en solo : rembourser les frais.

## 8. Publication : ce qui manque

Rien de tout cela n'est commencé dans le code. Détail dans `docs/publication/` et dans la section
« Risques et conformité » de l'audit.

1. Validation du compte Google Play (25 $, pièce d'identité) : Yannick.
2. Identifiant d'application définitif : il ne peut plus changer après la première publication.
3. Test fermé obligatoire : 12 testeurs pendant 14 jours avant toute publication. C'est le vrai
   verrou du calendrier ; en recruter 15.
4. AAB signé, Play App Signing, clés protégées hors dépôt.
5. Public déclaré 6–8 et 9–12 ans : politique Familles, questionnaire d'âge, formulaire
   « Sécurité des données », politique de confidentialité. À réécrire le jour où la pub arrive,
   car l'app n'a aujourd'hui aucune permission Internet et ne collecte rien.
6. Publicité : uniquement un SDK certifié Familles, réglé « enfant » avant toute requête, jamais
   pendant une vague, au plus une toutes les dix minutes.
7. Achats : Google Play Billing, non consommables, confirmés dans l'app, restaurés au démarrage.
8. Fiches du store en quatre langues (brouillons dans `docs/publication/fiches.json`), captures,
   bannière.
9. Allemand et italien dans le jeu.

Questions ouvertes pour Yannick, pas pour l'agent : statut de « commerçant » au sens du DSA
(adresse publique), déclaration des revenus en Suisse.

## 9. Travail à faire, par ordre proposé

| Lot | Contenu                                                                                                                                                                                | Qui décide                    |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| A   | **Demande en cours.** Menus, ergonomie Android et cohérence pâte à modeler : l'audit de Codex existe, il faut le contre-vérifier, faire choisir Yannick, puis réaliser par petits lots | Yannick choisit l'approche    |
| B   | Protocole et fiche d'essai avec les enfants, relevé de fluidité sur le téléphone ; corriger ce que l'essai révèle                                                                      | Yannick et les enfants        |
| C   | Hygiène du dépôt : sortir captures et gros rapports de Git selon le plan de Codex                                                                                                      | Yannick (historique Git)      |
| D   | Équilibrage, révision 3 : rapport prix/force des gros alliés, difficulté de la grande aventure                                                                                         | Yannick et son fils           |
| E   | Allemand et italien, avec relecteurs                                                                                                                                                   | Yannick trouve les relecteurs |
| F   | Mode duo : essai sans code, puis prototype                                                                                                                                             | le fils (nom, pouvoirs)       |
| G   | Publication : identifiant, AAB, test fermé, pub, achat, fiches                                                                                                                         | Yannick                       |

Pour le lot A, Codex a livré le 10 novembre un audit sans modification du jeu,
`docs/AUDIT-VISUEL-MOBILE-2026-11-10.md` : 12 jeux grand public et 5 tower defense comparés sur
captures (aucun n'a été installé ni joué), mesures de nos écrans, et deux approches. Il recommande
l'approche A : accueil compact avec une action principale, écrans courts, carnet ouvert sur la
collection (aujourd'hui 2 581 px de contenu pour 344 px visibles en 780×360), gestion des noms au
second plan, puis un langage de matières commun. L'approche B est centrée sur le plateau. Il a
aussi écrit `docs/archive/POUR-CLAUDE-AUDIT-VISUEL-2026-11-10.md`, qui demande une contre-analyse : elle
n'est pas faite. Commence par elle (mesures refaites, références vérifiées, angles morts), puis
propose à Yannick un ordre de petits lots.

Des maquettes éditables de l'accueil, de la préparation et du plateau existent
[ici](https://claude.ai/artifact/NeJ71Fck3ZpVEMc2y9kAWD), et des images de référence dans
`docs/resources-2026-11/`. Les enseignements du benchmark (Plants vs. Zombies, Kingdom Rush,
Bloons TD 6, Toca Boca) sont dans l'audit : une voie au début, huit mots à l'écran au plus,
montrer ce qui arrive à l'entrée de chaque chemin, pas de texte quand une icône suffit.

## 10. Méthode de travail

- **Un seul agent code à la fois.** Si Codex doit encore intervenir (publication du site), il le
  fait sur `main` à jour, pas en parallèle sur les mêmes fichiers.
- **Yannick n'est plus le messager** : pose-lui tes questions directement, une à la fois, avec
  des choix clairs. Il répond vite quand la question est courte.
- **Le fils décide du jeu.** Quand une idée touche une règle, un nom ou un pouvoir, prépare la
  question pour lui en mots d'enfant, avec deux ou trois choix.
- **Mesure avant de proposer.** Une valeur d'équilibrage arrive avec ses parties simulées ; un
  changement d'interface avec ses captures avant et après en 780×360 et 1280×800.
- **Vérification séparée.** Celui qui code ne se note pas lui-même : fais relire chaque lot par
  une session ou un agent qui n'a pas écrit le code, ou demande à Yannick un contrôle dans l'app
  Claude. Codex écrivait le code, les tests, les avis de ses « personas » et le bilan ; c'est ce
  qui a laissé passer des défauts visibles au premier coup d'œil.
- **Comptes rendus courts.** Les bilans de Codex sont exacts mais très longs et le dépôt a grossi
  de 90 Mo en deux jours. Un bilan tient en une page : fait, vérifié comment, pas fait.
- **Ce que Codex faisait bien et qu'il faut garder** : aucune règle changée sans accord, anciens
  codes et sauvegardes toujours relisibles, tests avant livraison, honnêteté sur ce qui n'a pas
  été essayé sur un vrai téléphone.

## 11. Premières questions à poser à Yannick

1. Quels défauts a-t-il vus lui-même sur son Samsung en 0.36 ? Il en a parlé sans les lister.
2. Les outils Android (JDK, SDK, `adb`) sont-ils installés sur son PC, pour construire l'APK et
   l'envoyer sur le téléphone par câble ?
3. Le site reste-t-il hébergé par l'outil de Codex, ou le déplace-t-on (GitHub Pages est prévu
   par `AGENTS.md`) ?
4. Pour le lot A : veut-il d'abord des propositions à choisir, ou une direction déjà en tête ?
5. Quand peut-il faire une séance d'essai avec les deux enfants ?

## 12. Références

- Audit vivant : <https://claude.ai/artifact/MZV247wikz227ThaqxuNNg> (copie :
  `docs/passation/AUDIT-2026-11.md`)
- Caprices, liste validée par le fils : <https://claude.ai/artifact/BcvDr6KNm4sj8yGoV6r3oF>
- Maquettes : <https://claude.ai/artifact/NeJ71Fck3ZpVEMc2y9kAWD>
- Dans le dépôt : `GAME_DESIGN.md`, `docs/CAPRICES.md`, `docs/PLAN-ACTUEL.md`,
  `docs/archive/BILAN-0.36.1.md`, `docs/archive/BILAN-0.36.2.md`, `docs/archive/HYGIENE-DEPOT-0361.md`,
  `docs/publication/`, `docs/ARCHITECTURE.md`, `docs/ANDROID.md`
