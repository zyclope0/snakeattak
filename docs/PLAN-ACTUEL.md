# Plan actuel — 24 novembre 2026

Une page. Ce qui s'est passé du 15 au 20 novembre (revues du site, décisions du parent du
18 novembre, révisions 3 à 6, soutien, AdSense) est dans
[archive/PLAN-ACTUEL-2026-11-15-au-20.md](archive/PLAN-ACTUEL-2026-11-15-au-20.md) ; avant le
15 novembre : [archive/PLAN-ACTUEL-avant-2026-11-15.md](archive/PLAN-ACTUEL-avant-2026-11-15.md).

## 23 novembre

- **Nuit du 22 au 23** : quatre lots de sauvegarde fusionnés, chacun attaqué par des relecteurs
  indépendants avant fusion (3 à 6 attaques par lot) : sauvetage du fichier familial
  (PR 133), copies de secours (PR 134), « Ta partie n'est pas gardée » (PR 135), export
  Android par le partage d'Android (PR 136). Rien de publié.
- **Matin** : le parent a pris dix décisions une par une ([DECISIONS-2026-11-23.md](DECISIONS-2026-11-23.md)).
- **Lot « build 65 »** : version 0.41.0 / build 65, politique de confidentialité (décisions 1,
  2, 8), phrases des décisions 6 et 10, page publique des parents (7)
  ([bilan](BILAN-0.41.0.md), [passation](ANDROID-BUILD-65.md)).
- **Site publié** (publication n° 44, avec le mot du parent). **APK de test** envoyé au
  parent : il s'installe à côté de l'application de Play (« Serpents (test) »).
- **Lot « barrière de l'export »** (décision 3) : une multiplication pour adulte avant le
  partage d'Android, application seulement. Mots à lire : [décisions](DECISIONS-2026-11-23.md).
- **Essai du parent sur l'APK de test avec la question** (le deuxième APK de test) : question,
  partage, Drive et réimport marchent ; la phrase du résultat ne se voyait pas (sous le bord
  de l'écran). Décision 11 : Drive suffit.
- **APK de test v2** (commit `d1ee09f`) envoyé : la phrase du résultat se voit, le secours au
  démarrage partage même sans les règles. **Il n'a pas** la correction de l'aperçu d'un
  fichier choisi (« Remplacer » sous le bord), venue après : elle sera dans l'APK v3, construit
  après la fusion.
- **Soir** : APK v4 essayé par le parent, phrases visibles ; PR 140 fusionnée, site publié
  (n° 45). **Gros lot** (revue complète, découpage, doublons, optimisation, étape 3) : neuf
  agents en parallèle, [bilan](BILAN-GROS-LOT-2026-11-23.md). Mots nouveaux à lire : la page
  « WebView trop ancien ».
- **24 novembre** : site publié (n° 46) avec le gros lot ; relevé du parent sur le S24 :
  120 images par seconde, pas de chauffe, écran resté allumé. Limite à 60 images par seconde
  (décision du parent), à confirmer par un relevé.
- **Place dans le paquet du jeu** : trois fenêtres chargées à part, 195 901 octets sur 200 000
  (la sauvegarde familiale reste dedans) ; APK v6 avec compteur à faire pour vérifier les
  60 images par seconde.
- **24 novembre, suite** : relevé à 60 images par seconde confirmé, images ré-encodées
  (7 Mo de moins), site publié (n° 49). Décisions du jour :
  [DECISIONS-2026-11-24.md](DECISIONS-2026-11-24.md).
- **Petits restes** ([bilan](BILAN-PETITS-RESTES-2026-11-24.md)) : « Recharge la page quand la connexion revient. » sur
  les cinq boutons dont le fichier peut manquer ; bouton « retour » d'Android
  (`@capacitor/app`). **À essayer par le parent sur l'APK de test.**
- **Nouvel accueil** ([bilan](BILAN-ACCUEIL-2026-11-24.md)) : maquette D « la clairière »
  retenue par le parent après un conseil de trois relecteurs ; décor calmé en dose légère ;
  pièces modelées avec Magnific (537 crédits sur 1 500), gardées par le parent. Le vrai écran
  est écrit, mesuré sur 36 cas dans Chromium, ses recettes mises à jour. **À essayer par le
  parent sur l'APK de test, puis avec les enfants.**
- **24 novembre, soir** : petits restes et nouvel accueil fusionnés (PR 145 et 146), **site
  publié (n° 50, commit `1ca427a`)**, APK de test v9 envoyé au parent (nouvel accueil et
  bouton « retour »). La recette du bouton « retour » a sa propre tâche de CI (neuf lignes).
- **Prochaine étape, demandée par le parent avant toute fonctionnalité : les autres menus à
  l'allure du premier écran**, sans refonte. Premier lot : l'habillage commun et « Aventure
  classique » ([bilan](BILAN-MENUS-2026-11-24.md)), fusionné (PR 147) et **publié (n° 51,
  commit `3b9f8be`)** avec le mot du parent ; APK de test v11 envoyé.
- **Deuxième lot des menus : la page Missions** ([bilan](BILAN-MENUS-LOT-2-2026-11-24.md)),
  choisie par le parent (« Continuer les menus ») : cartes à l'allure du premier écran, et
  l'en-tête des pages réparé (le premier lot l'avait fait passer sur deux rangées sur
  ordinateur). Quatre relectures indépendantes de suite : régressions du premier jet (le
  total des étoiles qui disparaissait ou rapetissait sur téléphone), puis défauts des
  corrections dans des états de plus en plus rares (la marque « Partie non gardée » coupée de
  l'en-tête, la version absente de « Pour les parents », la roue sous son voisin), tous
  corrigés avant fusion (PR 148, `main` = `19e245a`). APK de test : seul le v14 a la version
  finale. Publié le 25 novembre avec les lots 3 et 4 (publication n° 52).
- **25 novembre — troisième lot des menus : La Grande Expédition et le voyage**
  ([bilan](BILAN-MENUS-LOT-3-2026-11-25.md)) : le trait d'encre, l'ombre et le liseré miel de
  la page Missions, sans rien déplacer (9 941 boîtes mesurées, toutes identiques). Deux
  défauts d'allure rattrapés par les relectures indépendantes avant la demande de fusion,
  invisibles pour une mesure de boîtes : une carte trop chère de la roulotte qui avait l'air
  achetable, puis l'arrêt à jouer du voyage qui avait perdu son liseré miel ;
  `test:mobile-menus` garde maintenant le second. Troisième relecture : rien de bloquant.
  Fusionné (PR 149, `main` = `4cd545b`). APK de test : le v15 a les lots 2 et 3 dans leur
  état final. Publié avec les lots 2 et 4 (publication n° 52).
- **25 novembre — quatrième lot des menus : la page Favoris**
  ([bilan](BILAN-MENUS-LOT-4-2026-11-25.md)) : trait d'encre, ombre nette et coins ronds sur
  les cartes des alliés, boutons clairs du voyage, et un bouton « Précédents » ou
  « Suivants » qui pâlit quand il n'y a rien à tourner. Rien ne bouge (7 542 boîtes
  mesurées, toutes identiques). La relecture indépendante ne trouve aucune règle d'état
  écrasée ; elle a vu l'anneau du clavier d'une carte en partie caché par une ombre neuve,
  corrigé avant la demande de fusion. Fusionné (PR 150, `main` = `bffd3d2`) et **publié
  avec les lots 2 et 3 (publication n° 52, mot du parent du 25 novembre)**. APK de test : le
  v16.
- **25 novembre — cinquième lot des menus : « Pour les parents »**
  ([bilan](BILAN-MENUS-LOT-5-2026-11-25.md), mot du parent : « continue les menus ») : trait
  d'encre et ombre posée sur les boutons de la page, champ du code d'aventure et
  « Retrouver » à l'allure du voyage ; les « ? » et un code faux gardent leur allure. Rien ne
  bouge (4 092 boîtes, application et site). Deux défauts rattrapés avant la demande de
  fusion (un « ? » encadré, l'anneau du clavier mangé par l'ombre d'un voisin) ; la
  relecture indépendante ne trouve rien de bloquant. Fusionné (PR 151, `main` = `a1ba90b`).
  Publié avec le lot 6 (publication n° 53).
- **25 novembre — sixième lot des menus : les fenêtres** ([bilan](BILAN-MENUS-LOT-6-2026-11-25.md)) :
  trait d'encre sur le bord des fenêtres, croix de fermeture cernée d'encre, boutons clairs du
  voyage, cases des réglages à l'encre ; les couleurs de la pâte nommées pour toute la page.
  Les panneaux du combat et la fenêtre « Qui joue ? » gardent leur dessin. Rien ne bouge. La
  relecture indépendante (23 fenêtres) ne trouve rien de bloquant ; deux défauts corrigés
  avant la demande de fusion. Fusionné (PR 152, `main` = `87510b3`) et **publié avec le
  lot 5 (publication n° 53, mot du parent du 25 novembre)**. Ensuite : le camp.
- **25 novembre — septième lot des menus : le camp** ([bilan](BILAN-MENUS-LOT-7-2026-11-25.md)) :
  préparation d'une mission, serpents annoncés, aide des outils, colonne des alliés du combat.
  Trois regards croisés (critique de design, accessibilité, système de design comparé aux
  meilleures ventes du genre). Trait d'encre, onglet ouvert enfoncé et vert, anneau du clavier
  à l'encre dans les fenêtres de papier, « trop cher » distinct de « en pause ». Décisions du
  parent, posées une à une : coche sur l'allié choisi, « Retour » lisible et plus étroit,
  « C'est parti ! », « Vague suivante » et « Encourager » en pâte miel comme « Jouer », les
  petits boutons de la barre du haut, « Accueil » et « Comment jouer » en bouton clair,
  « C'est parti ! » moins large sur un grand écran, croix de l'aide à 48 px, anneau du clavier
  entier sur un téléphone. Le plateau ne change pas. Suivant : le catalogue « Tous les
  alliés ». Fusionné (PR 153, `main` = `c968143`) et **publié (publication n° 54, mot du
  parent du 25 novembre)**.
- **25 novembre — huitième lot des menus : le catalogue des alliés** ([bilan](BILAN-MENUS-LOT-8-2026-11-25.md)) :
  cadre et anneau du clavier à l'encre, onglets de la préparation, cartes à l'encre, carte
  choisie enfoncée avec la coche à l'encre, trop chère ou à découvrir à plat et sans miel,
  textes presque invisibles du pli « Conseils et outils » rendus lisibles. Décisions du
  parent : une carte trop chère répond « Il manque N pièces » ; « Fermer » en haut à droite
  sur ordinateur ; nom et prix plus grands sur ordinateur ; « Conseils et outils » en bouton
  avec une flèche. Fusionné avec la CI allégée (PR 154, `main` = `51554be`) et **publié
  (publication n° 55, mot du parent du 25 novembre)**.
- **Nuit du 25 au 26 novembre — neuvième lot des menus : la fin d'une partie et la pause**
  ([bilan](BILAN-MENUS-LOT-9-2026-11-25.md)), fait seul à la demande du parent, dans la règle :
  panneau du résultat à l'encre, boutons clairs, anneau du clavier à l'encre. Rien ne bouge.
  Avec le lot 10 (petits restes d'accessibilité) : PR 155, `main` = `e2e62b0`, **publié
  (publication n° 56, mot du parent du 26 novembre)**.
- **26 novembre — lot 11** ([bilan](BILAN-MENUS-LOT-11-2026-11-26.md)), trois décisions du
  parent : le bouton en tête de la fin d'une mission toujours en miel ; la pâte miel à la fin
  d'une partie et à la pause quand le mot tient dedans ; la sauvegarde familiale chargée au
  premier toucher (paquet principal 193 358 octets sur 200 000). PR 156, `main` = `f0ddd06`,
  **publié (publication n° 57, mot du parent du 26 novembre)**.
- **26 novembre — boss caché, lot 1 : les pommes** ([bilan](BILAN-POMMES-LOT-1-2026-11-26.md),
  décisions dans [BOSS-CACHE.md](BOSS-CACHE.md)) : une pomme toutes les trois vagues, dans
  chaque mode, gardée d'un toucher dans le carnet du joueur, et le fichier familial version 7
  qui la porte. Empreintes des parties inchangées. Branche `claude/trusting-brahmagupta-t7fmuy`,
  ni poussé ni fusionné. Pas encore essayé sur le téléphone ni par le fils.
- **26 novembre — boss caché, lot 2 : le combat et sa mesure**
  ([bilan](BILAN-BOSS-CACHE-LOT-2-2026-11-26.md)) : le serpent en anneaux (avale, grandit,
  raccourcit, s'enroule quand il n'a plus que sa tête), trois réglages mesurés pour le parent
  (« moyen » en place : expert 92 %, moyen 59 %, apprenti 36 %, deux minutes), un banc d'essai
  au dessin provisoire. Aucun écran n'y mène ; empreintes et mesures des autres modes
  inchangées. Même branche, ni poussé ni fusionné ; ni téléphone ni enfants.
- **26 novembre — boss caché, lot 3 : Classic Snake jouable**
  ([bilan](BILAN-BOSS-CACHE-LOT-3-2026-11-26.md)) : le nom du fils, le dessin A, la pomme et
  son compte dans l'antre de l'accueil, le bouton « Classic Snake » à 12 pommes, le combat
  chargé au premier toucher, jamais gardé, son écran de fin. Paquet principal 197 479 octets.
  Ni téléphone ni enfants.
- **26 novembre, soir** : les dessins du fils (serpent volant, King Snake à trois têtes de
  cobra), le dossier Google Play réel, les pommes et Classic Snake fusionnés ensemble (PR 157,
  `main` = `219341e`, relecture de Codex corrigée : l'antre se met à jour au retour à
  l'accueil) et **publiés (publication n° 58, mot du parent : « Fusionne et publie quand
  c'est vert »)**, contrôle en ligne vert.
- **26 novembre, nuit — aventure sans fin, lot A** ([bilan](BILAN-INFINI-LOT-A-2026-11-26.md)),
  accordé par le parent, sans changer de règle : partie de référence sans fin, joueurs
  simulés « hasard » et « épargnant » (l'épargnant bat l'expert dans la queue : 9 % au 5e roi
  contre 2 %), A* en tas et secours en une passe (mêmes parties : empreintes, 27 816 + 6 804
  parties identiques), cercle de la longue-vue, rente écrite, record avec ses rois, tour
  nommé, boutons à 48 px. Mots à lire par le parent. Ni poussé ni fusionné ; ni téléphone ni
  enfants.
- **27 novembre — aventure sans fin, lot B** ([bilan](BILAN-INFINI-LOT-B-2026-11-27.md)),
  demandé par le parent, sans changer de règle : l'étagère des cinq cadeaux dans le dock, au
  camp et pendant la vague, sa feuille « Tes cadeaux », les cadeaux au-dessus des cartes,
  « ★★ → ★★★ », les cinq cartes de « remplacer » en 780×360, le récap à la sortie et à la
  chute, chaque cadeau là où il agit (étincelles, anneau, lueur du refuge, prix barré, « +4 s »,
  « +40 »). Paquet à part ; paquet principal 199 174 octets (il reste ~500 octets dans
  l'aperçu publicitaire). Mots à relire par le parent. Ni poussé ni fusionné ; ni téléphone ni
  enfants.
- **À décider avec le parent** : un nouveau paquet Android pour Google Play (« publication
  package apk »), après son essai de l'APK de test.
- **Ensuite** : ce qui reste du
  découpage (fonctions longues de l'interface, recettes sur leur propre serveur).

## Où on en est

| Quoi                      | État                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Site**                  | https://snakeattacktd.com, publié depuis `main` le 22 novembre (publication n° 43, commit `36e207b`, contrôle en ligne vert) : la politique de confidentialité nomme l'application 0.40.0 / build 64, publiée quand le parent a dit que le build 64 était sur le téléphone. Le même jour, avant (n° 42, commit `37b3f06`) : la fin du point 7 de la revue du code (camp porté lu en un seul endroit, tirages de l'expédition nommés et figés par un test, « partie finie » écrite une fois), sans rien de nouveau à l'écran. Avant encore (n° 41, commit `f2378f6`) : le bouton « Tirer encore » de l'expédition et le paragraphe de confidentialité sur le fichier familial, approuvés par le parent ; les recettes de sauvegarde dans la CI ; les règles de l'expédition regroupées dans son modèle. Puis (n° 40, commit `33a9bb5`) : les quatre lots de la revue du code et leurs corrections, sans rien de nouveau à l'écran. Avant, le 21 novembre (n° 39) : La Grande Expédition version 3, l'étape d'hygiène, la sauvegarde familiale complète. 14 pages FR/EN, dont « L'histoire » et « Tester sur Android ». Révision 7 (spinosaure) jouable. |
| **Application**           | **0.40.0 / build 64 sur le téléphone du parent le 22 novembre, d'après lui ; son fils l'essaie.** **L'export du fichier familial n'y fait rien** (essai du parent, 22 novembre) : aucune aventure ne sort du téléphone, dans ce build comme dans les précédents. Le reste de la recette à cocher n'est pas revenu ; rien n'est noté sur sa promotion dans « Alpha ». Chez les autres testeurs : 0.39.0 / build 63 (révisions 3 à 6, sans le spinosaure). Version 0.40.0 / build 64 ([contenu](BILAN-0.40.0.md), [passation et recette téléphone](ANDROID-BUILD-64.md)). Build 63 : arrivée sur le téléphone du parent par Google Play (19 novembre), promue dans le test fermé « Alpha » le 20 novembre, en attente de l'examen de Google ([passation](ANDROID-BUILD-63.md), [bilan](BILAN-0.39.0.md)).                                                                                                                                                                                                                                                                                                                                                |
| **Test fermé Android**    | Créé par le parent le 20 novembre : groupe public `snakeattack-testeurs`, piste « Alpha ». Trois modifications (pays, liste de testeurs, adresse de retours) restaient à envoyer à l'examen de Google d'après le compte rendu du parent du 20 novembre : à confirmer. Le lien d'inscription marche quand Google les a acceptées. Google demande 12 testeurs pendant 14 jours de suite avant la production.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Publicité sur le site** | Éteinte. AdSense n'a pas encore approuvé le site. Rien ne s'allume sans le message du parent ([ordre d'activation](publication/PUBLICITE-WEB-PROPOSITION.md)).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Les enfants**           | Le fils essaie le build 64 sur le téléphone le 22 novembre (dit par le parent) ; ses remarques ne sont pas encore notées. Avant : 2 ou 3 parties sur le site le 19 novembre, content, sans remarque précise.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

## Demande du parent du 22 novembre : analyser avant d'agir

Le parent : ne plus enchaîner les lots ; solidifier le logiciel, retirer ce qui se répète,
revoir l'accueil, refaire les images de la fiche Play, et d'abord analyser, comparer avec ce
qui se fait ailleurs, chercher les standards. L'analyse est faite :
[ANALYSE-2026-11-22.md](ANALYSE-2026-11-22.md) (constats mesurés, douze fiches du Play Store
regardées, accueil passé à une grille de 30 critères, ordre proposé en sept étapes, sept
décisions pour le parent).

Le parent a ensuite dit de suivre l'ordre proposé et d'enchaîner les lots, puis, le soir,
« revue, conseil et continue ».

**Où en est `main` le 22 novembre au soir.** Six lots de l'analyse sont fusionnés (tests
manquants, garde de publication, filet d'erreur, copie d'avant, sauvetage d'un camp
illisible) ; **aucun n'est publié, aucun build Android ne les contient**. Une relecture sévère
faite après coup a trouvé une faiblesse dans presque chacun, et le conseil a tranché :
**`main` n'est pas à publier avant les corrections**
([ce que j'avais annoncé de trop](ANALYSE-2026-11-22.md#revue-sévère-du-22-novembre--ce-que-jai-annoncé-de-trop),
[constats et décisions](analyse-2026-11-22/E-revue-et-conseil.md)). Aucune règle du jeu n'a
bougé (301 parties rejouées, identiques).

**Le plus grave : dans l'application, l'export ne fait rien** (essai du parent sur le build
64, le 22 novembre), et le jeu écrit quand même « Fichier prêt ». Aucune aventure ne peut
sortir d'un téléphone : ne rien désinstaller, ne pas effacer les données de l'application.
Le site n'est pas touché.

**Ordre retenu par le conseil**

1. Les documents disent vrai : fait (PR 130).
2. Garde de publication et filet d'erreur : fait (PR 129, attaquée deux fois avant fusion).
   Puis l'application dit la vérité sur l'export : plus de bouton muet ni de « Fichier
   prêt » sans fichier, en attendant les deux modules (PR 131, attaquée avant fusion).
3. Écrans de panne : une seule fenêtre, des phrases justes, « Réessayer » : fait (PR 132,
   attaquée puis contre-attaquée avant fusion). Le secours en un seul fichier, avec son
   lecteur, reste à faire.
4. Sauvegardes, trois lots à la suite, chacun attaqué avant le suivant. Le premier, le
   sauvetage de tous les camps, est proposé (PR 133) ; puis les copies de secours ; puis
   « ta partie n'est pas gardée ».
5. Le parent lit les mots des fenêtres et accepte les copies gardées sur l'appareil ; il
   republie le commit déjà en ligne (répétition de la garde), puis `main`.
6. Build 65 : `main` et l'export réparé par les deux modules, essayé sur son téléphone :
   exporter, trouver le fichier hors de l'application, désinstaller, réinstaller, importer.

**Décidé par le parent le 22 novembre au soir**

- **Oui aux deux modules officiels de Capacitor (Filesystem et Share)** pour que l'export
  marche dans l'application : le jeu écrit le fichier, puis ouvre la fenêtre de partage
  d'Android. Risques dits avant sa réponse : ni compilable ni essayable ici (il faudra un
  build 65 et son essai sur le téléphone) ; la fenêtre de partage propose toutes les
  applications, et l'espace des parents n'a pas de barrière ; deux dépendances de plus ;
  les permissions de l'application à contrôler sur le build.
- **L'import marche dans l'application** : essayé par lui sur le build 64 (« la reprise du
  fichier marche parfaitement »). Seul l'export est cassé.

**Ce qui attend le parent**

- Prévenir les testeurs du build 64 : ne pas désinstaller, ne pas effacer les données.
- Lire, avant toute publication, la page des mots nouveaux (fenêtres d'erreur, de sauvegarde,
  copies de secours).
- Réglage GitHub, s'il le veut : ranger les secrets `INFOMANIAK_*` dans un « environment »
  limité à la branche `main`. Sans cela, « Publier le site » lancé depuis une autre branche
  tourne sans la garde (`docs/SITE.md`).
- La page publique des parents dit encore que le fichier familial n'exporte pas La Grande
  Expédition : faux depuis la version 6 du fichier. Phrase à corriger avec son accord.

**Règle de méthode depuis le 22 novembre** (conseil, annexe E) : `main` reste toujours
publiable. Un lot qui touche à ce que l'appareil garde, à ce qui se passe quand quelque chose
casse, à une phrase qui promet, à la CI ou à la publication, ou qui repose sur une chose
jamais vue sur la vraie cible, est attaqué par une relecture indépendante **avant** sa
fusion ; un seul à la fois, une PR par lot. Chaque affirmation d'un compte rendu dit par quoi
elle est prouvée, sur quoi, et ce qu'elle ne couvre pas.

## En pause (21 novembre) : les fonctionnalités

Le parent, le 21 novembre : pause dans les fonctionnalités, d'abord une étape d'hygiène
(stabiliser avant d'ajouter). Compte rendu : [BILAN-HYGIENE-2026-11.md](BILAN-HYGIENE-2026-11.md).

**Suite de l'hygiène** (décisions du parent, 21 novembre), avant les fonctionnalités :

- ~~Sauvegarde familiale version 6~~ : fait (l'expédition, les records de l'aventure sans fin
  et le voyage à finir sont dans le fichier ; les anciens fichiers restent lisibles).
- ~~Allié collé à un rocher~~ : fait, pour les nouvelles parties (secondes règles de chemin,
  expédition version 3). Mesuré : la difficulté ne change pas. Accord du parent le 21
  novembre ; publié avec les deux autres lots (publication n° 39).
- Recette sur le vrai téléphone avec le build 64 : la liste est dans
  [ANDROID-BUILD-64.md](ANDROID-BUILD-64.md) (elle reprend celle de la fin du bilan).

**Revue du code** (21 novembre, [REVUE-CODE-2026-11-21.md](REVUE-CODE-2026-11-21.md)) :
accord du parent pour la performance (points 1 et 4) et le nettoyage (points 5, 7, 8, 10, avec
le retrait des restes du voyage). Gardés pour après : les images à ré-encoder (−6,7 Mo) et
Phaser sans physique (−396 Ko), qui demandent un regard sur le téléphone.

- Lot 1, performance : fait. La sauvegarde n'est plus refaite quand rien n'a changé (pendant
  un combat : 5,4 → 0,2 ms par appel à 80 alliés) ; les places du camp sont cherchées une
  fois par carte (aventure sans fin : pas moyen 1,25 → 0,28 ms). Mêmes parties, mêmes
  sauvegardes. **Nombres relevés sur un ordinateur, sous Node ; rien n'est mesuré sur le
  téléphone.**
- Lot 2, restes du voyage et code mort : fait. Documentation d'architecture : les passages
  relevés par la revue sont corrigés, pas le document entier.
- Lot 3, CI : fait, gain mince. L'attente passe d'environ 11–17 minutes à 10–12 (c'est
  `verify` qui la fixe maintenant), le calcul ne baisse pas (environ 48 minutes par passage,
  contre 44). Depuis le 25 novembre 2026, toute PR ne lance que `npm run verify`.
- Lot 4, règles écrites une seule fois (point 7) : première partie faite (tirages, armure,
  valeurs nommées), parties identiques. Seconde partie le 22 novembre : les règles de
  l'expédition que ses écrans recopiaient sont dans le modèle. Fin le même jour : le camp
  porté se lit en un seul endroit, la table de cadeaux et les tirages de l'expédition ont
  un nom, « partie finie » s'écrit une fois. Point 7 clos.
- Recettes de sauvegarde dans la CI (22 novembre, suite choisie avec l'accord du parent) : une
  tâche « sauvegardes » rejoue à chaque PR de code la mise à jour depuis l'appareil d'un
  testeur du build 63, le fichier familial, la fermeture forcée et les doubles appuis.
- Revue sévère et conseil (22 novembre, demande du parent) : quatre relecteurs, trois juges,
  rien de bloquant, « publier » à l'unanimité ; corrections dans la PR 115, puis publication
  n° 40. Détail à la fin
  de [REVUE-CODE-2026-11-21.md](REVUE-CODE-2026-11-21.md).

**Décidé par le parent le 22 novembre 2026.**

- Le bouton « Trois autres cadeaux » de l'expédition dit « Tirer encore » (« Draw again »). Il
  refait un tirage sans écarter les trois premiers : au moins un cadeau revient six fois sur
  dix (mesuré sur 60 000 graines). Le tirage ne change pas ; écarter les trois premiers
  serait une règle nouvelle.
- La politique de confidentialité dit ce que le fichier familial contient sur le site (le
  voyage à finir, l'expédition, les records) et dans l'application Android 0.39.0, build 63
  (pas le voyage, et un code du Voyage encore affiché). Mots approuvés :
  `tests/fixtures/fichier-familial-approuve-2026-11-22.json`.
- Le même jour, à la préparation du build 64 : ce paragraphe range l'application Android
  0.40.0 (build 64) avec le site (même fichier familial, plus de code du Voyage) et garde ce
  qu'il dit de l'application 0.39.0 tant que des testeurs l'ont encore. Mots approuvés :
  `tests/fixtures/fichier-familial-approuve-build-64-2026-11-22.json`. **Il nomme les builds
  63 et 64 : à relire à chaque nouveau build, et quand plus aucun testeur n'a le 63.**

**À reprendre après l'hygiène**, dans cet ordre :

1. Expédition : les règles nouvelles, une par une, chacune montrée au fils, mesurée, acceptée
   (Les Ponts Mouillés, Double Couronne pour un gardien, Le Tunnel Secret, Ensorcelés…).
2. Expédition : voir avec le fils les défis qui reviennent (« Les carapaces » et « La
   tirelire », quatre fois chacun) et la difficulté réelle (le joueur simulé moyen arrive
   15 fois sur 100).
3. ~~Application Android : build 64~~ : version prête dans `main` (22 novembre) ; reste la
   construction par Codex et la recette sur le téléphone.
4. Dossier Play ; mention des records dans la politique de confidentialité (au parent).
5. Plus tard : sauterelle, boss caché aux pommes, « Invente ton défi ».

## Avant la pause (20 et 21 novembre) : La Grande Expédition

Le long voyage demandé par le parent : trois tableaux de cinq missions, des chemins, des
haltes, le camp qui suit l'enfant, les cadeaux de l'aventure sans fin
([proposition et décisions](VOYAGE-LONG-PROPOSITION.md), [compte rendu](BILAN-GRANDE-EXPEDITION.md)).
Moteur (PR 103) et écrans (PR 104) publiés le 21 novembre. Le même jour, à la demande du
parent, l'expédition remplace le voyage court (un voyage commencé se finit) et sa carte devient
une route avec ses embranchements. Puis la version 2 : un défi fixe par étape (caprices du
fils, tableau accepté par le parent), « étape » partout, serpents un peu plus forts ; après
relecture, trois défis qui ne jouaient pas avec le camp remplacés (accord du parent).
Ensuite : les règles nouvelles (Ponts Mouillés, Double Couronne…), une par une, montrées au
fils avant.

L'aventure sans fin est finie et publiée ([compte rendu](BILAN-MODE-INFINI.md)).

## Dans `main` et sur le site, pas encore dans l'application

- **Le spinosaure** (révision 7, 19 novembre) : allié du fils dans la grande aventure dès la
  vague 8, voile et nage ; valeurs choisies par le parent après mesure
  ([bilan](BILAN-REVISION-7.md)). Le catalogue des alliés met ses onglets dans la ligne du
  titre pour tenir sur un téléphone.
- **La politique de confidentialité du 20 novembre**, avec la section « Test de
  l'application Android ». L'application 0.39.0 montre encore celle d'avant.

Ils attendent le **build 64**, à construire par Codex depuis `main` comme le 63
(`npm run android:package`, [ANDROID-BUILD-64.md](ANDROID-BUILD-64.md)), puis à promouvoir
dans « Alpha » par le parent. La version 0.40.0 / build 64 est dans `main` depuis le
22 novembre ; avec le spinosaure et la politique, elle apporte l'aventure sans fin, La
Grande Expédition et les corrections de l'étape d'hygiène.

## Ce qui attend le parent

1. **Play Console** : vérifier que les trois modifications du test « Alpha » sont envoyées et
   acceptées ; ouvrir le lien d'inscription depuis un autre compte Google pour voir qu'il
   marche.
2. **Recruter les testeurs** : 15 à 20 adultes pour en garder 12 pendant 14 jours. Claude peut
   écrire le message type et une affichette A5 avec QR code
   ([TESTEURS-ET-JOUEURS.md](TESTEURS-ET-JOUEURS.md), « Recommandation »).
3. **Search Console et Bing** : déclarer le site et envoyer le plan du site, dans les comptes du
   parent ([SITE.md](SITE.md)). Aucune trace dans le dépôt que ce soit fait.
4. **Une séance avec les enfants**, 30 à 45 minutes sur le téléphone : le voyage, les nouveaux
   serpents, le spinosaure (sur le site). Noter où ils tombent, ce qui les décourage, ce qu'ils
   redemandent. C'est ce qui choisit le contenu suivant. Montrer aussi au fils les phrases
   d'annonce à valider (« Nouveau serpent : … ! », « Nouvel allié : … ! » ; « Nouveau serpent :
   Serpent ninja ! » lui va-t-il, ou plus court ?), et regarder sur le téléphone l'écran étroit
   (920 px) et les noms des voies sur la carte d'une mission, encore petits.
5. **Plus tard, quand il veut** : une meilleure photo du dessin (prise d'en haut, fond uni) ;
   dire si la photo d'origine, où l'on voit un billet de train de la région, doit sortir de
   `public/references/` (elle n'est pas publiée sur le site, mais elle est dans Git, qui est
   public) ; l'ancien site `…chatgpt.site`, où personne ne joue, peut être arrêté quand il
   veut.

## À faire, dans l'ordre

1. **Build 64** : la version est prête dans `main` (0.40.0 / 64, aux trois endroits :
   `package.json`, `android/app/build.gradle`, `POLICY_APP`). Reste à Codex de la construire
   (`npm run android:package`), puis au parent de l'installer par-dessus le build 63 et de
   cocher la recette de [ANDROID-BUILD-64.md](ANDROID-BUILD-64.md) avant de la promouvoir :
   celle du build 63 n'a jamais été remplie.
2. **Dossier Google Play** : `docs/publication/` et `npm run store:check` décrivent encore
   l'ancien modèle (publicité entre missions, achats). Le parent a décidé : ni publicité ni
   achat dans l'application. À refaire avant la sortie en production, avec des captures du jeu
   actuel.
3. **Après la séance des enfants** : voyage sans fin s'ils finissent le voyage ; voyage plus
   doux s'ils tombent devant le roi ; nouvelles
   missions du fils s'ils veulent du neuf. Idées du fils en attente : le boss caché aux pommes
   (nombre de pommes à mesurer), le pierre-feuille-ciseaux entre dinosaures (« il faut plus de
   dinosaures »). Chaque règle nouvelle passe par une mesure, l'accord du parent et une
   nouvelle révision.
4. **Trouver des joueurs pour le site**, une fois les testeurs lancés : Outils Tice, CNLJ,
   journal local ([TESTEURS-ET-JOUEURS.md](TESTEURS-ET-JOUEURS.md)). Tant que la publicité est
   éteinte, le site peut se dire « sans publicité ».

## Ce qui n'est pas vérifié

- **La recette native du build 63** (`ANDROID-BUILD-63.md`) : cases vides ; seule celle du
  build 62, sur émulateur, est faite.
- **Sur un vrai téléphone** : le spinosaure, le catalogue à 21 alliés, les deux nouvelles pages
  du site. Le build 63 est arrivé sur le téléphone, mais aucune séance n'est notée.
- **Avec les enfants** : le voyage (les simulations disent qu'un joueur « apprenti » tombe trois
  fois sur quatre devant le roi), les révisions 3 à 7, les textes à 11 et 13 px.
- **Le lien d'inscription au test** : jamais ouvert depuis cette session (les sites Google y
  sont bloqués).
- **L'anglais** : pas relu par une personne.

## Dettes connues

- `reports/` : 844 fichiers de rapports encore suivis dans Git.
- **Paquet principal : 195,8 Ko sur 200** (pommes, 26 novembre ; 193,4 au lot 11) : la sauvegarde familiale est
  chargée à la demande, le carnet de caprices l'était déjà. Ce qui reste de gros dans le paquet
  sert au combat ou aux premiers écrans (rendu du plateau, autocollants des missions).
- `test:mobile-menus` est la plus longue tâche de la CI (10 à 17 minutes).
- Les pages de test (`tests/*-harness.ts`) ne chargent pas les feuilles de style comme le jeu.
- Détail : [bilan du nettoyage](BILAN-NETTOYAGE-2026-11.md).

## Règles de travail en vigueur

- Une branche, une PR pour 2 ou 3 lots (décision du parent du 25 novembre 2026, pour les
  minutes facturées). Le parent a autorisé, dans les sessions de travail de novembre 2026,
  la fusion des PR de Claude quand elles sont vertes, sans conflit ni fil de revue ouvert,
  puis la publication du site avec son mot. Depuis le 25 novembre 2026, une PR ne lance que
  la vérification rapide (« portée » et « verify » : format, tests unitaires, build) ; les
  recettes sont jouées avant, toutes, sur la machine de travail (les groupes de
  `check.yml`), et une recette rouge, c'est ne pas fusionner. La CI complète (les neuf
  lignes) tourne une fois, sur `main` après la fusion : c'est elle que compte la garde de
  publication ; rouge, rien n'est publié et le lot suivant la répare. Tout le reste de
  `CLAUDE.md` tient : il demande avant une dépense, une publication sur Google Play ou un
  changement de règle.
- Relectures : huit angles pour un lot qui change une règle ou un écran du jeu, trois pour un
  petit lot de textes ou de corrections.

## Où lire le détail

[Architecture](ARCHITECTURE.md) · [Site](SITE.md) · [Testeurs et joueurs](TESTEURS-ET-JOUEURS.md)
· [Android](ANDROID.md) · [Voyage](VOYAGE.md) · [Caprices](CAPRICES.md) ·
[Passation](PASSATION-CLAUDE-CODE.md) · règles du jeu : `GAME_DESIGN.md`, `AGENTS.md`.
