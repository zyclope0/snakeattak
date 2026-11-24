# Plan actuel — 23 novembre 2026

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
  contre 44). Une PR de documents seuls ne lance que `npm run verify`.
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
- **Paquet principal : 199,3 Ko sur 200** (build du 20 novembre) : il reste 0,7 Ko avant que
  la construction refuse. Avant le prochain lot qui touche l'interface, charger à la demande
  la sauvegarde familiale et le carnet de caprices.
- `test:mobile-menus` est la plus longue tâche de la CI (10 à 17 minutes).
- Les pages de test (`tests/*-harness.ts`) ne chargent pas les feuilles de style comme le jeu.
- Détail : [bilan du nettoyage](BILAN-NETTOYAGE-2026-11.md).

## Règles de travail en vigueur

- Une branche, une PR par lot. Le parent a autorisé, dans les sessions de travail de
  novembre 2026, la fusion des PR de Claude quand toutes les tâches de la CI sont vertes,
  sans conflit ni fil de revue ouvert, puis la publication du site. Depuis le 22 novembre
  2026, « toutes vertes » veut dire : pour une PR qui touche autre chose que des documents,
  « portée », « verify » et les six « recettes », dont « sauvegardes » (huit lignes) ; des recettes sautées sur
  une telle PR, c'est ne pas fusionner. Pour une PR de documents seuls (`*.md` à la racine
  ou sous `docs/`, hors `docs/publication/`) : « portée » et « verify » vertes, les recettes
  sautées. Avant de publier, regarder le passage complet sur `main` au commit publié : le
  workflow de publication ne lance que `npm run verify`. Tout le reste de `CLAUDE.md`
  tient : il demande avant une dépense, une publication sur Google Play ou un changement de
  règle.
- Relectures : huit angles pour un lot qui change une règle ou un écran du jeu, trois pour un
  petit lot de textes ou de corrections.

## Où lire le détail

[Architecture](ARCHITECTURE.md) · [Site](SITE.md) · [Testeurs et joueurs](TESTEURS-ET-JOUEURS.md)
· [Android](ANDROID.md) · [Voyage](VOYAGE.md) · [Caprices](CAPRICES.md) ·
[Passation](PASSATION-CLAUDE-CODE.md) · règles du jeu : `GAME_DESIGN.md`, `AGENTS.md`.
