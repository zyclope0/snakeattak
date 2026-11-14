# Plan actuel — 0.38.0, livraison Android build58

## Livraison actuelle — 0.38.0, Android build58, Sites33 publiée

Source figée : `d3e3e02251a29337002b34899bd432ac8b4c24d7`, issue de main `21f0feb` (PR40/PR41 de Claude).
Carnet et préparation simplifiés, cinq bulles d’aide FR/EN, correction du bouclier.
Anciens carnets multiples et codes de départ conservés ; règles et sauvegardes inchangées.
`npm run verify` : **601 tests** verts ; navigateur, audit13/13, menus2261, caprices et traduction verts.
AAB58 signé avec la clé d’envoi d’origine, APK debug séparé. Site publié et contrôlé sur cinq formats,
112 fichiers identiques aux paquets, carnet/préparation FR/EN, audio et démarrages APK hors ligne vérifiés.
[Bilan](BILAN-0.38.0.md), [Android](ANDROID.md). L’import de l’AAB58 dans le canal interne reste au parent.
Livraison précédente : [build57 / Sites32](archive/BILAN-0.38.0-build57.md).

## Nettoyage du code — 13 novembre, après le build58

Demande du parent : code mort, répétitions, fonctions-fleuves. Aucun changement de
comportement ; rien n'est publié tant que Codex n'a pas fait un nouveau build.
Fusionné dans `main` : code mort (PR44), fonctions communes, son et rendu (PR45), styles
(PR46), interface (PR47). Moteur de règles et lecteurs de sauvegardes : PR48, proposés après
l'accord du parent du 13 novembre.
`npm run verify` : **645 tests** verts ; les 16 étapes navigateur de la CI vertes.
Détail, preuves, limites et liste de ce qui est encore écrit en dur (trois chapitres, trois
voies, douze vagues) : [bilan du nettoyage](BILAN-NETTOYAGE-2026-11.md).
Non vérifié : vrai téléphone, APK, enfants.

## Suivi visuel de 0.38.0

Relevé par Codex : le bouclier se tournait un instant vers l'allié protégé lors d'un blocage,
parce que l'effet `block` vise cet allié. Corrigé dans le lot « simplifier » : un blocage ne
change plus le côté affiché. Affichage seulement, la protection n'a jamais été touchée.

## Retour du parent, 13 novembre — « court et peu rejouable »

**Rejouer avec un caprice : développé, en attente de l'accord du parent sur captures.** Rien
n'est fusionné ni publié ; la version reste 0.38.0. Les 36 caprices et leur carnet existaient
mais ne se voyaient pas. Ils se voient maintenant à trois endroits, sans toucher à une règle,
à l'équilibrage ni à la sauvegarde (on lit les étoiles et le carnet, on n'écrit rien) :

- Carte de mission : six places d'autocollants sous les étoiles, pleines pour les caprices
  réussis, dès que la mission est jouable.
- Fin de mission gagnée : « Il te reste 4 autocollants à gagner ici. » et le bouton « Rejouer
  avec un caprice » (« Un autre caprice » après un caprice), qui ouvre la préparation de la
  même mission sur ses caprices ; un caprice déjà réussi y dit « ✓ Gagné ». Sans caprice
  ouvert à gagner, la phrase dit quelles étoiles ouvrent la suite.
- Accueil, les six missions gagnées : le bouton principal devient « Jouer un caprice » et sa
  phrase compte les autocollants qui restent. Une mission qui vient d'être gagnée ne demande
  plus à être reprise.

Vérifié : `npm run verify` (653 tests), la série navigateur de la CI, menus 4925 dont 1113
pour ce lot, en français et en anglais ; captures hors dépôt. Non essayé sur un vrai
téléphone ni avec les enfants. À décider par le parent : après la fermeture du jeu, une
mission terminée laisse son dernier camp et l'accueil dit encore « Reprendre » ; le
distinguer demanderait une donnée de plus dans la sauvegarde. Détail dans
[Architecture](ARCHITECTURE.md), section « Rejouer avec un caprice ».

## Essai du parent sur téléphone, 13 novembre — décisions et idées notées

Décisions du lot « simplifier », publiées dans le build58 / Sites33 :

- Le son démarre au premier toucher de l'écran, sur le site comme dans l'application : c'est
  voulu, on ne change rien.
- On ne peut plus créer ni renommer de carnet de caprices. Un seul carnet par défaut ; une
  sauvegarde qui en a déjà plusieurs les garde et peut encore en changer.
- L'onglet « Copains » de la préparation se cache quand il n'a rien à proposer.
- Le code de départ n'est plus montré dans la préparation. Les anciens codes restent
  acceptés sur la page des parents.
- Le carnet dit en une phrase à quoi il sert ; ses boutons parlent de pages, pas de missions.
- Cinq petits « ? » à toucher ouvrent une bulle de deux ou trois phrases : caprices, repérage
  et « Autre départ » dans la préparation, sauvegarde familiale et code de départ chez les
  parents (`src/ui/helpBubble.ts`, textes dans `src/ui/helpTopics.ts`).

Idées du parent, à instruire avant tout développement :

- **Profils locaux, décidés par le parent sur maquette le 13 novembre — développés, en
  attente de son accord sur captures.** Sur un appareil partagé, chaque enfant a son joueur :
  un personnage du jeu et, s'il le veut, un surnom. Quatre joueurs au plus ; deux joueurs
  peuvent prendre le même personnage. Au premier lancement, le joueur par défaut est le Héros
  et l'enfant joue tout de suite. « Qui joue ? » ne s'affiche à l'ouverture que s'il y a au
  moins deux joueurs. Une pastille en haut de l'accueil dit « Ajouter un joueur ». Les
  étoiles, le carnet, les favoris, la mission en cours et l'aventure classique suivent le
  joueur ; le son et la langue restent ceux de l'appareil. Tout reste sur l'appareil, sans
  compte. La sauvegarde d'aujourd'hui est le premier joueur, sans conversion : les autres
  joueurs utilisent les mêmes clés avec un suffixe (`src/players.ts`). Supprimer un joueur
  se fait chez les parents, avec confirmation.
- **Connexion Google ou Facebook.** Le parent y voit de quoi garder les profils et retrouver
  la progression. Ce que disent les règles lues le 13 novembre (à relire sur les pages
  officielles avant de décider, elles changent) : une application destinée d'abord aux
  enfants ne doit utiliser ni la connexion Google ni Play Jeux ; une application « tous
  publics » peut les proposer en option, sans les exiger ; Meta interdit sa plateforme aux
  applications pour les moins de 13 ans sauf accord particulier. Un compte, même minimal,
  est une donnée personnelle : politique de confidentialité, fiche « Sécurité des données »
  de Play, consentement d'un parent. Piste compatible avec les règles du projet : des
  profils locaux sans compte, et plus tard une sauvegarde réservée au parent.
- **Terrains plus variés.** Croisements différents, quatre routes, tirage plus aléatoire. À
  voir avec le fils : ses règles demandent au moins trois voies reliées.

## Livraison précédente — 0.37.0, Android build56, Sites31 publiée

Source figée : `f04f3d5fb1df8f53db9f72dbd9a64a373b50a735`, main `34be40e` (PR32 et PR33).
Accueil illustré, refuge et objets sur les boutons, réglages dégagés et pause restaurée
pendant le clic de fermeture. Espacements complétés par Codex pour garder le nom de la
prochaine mission visible sur écran bas FR/EN, cibles tactiles48px conservées.
Version **0.37.0**, code **56**, même package et clé d’envoi Play. Aucune règle ou sauvegarde changée.
`npm run verify` : **584 tests** verts. Navigateur, audit13/13 et menus758 verts sur le code final ; réglages de rendu verts.
Site contrôlé sur cinq formats, légende de mission FR/EN et cibles48px vérifiées ;
83 fichiers publics identiques aux paquets, audio/retour de pause et démarrages APK hors ligne verts.
[Bilan du build56](archive/BILAN-0.37.0-build56.md) et [Android](ANDROID.md). Le parent importera l’AAB56 dans le canal interne existant.

## Livraison précédente — Android build55, Sites30 publiée

Source figée : `07290c73ea6b4a5dad78b83585801607d922ab1f`, main `4e27314` (PR30 de Claude).
Plateau net à la résolution de l’écran, figurines et liserés fins, marche/ondulation selon la
distance, priorité aux poses d’attaque et garde-fou du cache de terrain. Même version affichée
**0.37.0**, code Android **55**, package et clé d’envoi Play conservés. Aucune règle ou sauvegarde changée.
`npm run verify` : **584 tests** verts ; CI du main source verte. AAB signé et validé, APK debug prêt.
Navigateur, audit13/13, menus758, présentation14scènes, rendu et réglages verts.
DPR1/2/3 et repli Canvas vérifiés ; deux recettes anciennes de rendu actualisées.
Les73fichiers publics correspondent aux paquets ; audio en ligne et démarrages APK hors ligne FR/EN verts.
[Bilan du build55](archive/BILAN-0.37.0-build55.md) et [Android](ANDROID.md). L’import de l’AAB55 dans le canal interne reste au parent.

## Livraison précédente — Android build54, Sites29 publiée

Source figée : `d5e1d4767c5391a18022674c580b26a36c290217`, issue de main `eb37730` (PR23 à PR28).
Graphismes et poses d’attaque, effets visuels, barre mobile simplifiée, réglages regroupés,
son au premier appui et musiques lues en continu. Aucun changement de règles ou de sauvegardes.
Version affichée **0.37.0**, Android **54**, même package et clé d’envoi Play.
`npm run verify` : **565 tests** verts ; AAB signé/validé, APK debug prêt.
Navigateur, audit13/13, menus758, présentation14scènes, traduction496 et caprices294 verts.
Site publié et contrôlé sur quatre formats ; ses73fichiers correspondent aux paquets.
Audio en continu, réglages, démarrages APK hors ligne et30MP3 vérifiés.
[Bilan du build54](archive/BILAN-0.37.0-build54.md), [Android](ANDROID.md), [provenance des images](../public/assets/illustrated/PROVENANCE-RESTYLE-2026-11.md).
Le parent importera l’AAB54 dans le canal interne existant ; aucun envoi Console par Codex.

## Changements intégrés à0.38.0 — PR35, PR36 et correctif1d84cdc

- Carte des missions et préparation (inventaire du 13 novembre, choix du parent sur
  maquette) : un objet du jeu par mission (refuge, pont, serpent vif, œuf, serpent à
  sonnette, fougère), sur les cinq onglets et sur les repères Terrain, Attaques, Œufs.
  La roue des réglages et les commandes courantes (pause, flèches, croix, cadenas) restent.
- Carnet de caprices : vingt vignettes en pâte à modeler, une par nom de caprice (« La
  tempête » sert dans deux missions, les trois défis du créateur dans les six). Elles
  remplacent les dix-huit médaillons au trait dans le carnet, la préparation et le
  résultat ; une vignette pas encore gagnée reste pâle. Les noms et les annonces du fils ne
  changent pas. 1 083 crédits Magnific, accord du parent ; journal dans
  [PROVENANCE-VIGNETTES-2026-11.md](../public/assets/illustrated/PROVENANCE-VIGNETTES-2026-11.md).
  Le parent garde les serpents à bras de trois vignettes : « ça casse le côté tout identique ».
- Coup porté : le combattant garde le côté de son coup jusqu'à la fin du geste, même si les
  règles l'ont déjà retourné vers sa prochaine cible (`blowFacing`, affichage seulement).
- Préparation : chaque onglet part de la largeur de son mot ; plus de débordement mesuré en
  français ni en anglais, de 568×320 à 1920×1080.
- Passage à0.38.0 : appliqué par Codex avec le build57
  (`package.json`, `package-lock.json`, `versionName` Android, README, ANDROID.md, liste de
  `docs/README.md`). Bilan : [build57](archive/BILAN-0.38.0-build57.md).

Pas essayé : installation Android physique sur Galaxy S24, Safari, Firefox, les enfants.

## Changements intégrés au build56 — accueil plus habité (PR32 et PR33)

Demande du parent : l'accueil faisait vide, et le fond de l'image principale avait la même
couleur que le panneau.

- Derrière le serpent et l'épéiste : la forêt floue de l'illustration d'origine, avec une
  plante et des fougères du jeu au second plan. Les personnages restent ceux de l'icône
  (`icon-512.png` intacte, son fond uni retiré par un masque).
- Sur le panneau du titre : le refuge au cristal, choisi par le parent.
- Sur une fenêtre très haute, la carte garde ses proportions et les boutons la suivent.
- Boutons du bas : un petit objet du jeu remplace chaque pictogramme au trait (drapeau du
  refuge, médaillon à la feuille, visage du combattant à massue, roi à trois têtes,
  parchemin).
- Sur téléphone, le bouton des réglages tient dans l'en-tête et ne mord plus sur la carte.
- Images dérivées de celles du dépôt par `scripts/build-home-scene.py` : zéro crédit,
  environ 155 Ko de plus à l'accueil.

Pas essayé : installation Android physique sur Galaxy S24, Safari, Firefox, les enfants.

## Changements intégrés au build55 — netteté du plateau, liseré, marche (PR30)

Demande du parent après essai du site sur ordinateur : figurines floues et détourées trop fort,
personnages qui glissent, animations absentes à la première vague, combattant à massue blanc.

- Le plateau est dessiné aux pixels réels de l'écran (jusqu'à deux fois 1100×620) ; les règles
  et les coordonnées restent en 1100×620. Chaque figurine est réduite une fois à sa taille
  d'écran. « Effets légers » garde le plateau simple ; un garde-fou baisse la taille si
  l'appareil ne suit pas.
- Le contour vert foncé des alliés et rouge orangé des ennemis reste, en liseré fin et régulier.
- Marche façon pâte à modeler, calée sur la distance vraiment parcourue ; les serpents ondulent.
- Les poses d'attaque des combattants présents arrivent en premier : plus de première vague
  sans elles sur une connexion lente.
- Combattant à massue : même pose, peau beige comme les autres (166 crédits Magnific).

Vérifié : `npm run verify` (584 tests, empreintes de parties inchangées) et les 16 recettes de la CI.
Mesures d'images par seconde faites sans carte graphique (rendu logiciel) : elles ne disent
rien du vrai téléphone. Pas essayé : installation Android physique sur Galaxy S24, Safari, Firefox, les enfants.

## Livraison précédente — Sites28, Android build 53

Les PR20 et PR21 de Claude sont fusionnées : réglages musique/bruitages séparés et
mémorisés, reprise du son au toucher, fondu des musiques, résultat compact et dock
lisible (noms 13 px, prix 12 px). Codex élargit le panneau de résultat après partie
sur téléphone : la vraie victoire EN avec marges Android ne masque plus Rejouer.
Version **0.37.0**, Android **53**, package `com.conqueteserpents.famille` conservé.
Source des paquets : `d05782239d374e33e22cc0bba88ca632e4234e36`.
Vérifications fraîches : **554 tests**, navigateur, audit **13/13**, menus **758**,
**12 cas de résultats FR/EN** et une vraie victoire EN à 780×360 avec marges simulées.
Site publié ; AAB release signé et validé, APK debug conservé. L’envoi de l’AAB53 au
canal interne Play reste à faire par le parent. Le build52 fonctionne déjà en test interne.
[Bilan](BILAN-0.37.0.md), [Android](ANDROID.md) et [licences](AUDIO-LICENCES.md).

## À suivre, sans changement dans cette livraison

- Mission1 gagnable sans recrutement : mesure puis accord du fils et du parent avant toute règle.
- Poids mesuré le 12 novembre (transferts réels) : accueil 1,3 Mo, première mission 6,2 Mo,
  son 3,4 Mo, soit environ 11 Mo — et non 30 Mo comme l'annonçait l'audit, qui comptait deux
  fois les fichiers en cache. Pistes restantes : charger en arrière-plan les planches d'alliés
  non posés (2,7 Mo) ; image de l'accueil en WebP (350 → 50 Ko), à décider car la recette exige
  aujourd'hui l'icône Android à l'identique. « Dangers » encore dans la barre du haut.
- Test physique S24 : mise à jour vers Play58, son au retour dans l’application, fluidité,
  volumes et taille de police Android. Les marges et interruptions mesurées ici sont simulées.
- Continuer le test interne ; préparer le test fermé ensuite, sans pub ou achat activé.
- Les résultats longs de caprices restent défilables ; ne pas les annoncer sans défilement.

## Changements intégrés au build 54 (PR23 à PR28)

Sur téléphone couché, la barre du haut ne garde que pause, vitesse, « Dangers » et « Lancer la
vague » ; « Accueil » passe dans l'écran de pause et « Alliés » reste dans le dock (il revient
dans la barre sous 351 px de haut, où le dock n'a plus la place, et une fois la partie finie).
Le choix de la langue rejoint la fenêtre Réglages ; la langue de départ suit celle de
l'appareil (français, sinon anglais), comme avant.

Décision du parent le 12 novembre : le son est **activé au départ**, comme dans les jeux
mobiles (il démarre au premier appui ; un choix déjà enregistré est respecté). « Effets
légers » quitte le bas de l'aide pour la fenêtre Réglages, qui propose aussi « Comment jouer ».

Lot « vie » (code seul, aucune image nouvelle) : éclair et écrasement sur un combattant
touché, respiration des alliés au repos, pièce qui vole vers le compteur, poussière à la pose
d'un allié, éclats à l'éclosion, étoiles de victoire une à une, confettis, bilan de fin lisible
(13 px au moins), secousse à l'arrivée du roi. Tout est coupé par « Effets légers ».

Graphismes, 12 novembre : onze planches (alliés, serpents, forteresses, miels) refaites en
pâte à modeler plus vive avec la retouche Magnific, mêmes personnages, poses et couleurs.
Journal et identifiants : `public/assets/illustrated/PROVENANCE-RESTYLE-2026-11.md`.
À faire ensuite : accessoires de terrain et habillage de l'interface dans la même matière ;
vraies poses d'attaque : fait pour les neuf planches de personnages et de serpents (une
seconde image affichée 0,2 s au moment du coup, coupée par « Effets légers »).

Les musiques sont lues en continu par un élément audio au lieu d'être décodées en entier :
un morceau de trois minutes occupait plus de 100 Mo de mémoire. Elles démarrent sans attendre
la fin du téléchargement et s'arrêtent en arrière-plan.

## Livraison précédente — Sites27, Android build 52

Les PR17 et PR18 de Claude sont intégrées et publiées : lancement direct par Jouer,
actions agrandies et illustrées, bruitages et musiques choisis par le parent (Cozy Quest,
Pixabay et CC0). **30 fichiers audio, 7,25 Mo**, chargés après activation ; son coupé au départ.
Version **0.37.0**, Android **52**, même identifiant et certificat.
Source : `072855f90a961657d457671886222666182f5467`.
Vérifications : **552 tests**, menus **758**, audit **13/13**, navigateur et journey verts.
Les **64 fichiers publics** correspondent à l’APK ; les 30 MP3 se décodent ; activation,
musique des menus et de partie, coupure et démarrages hors ligne FR/EN contrôlés.
[Bilan](BILAN-0.37.0.md) et [licences](AUDIO-LICENCES.md). Essai physique et volumes sur S24 à confirmer.

## Livraison précédente — Sites26, Android build 51

Les PR14 et PR15 de Claude sont intégrées et publiées : pages de l’accueil et
principaux dialogues adaptatifs, marges Android prises en compte, cibles tactiles de 48 px.
Version **0.37.0** conservée ; APK **51**, même identifiant et certificat.
Source : `abe612370747bc51cc28da5a3d145f13e7846f45`.
Recette fraîche : **552 tests**, **750 contrôles de menus**, audit **13/13**, navigateur,
journey et deux démarrages hors ligne FR/EN verts. Site public contrôlé sur quatre
formats, dont deux avec marges système simulées ; ses **34 fichiers** correspondent à l’APK.
[Bilan court](BILAN-0.37.0.md). Essai physique S24, TalkBack et enfants encore à faire.

## Livraison précédente du 11 novembre — Sites25, Android build 50

Les changements de Claude jusqu’au merge `751dcf5` (PR8 à PR12) sont publiés.
Version visible **0.37.0** conservée ; Android **50**, même identifiant et certificat.
Source du paquet : `0dbc7cf53ddbdd82f9a7ba5af9d1a2efc8883f51`.
Vérifications fraîches : verify **552 tests**, menus **537 contrôles**, audit **13/13**,
navigateur et journey verts. Les **34 fichiers** du site public correspondent à l’APK ;
formats 1280×800 FR, 812×375 EN et 780×360 FR contrôlés, sans erreur JavaScript.
[Bilan court](BILAN-0.37.0.md). Aucun essai physique S24, TalkBack ou avec les enfants.
Les suites du chantier ci-dessous restent prévues ; cette livraison ne les réalise pas.

## Retour du téléphone sur le build 50 — pages de l'accueil adaptatives

Sur le Galaxy S24, le parent voyait encore Missions, Pour les parents et Aventure classique mal
affichées. Deux causes : le correctif de la PR nº 11 avait été mesuré sans les marges des
barres Android, et il reposait sur des seuils et des tailles en dur, réglés pour trois formats.

- **PR nº 14 (fusionnée)** : `src/ui/homePages.css` décrit Missions, Favoris, Aventure
  classique et Pour les parents dans une unité calculée d'après la place réelle.
- **Dialogues adaptatifs (PR nº 15, fusionnée)** : même méthode pour le carnet, la préparation, le
  catalogue, l'aide et les serpents annoncés (`src/ui/dialogPages.css`). Le carnet cassait à
  915×412 ; « C'est parti ! » de l'aide était hors écran sur téléphone ; une vingtaine de
  boutons faisaient moins de 48 px. Détail à la fin d'[ARCHITECTURE.md](ARCHITECTURE.md).
- **Jouer tout de suite (PR nº 17, fusionnée, décision du parent)** : le bouton principal de l'accueil
  lance la prochaine mission sans dialogue. La préparation (caprices, copains, repérage,
  options) reste sur la page Missions, bouton « Préparer ». Les trois boutons qui font avancer
  le jeu sont agrandis ; pendant une vague, le bouton de vitesse prend la place de « Lancer la
  vague » ; une image accompagne chaque destination de l'accueil et chaque vue de préparation
  (`src/ui/mainActions.css`).
- **Son (PR nº 18, fusionnée)** : les fichiers choisis par le parent sont publiés ; le son
  reste coupé au départ. Licences documentées dans AUDIO-LICENCES.md.
- **Pas vérifié sur le téléphone** : il faut un nouvel APK et une capture du parent. La taille
  de police agrandie dans les réglages Android n'est pas simulée.
- **Reste** : l'accueil et l'écran de jeu gardent leurs seuils ; les dialogues de lecture
  défilent.

## Remise en ordre — Claude Code, 11 novembre 2026

Trois objectifs du parent : moteur propre, interface stabilisée, projet nettoyé. Ordre retenu :
filet de tests, nettoyage, moteur, interface, conventions. Un lot par PR, sans changer une règle.

- **Lots 0 et 1 (PR nº 8, fusionnée).** Les recettes n'écrivent plus dans des fichiers suivis ;
  5 173 captures et gros rapports sortent du suivi Git (671,7 → 103,1 Mo), récupérables au
  commit `88fdf54` : [ARCHIVES.md](ARCHIVES.md). Aucun fichier de `src/` touché.
- **Tri des documents (PR nº 9, fusionnée).** 162 fichiers historiques rangés dans
  `docs/archive/`, neuf documents vivants listés dans [README.md](README.md).
- **Moteur découpé (PR nº 10, fusionnée).** `src/game.ts` passe de 1 303 à 395 lignes ; les
  règles d'un pas sont dans `src/engine/`, déplacées sans réécriture. Parties rejouées à
  l'identique : voir la fin d'[ARCHITECTURE.md](ARCHITECTURE.md).
- **Pages secondaires de l'accueil (PR nº 11, fusionnée).** Sur téléphone en paysage,
  Missions, Favoris, Aventure classique et Pour les parents tiennent sans défiler en 780×360
  et 812×375. CSS seulement.
- **Styles et page découpés (PR nº 12, fusionnée).** `src/style.css` devient 18 tranches ordonnées dans
  `src/styles/`, `index.html` neuf morceaux dans `src/html/`. Site construit identique octet
  pour octet : voir la fin d'[ARCHITECTURE.md](ARCHITECTURE.md).
- **Moteur de rendu.** Phaser 3 réévalué et gardé : voir la fin d'[ARCHITECTURE.md](ARCHITECTURE.md).
- **À suivre.** Regrouper les styles par écran, avec une comparaison d'images avant et
  après ; conventions de
  code. Le numéro de version reste 0.37.0 tant que le lot interface n'est pas complet.
- **Pas vérifié.** Rien sur le S24 ni avec les enfants.

## Première livraison 0.37.0 — huit choix réalisés, build 49

La version Android **0.37.0 / code 49** applique les huit choix validés :
accueil court et reprise contextuelle, carnet de six autocollants par mission,
gestion repliée, préparation en sous-vues, catalogue natif paginé en pause avec
budget visible. Les 36 noms/annonces du créateur restent français dans les deux
langues ; moteur, données, sauvegardes et anciens codes sont préservés.

Source produit/tests figée : `b31933bf9f6dc56b9c7bf4d286068f52ff3bf28a`.
[Bilan](BILAN-0.37.0.md), [conseils simulés](archive/CONSEIL-0.37.0.md),
[preuves et reçus](../reports/interface-0370/README.md),
[cadrage](archive/superpowers/specs/2026-11-10-interface-mobile-0370.md).
La correction finale I1/M1/M2 révèle les résultats du catalogue, remet le focus
d’accueil dans la zone visible et répare la recette journey. Verify 549 tests,
9 régressions navigation, journey, gestes natifs cinq tailles + ordinateur,
menus et navigateur sont verts sur la source corrigée. APK debug et portable
HTML/ZIP sont reconstruits ; quatre démarrages froids FR/EN sont verts.
Les 21 gates et la partie authentique antérieurs restent explicitement en `9ca13bb`.
La nouvelle recette et les artefacts sont indexés dans le reçu de livraison. Les anciennes preuves et la version 0.36.2 restent conservées.

**Première publication 0.37.0 : Sites24, build 49.** Revue globale et relecture des trois
correctifs approuvées ; PR7 fusionnée après CI verte. Les fichiers publics sont
identiques au paquet normal de l’APK. Voir le [reçu](../reports/deployment-0.37.0.json).
Les essais S24, TalkBack, enfants et
relecture anglophone native restent attendus. Le petit carnet 568×320 avec marges
conserve un défilement interne ; à 780×360 avec marges les six cartes tiennent.

Le comparatif d’images est séparé et arrêté au [devis partiel](archive/interface-0370/DEVIS-COMPARATIF.md) :
100 crédits Magnific, 1 crédit Higgsfield de base, prix Runway indisponible.
Aucune image ni dépense lancée.

## Avant la 0.37.0

Le journal de Codex jusqu'à la 0.36.2 est dans
[archive/PLAN-ACTUEL-avant-0.37.md](archive/PLAN-ACTUEL-avant-0.37.md).
