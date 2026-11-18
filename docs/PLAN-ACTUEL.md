# Plan actuel — 18 novembre 2026

Une page. L'historique des livraisons et des lots jusqu'au 15 novembre est dans
[archive/PLAN-ACTUEL-avant-2026-11-15.md](archive/PLAN-ACTUEL-avant-2026-11-15.md).

## Livraison préparée — 0.38.0, Android build62, site snakeattacktd.com

- **Application** : 0.38.0 / build62 préparé par Codex le 15 novembre (AAB signé), à importer
  dans le canal de test interne de Google Play. Aventure de 12 vagues, 6 missions, 36
  caprices, le voyage (version 1, figée), quatre joueurs locaux, français et anglais, et la
  politique de confidentialité lisible hors ligne dans « Pour les parents ».
  [Bilan](BILAN-0.38.0.md), [Android](ANDROID.md), [Voyage](VOYAGE.md).
- **Site** : https://snakeattacktd.com sur Infomaniak, publié à la main depuis `main` par
  « Publier le site ». Politique de confidentialité publique à `/confidentialite`. L'ancien
  site `…chatgpt.site` reste en ligne et affiche l'avis de migration ; personne n'y joue
  (parole du parent, 18 novembre), il peut être arrêté quand il le veut. [Site](SITE.md).

## Dans le build 62

- **Build release optimisé** : R8 activé pour répondre à deux remarques de la Play Console.
  Le build 62 est construit et signé, mapping embarqué, verify et navigateur verts.
  **Recette native passée selon le compte rendu du parent** sur Android15 x86_64/WHPX :
  hors ligne, victoire, reprise61→62, sauvegarde, Voyage, confidentialité et marges système.
  Aucun crash/ANR ; échec cloud non reproduit. Preuves conservées dans sa session Windows,
  non accessibles ici. PR 58 fusionnée le 15 novembre avec l'accord du parent ; aucun envoi à
  Play ni publication du site ([Android](ANDROID.md)).
- **Ménage du 15 novembre** : CI en cinq tâches parallèles, une seule fois par commit ;
  diagnostic de performance chargé à la demande (paquet principal 189,6 Ko sur 200) ;
  scripts et recettes morts retirés, recettes vivantes mises dans la CI ; ce plan ramené à une
  page.

## Dans `main`, pas dans le build 62

Le paquet 62 a été construit avant ces lots : ils attendent le **build 63**, à construire
depuis `main`. **Le site, lui, est déjà publié depuis `main`** (17 et 18 novembre, révisions
3 et 4 comprises), sur décision du parent : il est donc en avance sur le build 62, et une
grande aventure commencée sur le site ne se relit pas dans ce build
([bilan de la révision 3](BILAN-REVISION-3.md), « À savoir avant de publier »). Le build 63
remettra l'application au niveau du site.

- **Rien en dur (15 novembre)** : textes, clés de stockage, nombres du jeu, repères du
  plateau, limites et couches du dessin ont chacun un nom et un seul lieu ; aucune valeur ni
  aucun texte n'a changé ([bilan](BILAN-NETTOYAGE-2026-11.md), « Rien en dur »).
- **King Snake (15 novembre)** : le roi à trois têtes porte le nom choisi par le fils, dans
  les deux langues ; « le roi » tout court reste. Trois messages du moteur le nomment : les
  empreintes de cinq parties de référence ont changé de hachage, rien d'autre.
- **Écran étroit** : le code suit maintenant la même largeur que les styles (920 px au lieu
  de 800) pour ramener le plateau ou une récompense à l'écran. **À essayer sur le téléphone.**
- **Carte d'une mission** : les noms des voies sont dans la police du jeu (ils étaient en
  Arial). Ils restent très petits sur téléphone : à regarder avec les enfants.
- **Index des serpents** (idée du fils) : « Tous les serpents », treize serpents et l'œuf,
  depuis « Dangers » et depuis « Favoris ». Pas encore montré aux enfants.
- **Catalogue en un seul écran** (idée du fils, choix du parent) : tous les alliés en petites
  cartes, sans pages ni liste de familles. Pas encore montré aux enfants.
- **Un œuf de plus quand une vague dure** (idée du fils, valeurs choisies par le parent) :
  dans la grande aventure, après 45 secondes de vague un œuf apparaît, un second 15 secondes
  plus tard, pas plus de deux par vague. C'est la **révision d'équilibrage 3** : les parties,
  codes et sauvegardes d'avant gardent leurs règles ; missions, défis et voyage ne changent
  pas. Mesuré sur 1 200 parties simulées : même taux de victoire, parties plus longues
  d'environ une minute. Le parent a revu quatre réglages sur 200 parties chacun et a gardé
  celui-ci ([bilan](BILAN-REVISION-3.md)). **Pas encore joué par les enfants.**
- **Trois nouveaux serpents** (idées du fils) : « Grands crocs » (morsure double, dès la
  vague 8), « Serpent rare » (très fragile, sa morsure fait tomber une Massue, vagues 8 et 11) et « Serpent ninja » (rapide, esquive le premier coup, dès la vague 6), dans la grande
  aventure seulement. C'est la **révision d'équilibrage 4**. Le parent a choisi ce que fait le
  ninja et accepté qu'un expert simulé gagne une partie sur deux (62 % → 52 %). **Les trois
  noms sont confirmés par le fils (18 novembre) ; les images sont provisoires**, le parent a
  accordé un budget libre pour les dessins ([bilan](BILAN-REVISION-4.md)). **Pas encore joué
  par les enfants.**
- **Le serpent ninja se téléporte** (idée du fils, règle choisie par le parent le 18
  novembre) : au premier coup, il disparaît et revient dans le dos de l'allié qui l'a frappé,
  à la place de l'esquive. C'est la **révision d'équilibrage 5**, acceptée par le parent
  après mesure : la difficulté ne bouge pas (expert 52 % → 52 %). Les parties, codes et
  sauvegardes d'avant gardent l'esquive ([bilan](BILAN-REVISION-5.md)). **Pas encore joué par
  les enfants.**

## Site : revue du 17 novembre

- Corrigé : « Jouer » dans le premier écran sur téléphone, liens de 48 px, en-tête de la page
  du jeu (deux noms, image de partage, icône d'écran d'accueil), images légères, prototype
  hors des résultats de recherche, deux erreurs d'anglais ([détail](SITE.md)).
  Fusionné et publié le 17 novembre.
- **Publicité sur le site** : la revue recommandait de ne pas l'activer ; le parent a décidé
  de poursuivre (tous les visiteurs sur grand écran, un seul cookie anti-fraude de Google,
  un moyen de la couper ; pas de publicité sur téléphone). **Rien n'est activé.** Les textes
  FR/EN, approuvés le 17 novembre, sont dans la politique de confidentialité et sur la page
  parents. L'encart et le bouton « couper la publicité » sont codés et éteints : le site
  publié n'en contient rien. Restent l'approbation du site par Google, le feu vert du
  parent, puis une capture sur le site en ligne :
  [proposition et ordre d'activation](publication/PUBLICITE-WEB-PROPOSITION.md).
- **Suite de la revue (17 novembre, accord du parent sur les six points)** : lien PayPal
  sur la seule page parents (les autres pieds de page y mènent), image de partage large
  faite d'une vraie bataille, titres « tower defense … pour enfants / for kids »,
  « Nouveautés » écrite pour l'enfant, bloc « Qui a fait ce jeu ? », lien « À propos du
  jeu » à 48 px dans « Pour les parents » ([détail](SITE.md)). Publié le 17 novembre
  (publication n° 11). Rien n'est essayé sur le téléphone.
- **Relecture à huit angles et corrections (17 novembre)** : à la demande du parent, huit
  relecteurs indépendants ont vérifié le lot dans le build, chacun sous un angle (ce ne sont
  pas des avis d'enfants ni de parents). Corrigé : une phrase fausse de « Nouveautés »,
  les mots des boutons du jeu repris tels quels, les noms anglais du jeu, l'œuf de l'index
  (« deux petits serpents »), l'aperçu de partage de la page du jeu, l'image de partage
  (vague 8, titre lisible même rognée en carré), la grille de « Pour les parents » quand la
  publicité sera allumée, les liens de la page de confidentialité à 48 px
  ([détail](SITE.md)). Publié le 18 novembre (publication n° 12). Restent des décisions du
  parent et des questions pour le fils, listées dans SITE.md.
- **Textes lisibles sur téléphone (18 novembre)** : les textes écrits sur le plateau se
  lisaient à 5-9 px ; ils se lisent maintenant à 11 px au moins (compte à rebours d'un œuf,
  dégâts, « Esquive ! », refuge, King Snake). Dans l'interface, ce que l'enfant lit pendant
  la partie passe à 13 px. « Continuer sans bonus » ne sort plus de l'écran ; l'en-tête sur
  ordinateur ne coupe plus ses boutons ; deux phrases ne font plus de faute d'accord
  (« Alliés debout : 1 », « Il faut 1 ★ »). Rendu seul, aucune règle touchée
  ([architecture](ARCHITECTURE.md), « Textes lisibles sur téléphone »). **À regarder sur le
  vrai téléphone et avec les enfants** : c'est mesuré sur des captures, pas lu par un enfant.
- **Deuxième relecture à huit angles (18 novembre)** : corrigé sans décision — image de
  partage (titre en haut, plateau entier visible), « Voies ouvertes » resté en français
  dans l'écran anglais, annonce et plaques « Courage ! » / « Confusion » qui se
  recouvraient en bas du plateau, clavier sur l'écran des cadeaux, documents périmés. Sept
  décisions du parent et deux questions pour le fils sont listées dans
  [SITE.md](SITE.md), « Deuxième relecture ». Publié le 18 novembre (publication n° 14).
- **Troisième relecture à huit angles (18 novembre)** : page 404, contrôle de la
  compression à la publication, aperçu de partage de la page du jeu complété, annonce qui
  ne saute plus, « Esquive ! » lisible, plaque du refuge sur deux lignes, clavier sur
  l'écran des cadeaux, quelques textes à 13 px ([SITE.md](SITE.md), « Troisième
  relecture »). Publié le 18 novembre (publication n° 15) : le contrôle en ligne confirme
  qu'une adresse inconnue répond 404 avec la page du build, et que le site est servi
  compressé.

## Site : découverte FR/EN et soutien — lot du16novembre

-10pages publiques : présentation, comment jouer, personnages, nouveautés et parents,
chacune en FR/EN ; jeu et sauvegardes toujours à la même adresse. Sitemap, robots,
canonicals et partage préparés. [Détail et procédure Google/Bing](SITE.md).

- Soutien volontaire préparé mais **masqué**, sur décision du parent ; pas de destination
  de paiement configurée dans ce premier lot. Le soutien a ensuite reçu un GO
  distinct le16novembre2026 : voir la section suivante. La publicité, alors repoussée,
  a été décidée pour le site le 17 novembre.
- Build Android séparé dans `dist-android/` : aucun contenu Web ou soutien embarqué.
  Les AAB/APK62 existants ne sont pas reconstruits par ce lot.
- Vérification de propriété et soumission Search Console/Bing à faire dans les comptes
  du propriétaire ; ne pas confondre fichiers publiés et indexation effective.

## Ce qui n'est pas vérifié

- **Le voyage avec les enfants.** Réglé sur des joueurs automatiques, puis figé à la
  publication. Les simulations disent qu'un joueur « apprenti » tombe devant le roi trois
  fois sur quatre. Aucune séance d'enfant n'est notée dans le dépôt.
- **Le build 62 sur le téléphone** : essayé par le parent sur un émulateur Android 15, pas
  sur son Galaxy S24 (derniers retours notés sur le téléphone : build 50 et 13 novembre) ;
  la mise à jour distribuée par Play n'est pas essayée non plus.
- **Les lots d'après le build 62** (King Snake, index des serpents, catalogue en un écran,
  œuf de plus, trois nouveaux serpents) : dans aucun build, jamais vus sur un téléphone ni
  par les enfants.
- **Le site** : contrôlé automatiquement à la publication ; pas encore noté comme ouvert et
  joué par une personne sur le nouveau domaine.
- **L'anglais** : pas relu par une personne.

## À faire, dans l'ordre

1. **Faire jouer les enfants au voyage**, 30 à 45 minutes sur le téléphone, et noter : où ils
   tombent, si la marche devant le roi les décourage, combien de temps dure un voyage, ce
   qu'ils redemandent. C'est ce qui décide du point 4.
2. **Fiche Play** : mettre `https://snakeattacktd.com/confidentialite` comme adresse de
   confidentialité, puis importer l'AAB62 dans le canal interne. Le premier release
   optimisé a passé la checklist sur l'émulateur accéléré selon le parent ; mise à jour via
   Play et confort du build62 sur S24 restent à contrôler. Ensuite, **build 63** (Codex)
   depuis `main` pour les ajouts du fils, à essayer sur le téléphone avec les enfants.
3. **Préparer le test fermé** : Google demande à un compte personnel 12 testeurs pendant 14
   jours avant la production. Il faut une fiche à jour (textes et captures du jeu actuel ; le
   dossier [publication/](publication/) décrit encore la 0.32.4). **Le parent a décidé (17 et
   18 novembre) : aucune publicité ni achat dans l'application.** Le dossier et
   `npm run store:check` décrivent encore l'ancien modèle (publicité entre missions,
   suppression payante, cosmétiques) : à refaire avant la fiche, avec Codex.
4. **Du contenu, choisi d'après la séance** : voyage sans fin si les enfants finissent le
   voyage, version 2 du voyage s'ils tombent devant le roi, nouvelles missions dessinées par
   le fils s'ils réclament du neuf. Une quatrième sortie ou de nouveaux terrains demandent
   l'accord du fils et une nouvelle révision des règles.

## Décisions du parent — 18 novembre

Les dix-neuf décisions de la liste ont été prises une par une avec le parent ; le fils a
répondu à ses questions le même jour. `SITE.md` raconte d'où vient chacune.

**Fait dans le lot du 18 novembre (textes)**

- **1.** Serpent rare, « Nouveautés » : « Pose un Archer : il peut le toucher avant qu'il morde. »
- **2.** « Comment jouer » : « tu vois quels serpents arrivent, et quels chemins sont ouverts ».
- **3.** « Nouveautés » nomme les boutons : « Aventure classique », puis « La grande aventure · 12
  vagues ».
- **4.** Page parents : « L'application Android est en préparation ; elle n'est pas encore
  disponible. » Aucune date promise.
- **5.** Page 404 : le texte en ligne est gardé.
- **6.** Le lien de paiement s'appelle « Soutenir sur PayPal (nouvel onglet) ». Le pied des autres
  pages garde « Soutenir le développement », qui mène à la page parents (choix du parent).
- **7.** Publicité : « … que l'on peut couper dans « Pour les parents » du jeu. »
- **8.** **« Cristal » partout** pour la jauge (mot du fils) : la plaque du plateau, le résultat
  d'une vague, les mots qui s'envolent, « répare le cristal ». Le camp reste le lieu où l'on
  pose ses alliés (« Prépare ton camp », « Le camp est tombé »). « Le refuge » reste le nom
  de la première mission et le mot de ses codes de départ.
- **10.** Six phrases réécrites, vérifiées dans le moteur : « En tombant, il blesse celui qui l'a
  battu (−2) » (la phrase d'abord proposée, « est soigné de 2 », était fausse : le cobra
  royal enlève 2 points de vie à l'allié qui le bat) ; « Protège ton cristal de 18 dégâts.
  Le roi, lui, passe quand même. » ; « Les serpents arrivent l'un après l'autre » ; « Les œufs
  éclosent l'un après l'autre » ; l'onglet « Repérage » devient « Dangers », le mot du
  bouton de la bataille (« Le terrain » aurait doublé la ligne « Terrain » du même écran) ;
  « Recommencer cette partie ».
- **17.** `README.md` : aucune publicité ni achat dans l'application ; sur le site seulement,
  l'encart que l'on peut couper et le lien PayPal.

**Fait dans le lot « montrer ce qui existe » (18 novembre), à montrer au parent et au fils
avant fusion** : points 9 et 11 ci-dessous et « KSSS ». Phrases nouvelles à valider par le
fils : « Nouveau serpent : … ! », « Nouvel allié : … ! », « Nouveaux alliés : … et … ! »,
« Nouveaux alliés : …, … et … ! ». Comme sept serpents sur quatorze s'appellent « Serpent
… », l'annonce donne « Nouveau serpent : Serpent ninja ! » : à lui de dire s'il la veut plus
courte. Relecture à huit angles faite ; ses corrections sont dans le lot.
Le point 14 (« Reprendre ») attend un lot à lui : il touche la sauvegarde.

**Décidé, à faire dans les lots suivants**

- **9.** Sur téléphone : le miel n'affiche que ses secondes ; « Réserve », les pastilles de soin et
  la garde du roi deviennent des signes dessinés dans le code, sans dépense. Captures à
  montrer au parent avant fusion.
- **11.** « Montrer ce qui existe » : « Encourager » à un appui pendant la vague, annonce d'un
  nouveau serpent, annonce d'un allié débloqué. Les phrases sont à montrer au fils avant
  fusion.
- **12.** Dessins des trois nouveaux serpents : **budget libre accordé par le parent**.
- **13.** La marche devant le roi dans le voyage est acceptée ; on regarde d'abord les enfants jouer.
- **14.** « Reprendre » : corriger, avec une donnée de plus sur l'appareil ; les anciennes
  sauvegardes restent lisibles. **Fait** (lot « Reprendre », 18 novembre) : une mission gagnée
  ne dit plus « Reprendre » après la fermeture du jeu ([bilan](BILAN-REPRENDRE.md)).
- **15.** Mission 1 gagnable sans recruter : **mesuré, et le parent décide de ne rien changer**
  (18 novembre). Sur 200 parties sans acheter un seul allié : mission 1 gagnée 200 fois (93
  avec 3 étoiles), mission 2 196 fois (4 avec 3 étoiles), mission 3 93 fois (aucune à 3
  étoiles), missions 4 à 6 jamais. Il faut recruter dès la mission 3
  (`artifacts/lot86/mission1.mjs`, hors Git).
- **16.** Publicité : rien ne s'allume sans le message du parent, après l'approbation du site par
  Google et les six réglages du compte ; avant d'allumer, interdire au navigateur les
  fonctions publicitaires de profilage et adapter le contrôle du site en ligne
  ([proposition](publication/PUBLICITE-WEB-PROPOSITION.md)).
- **18.** L'ancien site : personne n'y joue (parole du parent), aucune date à annoncer ; il peut
  être arrêté quand le parent le veut.
- **19.** Connexion Google ou sauvegarde en ligne : écartée.

**Nouvelles règles décidées** (chacune dans une nouvelle révision ; les parties, codes et
sauvegardes d'avant gardent leurs règles)

- **Serpent ninja** : fait, révision 5 ([bilan](BILAN-REVISION-5.md)). Le fils ne veut aucun
  mot quand il se téléporte (18 novembre) : fait.
- **Voyage** : King Snake vient avec ses gardes à la dernière étape. Mesure lue et acceptée
  par le parent le 18 novembre ; fait en version 2 du voyage, les voyages de version 1 gardent
  le roi seul ([bilan](BILAN-VOYAGE-2.md)).

**Réponses du fils** (rapportées par le parent, 18 novembre)

- Les trois noms sont les siens : « Serpent ninja », « Grands crocs », « Serpent rare ».
- Quand le serpent rare mord, il s'écrit « KSSS », en majuscules.
- La sauterelle, après son saut, marche normalement comme les autres.
- Le spinosaure doit être la meilleure unité ; l'équilibrage est laissé à mesurer.
- Le nombre de pommes du boss caché est laissé à proposer, après mesure.
- Dans le voyage, il veut les gardes du roi.

**Relectures** (choix du parent) : huit angles pour un lot qui change une règle ou un écran
du jeu, trois pour un petit lot de textes ou de corrections.

## Dettes connues

- `reports/` : 845 fichiers de rapports encore suivis dans Git ; plusieurs scripts y écrivent.
- Les pages de test (`tests/*-harness.ts`) ne chargent pas les feuilles de style comme le jeu.
- `test:mobile-menus` est la plus longue tâche de la CI (10 à 17 minutes) ; à découper si
  elle grossit encore.
- Paquet principal : 195,9 Ko sur 200 depuis que la fenêtre des joueurs se charge à la
  demande (18 novembre). Si la marge redevient courte, la suite est la sauvegarde familiale
  et le carnet de caprices, ouverts rarement eux aussi.
- Détail des dettes de code : [bilan du nettoyage](BILAN-NETTOYAGE-2026-11.md).

## Où lire le détail

[Architecture](ARCHITECTURE.md) · [Voyage](VOYAGE.md) · [Site](SITE.md) ·
[Android](ANDROID.md) · [Caprices](CAPRICES.md) · [Bilan 0.38.0](BILAN-0.38.0.md) ·
[Passation](PASSATION-CLAUDE-CODE.md) · règles du jeu : `GAME_DESIGN.md`, `AGENTS.md`.

## Soutien Web PayPal — accord du16novembre2026

- Lien public créé et approuvé par le parent : montant libre en CHF, ponctuel,
  sans adresse ni livraison. Pas de paiement réel par Codex.
- Activation dans les pages publiques FR/EN ; depuis le 17 novembre le lien de paiement
  n'est plus que sur les pages parents, les autres pieds de page y mènent. Menu du jeu
  conservé, Android/portable sans lien de paiement ni SDK.
- Section de confidentialité bilingue approuvée ajoutée à la source unique ;
  anciens engagements préservés, date16novembre2026. Aucun nouveau build Android signé.
- Plan : `docs/superpowers/plans/2026-11-16-web-paypal-support.md`.
- Recette et livraison : `docs/BILAN-SOUTIEN-WEB-2026-11-16.md`.
- Restent à constater par le titulaire lors d'une vraie contribution : identité
  sur le reçu, frais réels. Aucun anonymat ou avantage fiscal annoncé.

## AdSense Web — liaison avant examen Google

- Parent : fournisseur AdSense automatique, pas encore de partenaire direct ;
  ID public `pub-8498417364292905` ; domaine validé et examen demandé selon le retour du parent,
  approbation de diffusion encore non constatée.
- Première livraison : meta de validation Web et ads.txt uniquement. Aucun script,
  annonce, cookie publicitaire ou changement de confidentialité/CSP ; aucune modification Android.
- Plan : `docs/superpowers/plans/2026-11-16-adsense-verification.md`.
- Prochaines dépendances : approbation du site dans AdSense,
  cadrage enfant/consentement, confidentialité FR/EN approuvée et recette du placement.
- « Automatique » désigne la fourniture des annonces : un seul emplacement maîtrisé
  sur la page du jeu sera étudié, pas d’annonces automatiques intrusives ou en remerciements.

## Encart AdSense — conseil et préparation désactivée

Consensus appliqué : calcul de placement indépendant, maquette locale compilée
séparément, aucune réservation de place ou annonce sur le site public, Android
ou portable. Le plateau garde ses dimensions ; ses bornes Phaser sont rafraîchies
après déplacement, avec contrôle des coordonnées réellement recrutées.

Le bloc manuel `7092707633` est préparé, mais aucun chargeur Google n'est livré.
Restent avant activation : approbation du domaine, consentement et paramètres de
compte, puis confidentialité FR/EN approuvée. Pas de modification des règles,
sauvegardes, codes de départ ou du numéro de build Android.

Détail : [bilan de préparation](BILAN-ADSENSE-PREPARATION-2026-11-16.md) et
[plan](superpowers/plans/2026-11-16-web-ad-placement-disabled.md).
