# Plan actuel — 0.37.0 publiée, remise en ordre en cours

## Remise en ordre — Claude Code, 11 novembre 2026

Trois objectifs du parent : moteur propre, interface stabilisée, projet nettoyé. Ordre retenu :
filet de tests, nettoyage, moteur, interface, conventions. Un lot par PR, sans changer une règle.

- **Lots 0 et 1 (cette PR).** Les recettes n'écrivent plus dans des fichiers suivis ; 5 173
  captures et gros rapports sortent du suivi Git (671,7 → 103,1 Mo), récupérables au commit
  `88fdf54` : [ARCHIVES.md](ARCHIVES.md). Aucun fichier de `src/` touché.
- **Moteur de rendu.** Phaser 3 réévalué et gardé : voir la fin d'[ARCHITECTURE.md](ARCHITECTURE.md).
- **À suivre.** Tri des documents (vivants / archive), découpage de `src/game.ts`, pages
  Missions, Favoris et Aventure classique sur téléphone, puis `style.css` et `index.html`.
- **Pas vérifié.** Rien sur le S24 ni avec les enfants.

## Interface mobile courte — huit choix réalisés et publiés

La version Android **0.37.0 / code 49** applique les huit choix validés :
accueil court et reprise contextuelle, carnet de six autocollants par mission,
gestion repliée, préparation en sous-vues, catalogue natif paginé en pause avec
budget visible. Les 36 noms/annonces du créateur restent français dans les deux
langues ; moteur, données, sauvegardes et anciens codes sont préservés.

Source produit/tests figée : `b31933bf9f6dc56b9c7bf4d286068f52ff3bf28a`.
[Bilan](BILAN-0.37.0.md), [conseils simulés](CONSEIL-0.37.0.md),
[preuves et reçus](../reports/interface-0370/README.md),
[cadrage](superpowers/specs/2026-11-10-interface-mobile-0370.md).
La correction finale I1/M1/M2 révèle les résultats du catalogue, remet le focus
d’accueil dans la zone visible et répare la recette journey. Verify 549 tests,
9 régressions navigation, journey, gestes natifs cinq tailles + ordinateur,
menus et navigateur sont verts sur la source corrigée. APK debug et portable
HTML/ZIP sont reconstruits ; quatre démarrages froids FR/EN sont verts.
Les 21 gates et la partie authentique antérieurs restent explicitement en `9ca13bb`.
La nouvelle recette et les artefacts sont indexés dans le reçu de livraison. Les anciennes preuves et la version 0.36.2 restent conservées.

**Le site public est en 0.37.0, Sites24.** Revue globale et relecture des trois
correctifs approuvées ; PR7 fusionnée après CI verte. Les fichiers publics sont
identiques au paquet normal de l’APK. Voir le [reçu](../reports/deployment-0.37.0.json).
Les essais S24, TalkBack, enfants et
relecture anglophone native restent attendus. Le petit carnet 568×320 avec marges
conserve un défilement interne ; à 780×360 avec marges les six cartes tiennent.

Le comparatif d’images est séparé et arrêté au [devis partiel](interface-0370/DEVIS-COMPARATIF.md) :
100 crédits Magnific, 1 crédit Higgsfield de base, prix Runway indisponible.
Aucune image ni dépense lancée.

## v0.36.2 — livraison clôturée

Les PR3 et PR4 sont fusionnées dans `main`. Le [site habituel](https://conquete-serpents-famille.zyclope.chatgpt.site/)
est publié en 0.36.2, Sites23, audience publique conservée.
Le [reçu de publication](../reports/deployment-0.36.2.json) distingue source
fonctionnelle, clôture documentaire, fusion GitHub, version Sites et vérification publique.

Les sept décisions et cinq réglages sont appliqués aux nouveaux départs.
T-rex 340, bébé dragon 210 et tank 440 ; le tank garde son déblocage classique.
Les anciens codes et sauvegardes gardent leurs règles et leurs prix.
Le rappel reste une présentation UI sans modification du temps de simulation.

548 tests, build et budgets verts ; CI du code livré `28e958e` entièrement verte
(`42875093574`). Les commits suivants ne changent que documents et reçus,
avec format contrôlé ; la CI post-fusion est suivie séparément.
672 parties du moteur livré, distinctes des 1 356 exploratoires et des témoins
réutilisés. Les 8 139 anciennes preuves et 145 fichiers Task3 restent conservés.
La revue globale, son unique correction P3 familiale et sa relecture sont clôturées.
[Bilan](BILAN-0.36.2.md), [conseil simulé](CONSEIL-0.36.2.md),
[arbitrages](../reports/equilibrage-0362/coordination.md).

APK debug 0.36.2 / code 48 : même application et certificat, 34 fichiers web identiques.
Démarrages à froid FR/EN hors ligne et fichier vérifiés. Contrôle public réel
à 1280×800, 812×375 et 780×360 : version, langues, vague, pause et rotation,
sans erreur JavaScript ; huit fichiers JS/CSS/HTML identiques au paquet.
Essai physique S24, TalkBack, relecture anglophone et enfants encore attendus.
Les 19 px initialement visibles à 568×320 restent une limite de découverte ;
le panneau entier défile et les cartes complètes deviennent visibles.

**Suite demandée : pause sur les fonctionnalités.** Étudier les menus de jeux
grand public et tower defense, l’ergonomie Android et la cohérence graphique
pâte à modeler/papier mâché. Ce nouveau travail commence après cette livraison,
sans changer les règles, les valeurs ou le sens du jeu inventé par l’enfant.

## Préparation 0.36.2 — historique conservé

## Candidate privée 0.36.2 — livraison et revue avant essai S24

Version 0.36.2 / Android 48 sur `feat/equilibrage-0362`, empilée sur
`feat/caprices-interface`. Les sept décisions confirmées sont appliquées : bonus
réservé aux carapaces, baisse des trois prix, rappel discret, T-rex 340,
bébé dragon 210, tank 440, rappel après dix secondes actives avec 500 pièces
dépensables. Les cinq réglages de caprices concernent seulement la révision 2.
Les départs historiques conservent règles et prix de la révision 1 ; codes 4,
camps 9, progression 2 et famille 5 protègent les nouveaux départs. Carnets 1,
campagne et étoiles familiales restent partagés.

[Bilan et limites](BILAN-0.36.2.md), [index des preuves](../reports/equilibrage-0362/README.md).
672 parties du vrai Game révision 2 confirment exactement les cohortes approuvées ;
les 1 356 parties exploratoires et les 540 témoins réutilisés sont distingués.
La revue fraîche globale et le conseil final appartiennent au coordinateur.
Essai physique S24, TalkBack, relecture anglophone et expérience réelle des enfants
restent attendus. Livraison locale privée préparée ; publication après revue,
autorisée le 10 novembre et conduite par le coordinateur. Le site public reste
en 0.35.0 à ce stade de préparation. L’historique ci-dessous est conservé.

Correction finale unique du P3 familial effectuée dans `28e958e` : progression
mission 2 conservée ⇒ enveloppe 5, même après retour à un refuge historique ;
faux labels 1–4 refusés. Vérification fraîche 548 tests verts, navigateur/famille,
quatre démarrages froids FR/EN et APK source identique au reçu courant.
APK/portable pré-revue conservés ; archive initiale inchangée et complément
final séparé vérifié. Les 8 139 preuves historiques et 145 fichiers Task3 sont
identiques ; huit hashes physiques inchangés, pas de répétition des 672 parties.
Relecture ciblée et opérations distantes restent confiées au coordinateur.

## Candidate privée 0.36.1 — livraison et revue avant STOP

Version 0.36.1 / Android 47 sur `feat/caprices-interface`. Les douze constats
visuels et le lot documentaire sont traités dans le [bilan](BILAN-0.36.1.md).
Le [plan d’hygiène](HYGIENE-DEPOT-0361.md) est une proposition chiffrée ;
aucune preuve historique retirée ni histoire Git réécrite. Les nouvelles preuves
restent dans une archive locale externe et un petit index de livraison.

Règles, catalogue, valeurs, noms/annonces, RNG, anciens codes/camps et données
familiales restent gelés. Les cinq propositions d’équilibrage ont été mesurées
séparément ; leur application attend la décision sur les morsures et une
solution de compatibilité. Aucun prix, rappel de dépense ou classique modifié.

Les trois revues de lots, la revue fraîche de toute la branche et le conseil
de six perspectives simulées sont terminés. Le seul mineur final, le nom
accessible du champ du carnet anglais, est corrigé ; relecture ciblée approuvée.
Source du nouvel APK : `4f3cabe`, après vérification 506 tests, navigateur,
80 contrôles de navigation et quatre démarrages froids ; 34 fichiers web
identiques. Ancien APK et archive conservés, complément de preuves vérifié.
Aucun essai physique S24/enfant n’est prétendu. Le site public et `main` restent en 0.35.0. **STOP**, sans fusion
ni publication. L’état précédent ci-dessous est conservé comme historique.

## Candidate privée 0.36.0 — STOP pour essai du parent

Version0.36.0/code46 sur `feat/caprices-interface` : préparation des 36 caprices,
copains autorisés, sauvegarde 8, codes 3, enveloppe familiale 4 et carnets séparés.
Les noms et annonces du fils restent exactement français dans les deux langues.
Campagne et étoiles restent familiales ; pas de profils de combat distincts.
[Bilan](BILAN-0.36.0.md), [état du conseil](CONSEIL-0.36.0.md),
[preuves](../reports/suivi-0.36.0/commands.json).

Cette candidate n'est ni fusionnée dans `main`/`claude/caprices`, ni publiée.
Le site public et `main` restent en 0.35.0. La revue finale fraîche et le conseil de six perspectives simulées sont terminés ; les deux finitions relevées ont été corrigées et leur relecture ciblée est approuvée.
L'essai du parent sur le nouvel APK/S24 et la relecture anglophone restent attendus.
Aucun changement des règles, équilibrage, RNG, appID ou certificat.
APK final : `conquete-serpents-v0.36.0-final-debug.apk`, sources `23a37de`.
Branche de revue : [feat/caprices-interface](https://github.com/zyclope0/snakeattak/tree/feat/caprices-interface), base `claude/caprices`. L’état de la CI distante se consulte sur GitHub ; il est distinct des preuves locales.

## Fusion autorisée de PR2 — 9 novembre 2026

Le parent autorise la fusion. Le préflight a reproduit l'échec des deux CI
sur le test hors ligne : lecture du numéro de version avant la fin du bootstrap
asynchrone. Correction du seul test par attente du vrai accueil ; les dix
contrôles hors ligne passent, dont les sauvegardes 1–7. Les 34 fichiers web restent
identiques au build publié et à l'APK 0.35.0. PR2 a été fusionnée en `1c4e94f` ; la CI de `main`
`42657692341` a réussi. Le résultat effectif est consultable sur
[PR2](https://github.com/zyclope0/snakeattak/pull/2).
[Preflight](PREFLIGHT-MERGE-0.35.0.md).

## Lot tactique et anglais — 9 novembre 2026

**0.35.0/code45.** Demande du parent : réaliser le lot 2 de lisibilité,
doubler le jeu en anglais sous le nom **Snake Attack TD**, conserver le français
et ajouter une unique soucoupe décorative. Règles, équilibre, graines, formats
de camp et codes de départ conservés ; aucun nouveau lieu ou niveau.

Fait côté application : placement expliqué selon rôle/portée réels, voie faible
suggérée parmi les voies ouvertes, stocks médicaux regroupés près du refuge,
étoiles gagnées et consigne de défaite cohérente. Choix FR/EN mémorisé à l'accueil
et en pause, messages/aides/catalogue/missions/Phaser traduits, nom Android
anglais selon langue système. Soucoupe originale mate dans les seules ruines
classiques ; aucun asset de film ou appel payant.

**Site 0.35.0 publié, Sites 22**, audience conservée, FR/EN et pause vérifiés
sur le déploiement réel ; HTML, cinq JS et deux CSS identiques au build.
APK normal code 45 inspecté,34fichiers web identiques ; nouvel essai S24 attendu.
Refuge joué en anglais sur le site :3 vagues, victoire100%, accès à la mission
suivante confirmé ; pas de nouvelle étude d’équilibrage.
[PR2](https://github.com/zyclope0/snakeattak/pull/2) fusionnée en `1c4e94f` ;
`main` contient 0.35.0, CI `42657692341` réussie. [Reçu](../reports/deployment-0.35.0.json).

[Bilan](BILAN-0.35.0.md), [conseil final](CONSEIL-0.35.0.md),
[conseil du premier lot](CONSEIL-0.35.0-lot1.md).
La recette automatique ne remplace pas l'essai du nouvel APK sur le S24 ni une
relecture humaine anglophone. Mineurs suivis : aide longue, actions secondaires
petites, explication du groupe médical et indice de défilement des résultats.
Aucun changement publicitaire, achat, appID définitif ou publication Play.

Les sections suivantes conservent les livraisons et décisions antérieures.

## Fusion autorisée — 9 novembre 2026

Le parent autorise la fusion de la PR1 vers `main`. Le préflight GitHub a
révélé un adaptateur de test encore lié au dock masqué en fin de partie ;
reproduction puis correction des seuls tests. Le contrôle étendu stabilise
aussi la pose tactique qui expirait avant sa lecture. Aucun changement du jeu :
les 30 fichiers du build normal restent identiques au site et à l'APK 0.34.2.
[Explication et preuves](PREFLIGHT-MERGE-0.34.2.md) ; l'état de fusion et les
exécutions distantes sont consultables sur la [PR1](https://github.com/zyclope0/snakeattak/pull/1).

## Parties navigateur, interface et équilibrage — 9 novembre 2026

**0.34.2/code44 livré côté application.** Dix parties d'évaluation sur le vrai
site 0.34.1 : six missions en progression réelle, deux contrôles Refuge et deux
Grandes aventures.37vagues,8victoires/2défaites, aucune erreurJavaScript. Chromium
isolé, commandes souris/tactiles et horloge accélérée : pas des séances enfants
ou une validation physique S24.532 simulations moteur distinctes complètent
l'évaluation ; aucune règle, statistique, graine ou sauvegarde modifiée.

Défaut prioritaire reproduit : les actions de fin restaient sous le catalogue
masqué. Nouveau panneau visible, mêmes commandes Mission suivante/réessai/carte
et recommencer classique. Conseil6personas ; trois défauts du panneau corrigés
après reproduction : catalogue desktop, ordreTab, bouton avec marges 568.
30 états+35 contrôles verts,441tests et recettes générales verts. Une mission
complète locale puis une mission publique confirment le parcours jusqu'à
l'aperçu suivant ;12parties/43vagues en incluant ces deux confirmations.

**Site publié0.34.2/Sites21**, APK normal même certificat/identité provisoire,
30 fichiers web identiques au build. Reçu de publication et confirmation publique
séparés de l'échantillon d'évaluation.
[Bilan](BILAN-0.34.2.md), [conseil](CONSEIL-0.34.2.md),
[preuves](../reports/suivi-0.34.2/verification.json),
[publication](../reports/deployment-0.34.2.json).

Suite prioritaire : essai S24 des fins de partie, compréhension du placement
et des premiers achats, puis comparaison contrôlée de la Grande aventure avant
de proposer des chiffres. Deux premières missions permissives conservées ;
soigneurs et archers non retouchés sur des politiques de bots non comparables.
Étoiles et texte de défaite traités depuis en 0.35.0 ; indice de défilement
encore ouvert. Cohérence graphique partielle, boss navigateur non atteint,
lecteur d'écran/grossissement et ressenti enfants non certifiés. Aucun nouveau
mode, lieu, mission, génération payante ou SDK. Suivis commerciaux séparés.

Les sections suivantes conservent l'historique des livraisons précédentes.

## Retour physique S24 — fiche trop grande, 0.34.1

Le parent confirme que le défilement fonctionne en 0.34.0, mais que la fiche
occupe trop de place. Correctif0.34.1/code43 : portrait 48 px, en-tête et fermeture
fixes, deux zones de lecture en petit paysage ; huit données conservées.
Reproduction812×375 avec marges24/32 : Massue319→259 px et 0→8 statistiques
complètement visibles, médecin282px. X et sélecteur48px. Petit568 : corps
défilant, un peu plus haut qu’avant ; ordinateur inchangé.

Conseil six personas terminé ; défaut clavier du nouveau corps reproduit et
corrigé par région focalisable/focus visible. Verify441/441, navigateur,
interface 24, audit 13, enfant 6 formats et recette 16 cas+6 contrôles verts.
APK normal, même identité/certificat,30fichiers web identiques au build.
**Site publié0.34.1/Sites20**, HTTP200, fiche huit champs vérifiée en ligne et
HTML/JS/CSS identiques. Les marges simulées ne constituent pas un test physique
du nouvel APK. L’accueil et les reprises ne changent pas.
[Bilan](BILAN-0.34.1.md), [conseil](CONSEIL-0.34.1.md),
[reçu](../reports/deployment-0.34.1.json). Branche/PR privées synchronisées sans
fusion ; test réel S24 et lisibilité des portraits/textes restent à confirmer.

## Point graphique3 demandé — 9 novembre2026

**0.34.0/code42 livré côté application** : les fonds fournis crue/marais sont
utilisés en cadres périphériques des terrains existants, le centre sculpté reste
calme. Pavés en relief mat, surfaces papier des renforts, ruisseau sans accessoires
flottants. Aucun nouveau lieu, météo, obstacle ou règle. Tous les originaux conservés.
Les sprites restent ceux du jeu : aucune harmonisation intégrale prétendue.

Conseil après le lot : trois techniques et trois profils6/9/12ans simulés. Deux
limites visuelles héritées corrigées après reproduction : indisponibilité des
cartes/pots sur tactile, et contours des camps absents dans Canvas. Les nouvelles
petites silhouettes sont partagées et libérées, sans coût nouveau en WebGL.

**441 tests**, navigateur, interface 24, audit 13, six formats enfant, défilement,
hors ligne10,14paires d’états identiques et 8 contrôles de chargement/états verts.
APK normal avec même certificat/identité,30fichiers web identiques au build validé.
[Bilan](BILAN-0.34.0.md), [conseil](CONSEIL-0.34.0.md),
[preuves](../reports/suivi-0.34.0/verification.json).
**Site publié en 0.34.0, Sites 19**, audience publique conservée.
[Reçu](../reports/deployment-0.34.0.json) : HTTP200, démarrage vague 1, aide, pause
et rotation contrôlés à 1280×800,812×375 et 375×812. Aucun cadre téléchargé à
l’accueil ; un seul cadre utile demandé au lancement. HTML/JS/CSS en ligne
identiques au build validé. Plateau mobile87,20% de la hauteur, dimensions inchangées.
Branche GitHub et PR existante synchronisées à la clôture, sans fusion dans main.
Essai physique S24/enfants toujours à faire ; langues et commercial restent séparés.

## Reprise autonome — 9 novembre 2026

Le parent demande de poursuivre le plan pendant son absence, de régler les
choix ordinaires en autonomie et de faire un conseil après chaque lot avec
**trois personas techniques et trois profils cibles**. Ce nouveau mandat
remplace les STOP intermédiaires ci-dessous pour les travaux réversibles non
critiques, pas pour l'identité définitive, l'argent, la pub ou les règles à
valider avec le fils. Les anciens bilans et constats restent conservés.

[Conception bornée](superpowers/specs/2026-11-09-parcours-enfant-design.md),
[plan d'exécution](superpowers/plans/2026-11-09-parcours-enfant.md).
Les avis du conseil sont des simulations de conception, jamais des observations
d'enfants réels ni une recette Android physique.

1. **Lot A — outils compréhensibles, livré** : aide illustrée volontaire,
   conseils selon l'état réel et texte d'entraînement exact. Aucun nouvel outil,
   verrou, prix ou bonus. Version 0.33.0,434 tests et recettes vertes.
   [Bilan](BILAN-0.33.0.md), [conseil six personas](CONSEIL-0.33.0.md).
2. **Lot B — progression illustrée, livré** : chemin des six missions existantes,
   états issus de la vraie progression, esprit pâte à modeler / papier mâché.
   Même Jouer/reprise, aucune mission ou récompense supplémentaire. Version 0.33.1,
   438tests,16cas de parcours et 4 096profils de progression vérifiés.
   [Bilan](BILAN-0.33.1.md), [conseil six personas](CONSEIL-0.33.1.md).
3. **Lot C — transitions et livraison, terminé côté application** : interruptions,
   aide, sélections, reprise et hors ligne vérifiés ; APK normal assemblé et inspecté.
   438 tests, 28 fichiers web identiques dans l’APK, même certificat et identité.
   [Bilan de livraison](BILAN-LIVRAISON-0.33.1.md),
   [conseil six personas](CONSEIL-LIVRAISON-0.33.1.md).
   Synchronisation web consignée dans le reçu de publication distinct.

Restent distincts : test physique S24, langues relues, nouveaux lieux, extension
de campagne, Facile et appel anticipé, choix du package, produits/prix,
confirmation Familles, SDK et GO de publicité. Aucun de ces points n'est déclaré
terminé par les lots A/B/C et aucun appel payant n'est lancé.

## Couverture des lots de l’audit après cette livraison

| Lot                | État applicatif honnête                                                 | Reste distinct                                                                        |
| ------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 1 — affichage      | Corrections livrées et recettes automatiques vertes                     | Dernier APK à revoir sur le vrai S24                                                  |
| 4 — Android        | Identité/signature préservées, APK normal et interruptions automatisées | Mise à jour avec camp réel, gestes système, FPS/RAM et cycle de vie physique          |
| 3 — plateau        | Corrections conservées, pavés mats et cadres fournis intégrés           | Matière des bordures encore partiellement picturale                                   |
| 2 — lisibilité     | Rôles/portées, soins et résultats clarifiés en 0.35.0                   | Compréhension des enfants et harmonisation complète des unités non attestées          |
| 7 — accompagnement | Signaux existants conservés, explications des vrais outils livrées      | Aucun mode Facile, appel anticipé ou nouveau verrou de progression appliqué           |
| 8 — monétisation   | V1 documentaire côté client seulement                                   | Choix produits/prix, confirmation Familles exacte, SDK, consentements et GO distincts |
| 9 — identité/store | Icône native, accueil et favicon réutilisent la ressource retenue       | AppID définitif, AAB, compte/test fermé, déclarations et publication Play             |
| 5 — langues        | FR/EN applicatif livré en 0.35.0 ; Snake Attack TD en anglais           | Relecture humaine anglaise et essai S24, autres langues non engagées                  |
| 6 — lieux          | Originaux conservés, deux exports en cadres périphériques               | Aucun nouveau lieu, météo ou règle ; test familial du rendu à faire                   |

La direction pâte à modeler / papier mâché de l’icône fait référence pour la
suite. Cette livraison ne prétend pas avoir redessiné tous les personnages.
Aucune décision critique nouvelle n’a été prise pendant l’absence du parent.

## Publication précédente — v0.33.1

**9 novembre 2026, Europe/Zurich : site publié en 0.33.1**, version Sites 18,
même URL et audience publique. [Reçu](../reports/deployment-0.33.1.json).
Recette réelle en ligne : HTTP200, icône, prochaine mission, démarrage vague 1,
quatre favoris, aide et une seule pause HTML à 1280×800 et 812×375 tactile.
À 375×812 tactile, écran de rotation visible. Aucune erreur JavaScript.
Plateau paysage580,13×326,98px :87,20% de la hauteur et 71,44% de la largeur.
HTML, JS jeu et CSS comparés octet par octet via lecture réseau brute en navigateur,
identiques au build validé. Les 28 fichiers du dist poussé sont identiques à l’APK.

La recette en ligne utilise des contextes isolés et ne touche pas aux sauvegardes
du parent. Ni publication Google Play, ni SDK, pub ou achat activés.

## Publication web demandée après l'étape 4

**9 novembre 2026, Europe/Zurich : site publié en 0.32.4**, version Sites 17,
même URL et audience publique conservée. [Reçu](../reports/deployment-0.32.4.json).
Contrôle en ligne dans Chromium : HTTP200 et marqueurv0.32.4 ; démarrage d'une
mission puis de la vague 1, quatre favoris, aucune erreur JavaScript à 1280×800
et 812×375 tactile. Plateau mobile580,13×326,98px, soit 87,20% de la hauteur.

Les 27 fichiers web publiés sont identiques à ceux de l'APK 0.32.4 contrôlé.
Les changements0.32.4 concernent l'icône native Android et les documents ; la
publication web synchronise la version, sans nouvelle refonte du plateau.
Le GO de publication ne déclenche ni achat, ni pub, ni nouvelle intégration.
Choix d'identifiant et portes commerciales restent ouverts.

## Mission active — Suivi v0.32.1, étape 4 documentaire

**8 novembre 2026 — étape 4 documentaire livrée après GO explicite ; STOP.**

La v1 prévoit validation et acknowledge des achats dans l'app, relecture Play
au démarrage/reprise et dernier droit connu hors ligne ; serveur de reçus
facultatif ultérieur. [Document révisé](publication/MONETISATION.md),
[confidentialité](publication/CONFIDENTIALITE.md),
[Sécurité des données](publication/SECURITE-DES-DONNEES-V1.md),
[sources et limites](publication/sources-etape-4.json).
Candidat publicitaire25.5.0 : existence confirmée, liste Familles par plage,
mais confirmation individuelle ouverte ; pont et transitives non choisis.
La fiche de divulgation décrit25.5.0, à confronter au trafic en mode enfant.
**Aucune pub pendant le test fermé avant visualisation sur S24 et GO du parent.**
Le préflight historique garde son blocage backend : adapter sur GO d'intégration,
sans faux drapeau validé. [Bilan étape4](BILAN-0.32.4-etape-4.md).

Aucun code ou SDK modifié à l'étape 4, pas de version nouvelle ; APK0.32.4/code39
et site 0.32.3 alors conservés. La publication web0.32.4 est intervenue ensuite,
sur demande distincte ci-dessus. Le GO documentaire ne choisit pas l'identifiant encore attendu et
n'autorise ni achat, ni déclaration, ni publication. **STOP après l'étape 4,
tout travail d'intégration exige un nouveau GO.**
Vérifications de cette étape :425/425, build et navigateur verts ; dix contrôles
de sources/formulation et relecture indépendante, précision sur les remboursements
corrigée. Aucun essai commercial ou test publicitaire physique effectué.

### Livraison de l'étape 3 — identifiant toujours à choisir

APK **0.32.4/code39** : icône Magnific retenue exportée localement, fond uni,
coins blancs supprimés, cinq densités, versions adaptatives26/33 et monochrome.
Original conservé, aucun appel de génération. Identifiant/namespace/certificat
actuels conservés, aucun nouvel identifiant appliqué. [Trois propositions](IDENTIFIANTS-APPLICATION.md).
425 tests et build verts ; navigateur ordinateur/mobile et tablettes vert ;
20 PNG, quatre XML compilés et 27 fichiers web de l'APK vérifiés. Les aperçus ne
sont pas des captures de lanceur Android : test visuel sur le S24 encore attendu.
[Reçu](../reports/suivi-0.32.4/verification.json), [bilan](BILAN-0.32.4.md).
À l'issue de l'étape 3, le site restait en 0.32.3 ; publication0.32.4 demandée ensuite.

### Direction artistique confirmée après l'étape 3

Le 8 novembre 2026, le parent demande que **l'icône fasse foi pour tout le
projet**, avec son aspect **pâte à modeler et papier mâché**. Cette référence
guide désormais personnages, décors et interface des prochains lots.
[Décision dans GAME_DESIGN](../GAME_DESIGN.md#direction-artistique) ;
[source conservée](resources-2026-11/assets/icone-source.png).
Consignation documentaire uniquement : aucun asset ou écran modifié, aucune
génération lancée. L'harmonisation du jeu reste à réaliser dans des lots
ultérieurs autorisés. Cette validation artistique ne choisit pas l'identifiant
d'application. Le GO pour l'étape 4 a été donné séparément ensuite.

### Livraison précédente 0.32.3 et publication

Publication demandée ensuite par le parent (« met a jours le site ») et réalisée
le 8 novembre : site public en **0.32.3**, version Sites 16, même URL et audience.
Vérification réelle dans Chromium : HTTP200, marqueur v0.32.3, lancement de la
mission, quatre favoris et plateau 1065,95×600,81 ; zéro erreur JavaScript.
[Reçu de publication](../reports/deployment-0.32.3.json).
Le parent a ensuite autorisé explicitement l'étape 3, puis l'étape 4 documentaire.

0.32.3/code 38 : 24 chaînes sources au vouvoiement corrigées, plus une phrase de
vocabulaire ; childCopy supprimé entièrement. Les messages de reprise sont
reconstruits par le chargeur, sans changer le format des camps. 425 tests et
build verts ; navigateur, audit 13/13, six formats mobiles, présentation 14 cas,
interface 24/24, départs, prévision et hors ligne verts. Sur 24 départs :
3 212 états identiques avant/après (hors message humain) et 119 camps strictement
identiques, octet pour octet. [Bilan de l'étape 2](BILAN-0.32.3.md).
Aucun changement de règle ni d'ancien code. Cet ancien STOP a été suivi du GO explicite pour l'étape 3.

### Livraison précédente 0.32.2 et retour du parent

Retour du parent : « fluide a mon niveau su s24 ». Observation qualitative sur
appareil réel ; aucune mesure FPS/RAM ni validation globale des interactions
n'en est déduite. [Retour consigné](../reports/suivi-0.32.2/retour-parent-s24.json).

APK 0.32.2/code 37 compilé, identifiant et certificat debug conservés.
Recette : 423 tests natifs, interface 24/24, audit 13/13, child-mobile six formats,
défilement cinq formats + ordinateur, hors ligne dix contrôles (anciens camps
1 à 7), interruptions onze scénarios : tous verts. Plateau à 1280×800 :
1065,95×600,81 px, soit +75,52 px de hauteur ; les 150 px entiers ne sont pas
récupérés. [Reçu](../reports/suivi-0.32.2/verification.json). Aucun
changement de règles ou de sauvegarde. À cette livraison précédente, le site
était encore en 0.32.1 ; publication0.32.3 réalisée ensuite comme indiqué ci-dessus. [Bilan de l'étape 1](BILAN-0.32.2.md).

Les cinq constats ci-dessous décrivent la baseline 0.32.1, conservée avec ses
preuves. Les correctifs 0.32.2 portent sur 1, 2 et 4 ; les textes sources (3)
sont corrigés à l'étape 2 terminée ; la facilité du tutoriel (5) ne change pas.
Référence : audit mis à jour sur `36305b8` / 0.32.1, uniquement sa section
« Suivi v0.32.1 ». [Source et empreinte](audit-source-2026-11/manifest-suivi-0.32.1.json).
AGENTS.md, GAME_DESIGN.md, ce plan et MONETISATION.md ont été lus avant analyse.
Le mandat autonome antérieur ne permet plus d'enchaîner : **un GO après chaque
étape**. [Bilan et preuves détaillées](BILAN-0.32.1.md#suivi-de-laudit--étape-0-du-8-novembre-2026).

| Constat du suivi                 | Contre-vérification                                                                                                                                                                                                                             | Preuve                                                                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — Catalogue ordinateur et vide | Confirmé : 10 cartes, 2 onglets, 1 filtre ; canvas 931,97 × 525,30 px à 1280 × 800 ; 157,70 px entre son bas et le bas de la fenêtre                                                                                                            | [Capture](captures-suivi-0.32.1-etape-0/combat-1280x800.png), [mesures](../reports/suivi-0.32.1-etape-0/geometries.json) ; src/style.css:300 et :3780                                                                      |
| 2 — Bandeau au-dessus de la voie | Confirmé avec nuance : chevauchement des rectangles avec le bord des puces sur 2,81 px ; les puces HTML restent devant. Le chemin pavé est couvert sur la géométrie 1, pas sur la géométrie 0 capturée ; ne pas généraliser à tous les terrains | [Capture vague 2](captures-suivi-0.32.1-etape-0/evenement-vague2-780x360.png) ; src/render/battleFeedback.ts:112, src/style.css:3713 ; [calcul des trois tracés](../reports/suivi-0.32.1-etape-0/contre-verification.json) |
| 3 — Tutoiement automatique       | Problème confirmé, décompte contesté : 21 chaînes dans les trois fichiers cités, et 2 supplémentaires dans checkpoints.ts:233 ; pas seulement 13                                                                                                | [Inventaire avec lignes](../reports/suivi-0.32.1-etape-0/textes-sources.json) ; src/ui/childCopy.ts:1                                                                                                                      |
| 4 — Trait blanc du héros         | Confirmé : pixels déjà présents dans l'atlas du héros, pas un trait CSS ni une barre système Android                                                                                                                                            | [Recadrage](captures-suivi-0.32.1-etape-0/heros-1280x800.png) ; src/art.ts:47 et :94, src/ui/menu.ts:120 ; atlas allies-front.webp                                                                                         |
| 5 — Victoire sans recrutement    | Exemple reproduit : code REFUGE-2-FZZZ-ZZR4-9F, 2 étoiles sans recrue, 3 avec un archer. Résultat variable selon le départ ; 12 simulations, toutes gagnées. Aucun rééquilibrage demandé ni réalisé                                             | [Observations et méthode](../reports/suivi-0.32.1-etape-0/refuge-observations.json)                                                                                                                                        |

### Ordre imposé, avec arrêt à chaque étape

0. **Contre-vérification, documents et captures uniquement : réalisée.** Aucun
   changement de code applicatif, de version, de sauvegarde ou de publication.
   Vérifications : verify 423/423, navigateur ordinateur/mobile, audit 13/13,
   child-mobile six formats sans erreur. GO reçu pour l’étape 1.
1. **0.32.2 — correctifs d'interface**, réalisée : même dock sur ordinateur
   (4 favoris, 2 miels, Tous les alliés), plateau agrandi sans défilement ; annonces
   sur une ligne dans le HUD ou au bas du plateau, sans couvrir voie/pastilles ;
   suppression du trait blanc existant. Conserver proportions et coordonnées du
   plateau : un dock latéral rétréci ne suffira pas forcément à récupérer les
   150 px entiers. Comparer la hauteur utile et annoncer le gain réel.
   Recette : npm run verify, test:browser, test:audit, test:child-mobile ; captures
   avant/après 1280×800, 1366×768 et 780×360 tactile ; dimensions avant/après ;
   npm run android:apk:debug. **STOP : test de l'APK par le parent sur S24.**
2. **0.32.3 — textes sources au tutoiement**, réalisée : reprendre l'inventaire
   complet, y compris les messages reconstruits lors d'une reprise ; enlever la
   réécriture childCopy ou justifier strictement un éventuel reste de compatibilité.
   Expliquer chaque instantané modifié, ajouter le contrôle d'absence de
   « vous / votre / vos » dans src/ et index.html ; vérifier mêmes parties pour
   mêmes codes, anciens formats et tous les tests. **STOP pour accord du parent avant l'étape 3.**
3. **0.32.4 — icône et identité**, réalisée pour l'icône, propositions en attente du parent : source Magnific retenue dans
   docs/resources-2026-11, sans génération payante ; icône adaptative, fond uni,
   coins blancs supprimés ; vérifier l'icône de l'APK debug. Proposer trois
   identifiants définitifs avec avantages/inconvénients, **n'en appliquer aucun**.
   Conserver l'identifiant courant et les sauvegardes. **STOP : choix du parent.**
4. **Monétisation v1 sans serveur — documents seulement**, GO explicite reçu :
   achats non consommables vérifiés et confirmés dans l'app, acknowledge client,
   droits relus au démarrage, dernier droit connu hors ligne ; serveur de reçus
   facultatif plus tard. Documenter INTERNET, SDK Familles dans sa version exacte
   vérifiée, configuration enfant avant requête, brouillons confidentialité et
   Sécurité des données. « Aucune collecte » ne décrit pas une version avec pub.
   **Aucune pub pendant le test fermé avant observation par le parent sur S24.**
   Documents révisés, aucun SDK/achat intégré. Confirmation individuelle du SDK,
   pont et recette physique restent ouverts. **STOP après le bilan.**

À chaque étape : tableau fait/pas fait/preuve, commandes et nombres, limites et
arbitrages, bilan de version et ce plan à jour. Aucun changement de règles, aucun
Math.random ajouté dans les règles ; séparation moteur/rendu/interface, sauvegardes
et anciens codes préservés. Aucun appel anticipé, mode Facile, extension de
campagne, renommage, lot 5 (langues) ou lot 6 (lieux). Aucun appel de génération
payante, achat ou intégration de SDK publicitaire dans cette mission.

Les priorités et lots ci-dessous sont **l'historique conservé**, pas un mandat
pour dépasser les quatre étapes ou leurs STOP. Les documents de monétisation
ont été révisés à l'étape 4 : serveur optionnel et compte Play créé, identité en
attente selon le dernier retour. Champs JSON et outils historiques restent
bloqués et seront adaptés seulement avec une future intégration autorisée.

## Historique conservé des lots et décisions

Suivi rectifié le 8 novembre 2026, après comparaison complète avec l'audit fourni.
Les décisions explicites du parent priment sur ses recommandations. Le gameplay
vient du fils et reste préservé. [Analyse et preuves](RECONCILIATION-AUDIT-0.30.2.md) ;
[sources originales archivées](audit-source-2026-11/README.md).

Les anciennes mentions « lots 2 et 7 livrés » résumaient trop largement des
livraisons partielles. Le changement de priorité ne supprime plus leurs
sous-parties restantes. Les bilans historiques sont conservés.

Suite autorisée par « Continue » : 0.31.0 réalise les quatre raccourcis mobiles,
le miel au toucher des chemins et une passe de vocabulaire/tutoiement. Cette
version d'interface ne réalise pas le lot 8 malgré son numéro indicatif d'origine.
Les lots 2 et 7 restent partiels. Voir [BILAN-0.31.md](BILAN-0.31.md).

GO suivant : 0.32.0 illustre la préparation et les dangers de vague, sans
annoncer de répartition par voie. Voir [BILAN-0.32.md](BILAN-0.32.md).

| Lot                           | État réel                                                                                     | Prochaine condition                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1 — Affichage                 | Réalisé 0.27, complété par 0.30.1 ; audit actuel 13/13 sur sa portée                          | Retours appareils réels ; ne pas confondre avec toute l'accessibilité           |
| 4 — Android réel              | Partiel : APK et diagnostic ; interruptions 0.30.2 et fichiers embarqués testés en navigateur | Relevés mission 6/classique 12, FPS/RAM et cycle de vie physiques               |
| 3 — Plateau                   | Réalisé 0.28 : raccords et halos ; nouveaux fonds non intégrés                                | Préserver géométrie et lisibilité                                               |
| 2 — Lisibilité                | Partiel ; 0.31 livre quatre raccourcis, miel au toucher, vocabulaire et tutoiement            | Apprentissage des outils, accueil illustré ; essais sans lecture                |
| 7 — Tutoriel, signaux, Facile | Tutoriel et dock de quatre alliés réalisés ; lot complet partiel                              | Prévision réalisée 0.32 ; appel anticipé/bonus et Facile restent distincts      |
| 8 — Monétisation              | Nouveau modèle et cadence validés, dossier et contrôles préparés                              | Comptes, prix/produits, SDK enfant, accès parents, reçus et achats de test      |
| 9 — Store                     | Fiches brouillon, sept captures/banner et préflight préparés                                  | Identité/package, icône finale, confidentialité du SDK, IARC, AAB et test fermé |
| 5 — Langues                   | Fiches store FR/EN/DE/IT en brouillon ; application toujours en français                      | Traduction du jeu et relecture après stabilisation                              |
| 6 — Lieux/événements          | Crue/marais HD conservés ; aucune nouvelle mécanique appliquée                                | Après sortie, validation du marais et des règles avec le fils                   |

Correctif 0.32.1 : le catalogue compact possède une seule zone de défilement ;
les vrais balayages sur les cartes sont désormais testés.
Voir [BILAN-0.32.1.md](BILAN-0.32.1.md).

## Nouvelle décision commerciale

Le parent choisit le **jeu gratuit avec publicité rare, suppression des pubs
payante et cosmétiques sans avantage au combat**. Cadence explicitement validée :
au plus une pub entre missions par dix minutes, après au moins deux missions,
jamais pendant une vague. Le développeur propose une première période de grâce
et l'exclusion des défaites, réessais et classique pour réduire les interruptions.

Cela remplace la proposition d'achat de déblocage et de restriction des missions
dans le lot 8 fourni. L'ancienne hypothèse 3,99 € / 4 CHF ne fixe pas le nouveau tarif.
Le compte Play personnel est créé, validation d'identité en attente. Les SDK
commerciaux ne sont pas intégrés à l'APK 0.30.2 ; l'outil de préparation doit
montrer cet état sans faux GO.

## Sous-parties à ne plus perdre dans les résumés

| Point d'origine                                   | État réel                                                                                                | Condition suivante                                                                                           |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Lot 2 : tutoiement et vocabulaire                 | Passe réalisée 0.31 : début de vague, aide, messages et fiches ; données historiques inchangées          | Continuer les contrôles des états et préparer la future extraction des textes                                |
| Lot 2 : préparation illustrée                     | Réalisée 0.32 : carte illustrée, vrais tracés, portraits des dangers et conseil disponible               | Tester la compréhension sans lecture ; accueil illustré encore distinct                                      |
| Lot 2 : miel en icônes puis toucher une voie      | Réalisé 0.31 : deux pots dans le dock, chemins surlignés, refus sans dépense ; boutons clavier conservés | Essai tactile avec les enfants                                                                               |
| Lot 2 : miel2, Encourager3, Réparer4, héros5      | Non implémenté, disponibilité explicitement réservée                                                     | Parent/fils : masquer les outils ou préférer des explications progressives                                   |
| Lot 7 : trois voies visibles, fronts centre→2→3   | Réalisé et approuvé ; anciens codes conservent leurs règles                                              | Préserver ce choix, ne pas revenir à une seule voie visible                                                  |
| Lot 7 : prévision des ennemis aux antres          | Réalisée 0.32 : espèces de vague, portraits aux antres ouverts et détails accessibles                    | Tester la compréhension : espèces possibles, aucune répartition adaptative promise                           |
| Lot 7 : appel anticipé et bonus                   | Non réalisé, règle non validée                                                                           | Reconception nécessaire : préparation actuellement sans décompte ; ne pas inventer une urgence implicitement |
| Lot 7 : Facile en pause, mémorisé                 | Non réalisé, valeurs non validées                                                                        | Proposition au parent/fils, migrations et comparaison sur six missions                                       |
| Lot 7 : dock de quatre alliés permanent           | Réalisé 0.31 selon les favoris déverrouillés ; catalogue complet dans la même colonne                    | Retester sur le S24, notamment les petits noms et le confort de sélection                                    |
| Maquette accueil : chemin de progression illustré | Non réalisé comme la cible ; liste repliée et diorama actuels                                            | Choix d'interface à rendre explicite                                                                         |
| Lot 6 : crue/marais                               | PNG HD conservés, pas importés dans le runtime                                                           | Export/cadrage et intégration ; marais à valider ; après sortie selon ordre actuel                           |
| Lot 9 : icône pour l'application                  | Source HD de référence seulement ; launcher Capacitor encore présent                                     | Correction des coins blancs et exports store/Android, sans génération payante implicite                      |

## Recentrage application et ordre recommandé

Le parent recentre le travail sur le jeu pendant la validation de son identité.
La 0.30.2 consolide le lot 4 : les pauses temporaires ne peuvent plus effacer une
interruption ; les formats de camp 1 à 7 et les trois chapitres sont contrôlés
depuis les fichiers embarqués, réseau coupé dans Chromium. Ce n'est pas un test
Android physique ni un cache hors ligne du site web.

L'annonce « langues ensuite parce que les lots précédents sont livrés » était
trop rapide. L'ordre ci-dessous est une **recommandation issue de l'analyse**,
pas une validation de nouvelles règles :

1. Finir le parcours enfant/mobile et cadrer les restes des lots 2/7 ; retest du
   S24 en parallèle. La prévision 0.32 reste distincte d'un bonus économique.
2. Cadrer l'extension de campagne demandée historiquement : les six missions
   font 19 vagues locales et s'arrêtent au rang 8 ; Tank et boss restent dans
   le classique. Les 18 configurations par mission ne sont pas 18 niveaux.
3. Exploiter les ressources : icône de l'application et, si nouvel arbitrage,
   variantes visuelles crue/marais séparées de la météo. Leur report après sortie
   reste la décision en vigueur tant qu'elle n'est pas modifiée.
4. Lot 5 — FR/EN/DE/IT après stabilisation des parcours/textes. Extraction
   technique possible en parallèle ; traductions à relire humainement. Préserver
   identifiants, codes, sauvegardes et personnages du fils.

Les lots 8/9 restent en attente des décisions/comptes et ne bloquent pas le jeu.
Le dossier de publication et ses captures restent un instantané de la 0.30.1,
pas une preuve de validation de la 0.30.2. Ils seront actualisés lors du retour
au travail de publication. Les données des futurs SDK imposeront une politique
exacte ; ne pas réutiliser « aucune collecte » pour une version publicitaire.

## Preuves actuelles et limites

Application/APK et site public 0.32.1, dossier Play
0.30.1 historique. Suite locale de cette livraison :
423 tests natifs verts ; livraison et preuves dans son bilan. La [CI GitHub 42494670333](https://github.com/zyclope0/snakeattak/actions/runs/42494670333)
reste une preuve du code 0.30.2 `a57b05a` (400 tests), distincte de cette recette.
Audit strict actuel 13/13 ; cela ne couvre ni tout le lot 7, ni compréhension sans
lecture, ni FPS Android physique. Le rapprochement d'audit reste historique ;
la livraison d'interface 0.31 ne change aucune règle.
