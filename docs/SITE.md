# Le site — snakeattacktd.com sur Infomaniak

Décision du parent, 14 novembre 2026 : le site du jeu quitte
`conquete-serpents-famille.zyclope.chatgpt.site` pour **https://snakeattacktd.com**, sur un
hébergement Web classique d'Infomaniak, publié à la main depuis Git par GitHub Actions.
L'ancien site reste en ligne pendant la transition : personne ne le supprime dans ce lot.

**En ligne depuis le 15 novembre 2026.** Première publication réussie du premier coup,
depuis `main` au commit `7d30a84` (lancement n° 1 de « Publier le site »). Le contrôle du
site en ligne a tout trouvé conforme : page et script servis, en-têtes de sécurité, cache
long des fichiers à empreinte, `version.json` au bon commit, politique identique octet pour
octet à celle du dépôt, `/confidentialite` renvoyé vers `/confidentialite/`, `http://` et
`www.` renvoyés vers `https://snakeattacktd.com`, aucun cookie.

Ce document décrit ce que le build produit, ce qui a été réglé une fois chez Infomaniak et
dans GitHub, comment publier et revenir en arrière, et ce qui reste à vérifier.

## Ce que le build produit

`npm run build` écrit dans `dist/` le site entier, sans serveur d'application :

| Fichier                      | Rôle                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| `index.html`, `assets/`      | le jeu ; les fichiers de `assets/` portent une empreinte de contenu                      |
| `confidentialite/index.html` | la politique de confidentialité, HTML simple, sans JavaScript, FR/EN                     |
| `.htaccess`                  | adresse unique, en-têtes de sécurité, cache (`deploy/policy.ts`)                         |
| `_headers`                   | les mêmes en-têtes pour l'ancien hébergeur ; Apache l'ignore                             |
| `fr/`, `en/`                 | présentation, prise en main, personnages, nouveautés et parents, en HTML sans JavaScript |
| `sitemap.xml`, `robots.txt`  | découverte des12URL publiques par les moteurs ; le prototype porte un en-tête `noindex`  |
| `favicon.ico`                | l'icône des pages qui n'en nomment pas (politique, prototype)                            |
| `404.html`                   | la page d'une adresse qui n'existe pas (`ErrorDocument`), FR/EN, hors recherche          |
| `ads.txt`                    | l'autorisation du compte AdSense ; aucune annonce n'est diffusée                         |

L'adresse du site est écrite à un seul endroit, `src/site.ts`.

## Découverte et soutien — 16 novembre 2026

Le jeu reste à `/`, sur la même origine : aucun déplacement des sauvegardes. Les10pages
FR/EN de `deploy/discoveryCopy.ts` sont générées par `deploy/discovery.ts` : contenu réel,
un titre et une description propres, canonical, liens linguistiques réciproques, Open Graph,
image de partage existante et données structurées WebPage factuelles, sans notes inventées.
Elles réutilisent les polices et illustrations locales autorisées, sans nouvelle génération,
script de suivi, cookie ni appel de régie. Dans le jeu, « À propos du jeu », parmi les
boutons de « Pour les parents », permet de les trouver.
Le lot de découverte a conservé la politique approuvée. L'ajout de soutien
ultérieur a son accord distinct du16novembre2026, décrit ci-dessous. Aucune publicité.

Les pages statiques peuvent être lues sans JavaScript, en portrait comme en paysage.
Le bouton Jouer renvoie au jeu existant ; l'orientation paysage reste nécessaire pour le
plateau sur téléphone. La langue déjà choisie dans le jeu reste prioritaire.

### Indexation : opération propriétaire à terminer

1. Dans [Google Search Console](https://search.google.com/search-console), ajouter la
   propriété Domaine `snakeattacktd.com` au compte du propriétaire. Copier uniquement
   l'enregistrement TXT de vérification dans la zone DNS Infomaniak, sans modifier les
   enregistrements Web ou de messagerie ; attendre sa propagation puis vérifier.
2. Envoyer `https://snakeattacktd.com/sitemap.xml`. Inspecter `/fr/`, `/en/` et `/` :
   relire le rendu et la canonical, puis demander l'indexation si nécessaire. Le sitemap
   contient12URL : jeu,10pages et confidentialité ; ni profils ni codes de départ.
3. Dans [Bing Webmaster Tools](https://www.bing.com/webmasters/), importer la propriété
   Search Console ou utiliser la vérification proposée, puis envoyer le même sitemap.
4. Suivre les pages indexées, erreurs et impressions dans ces consoles ; aucun pixel de
   mesure d'audience n'est nécessaire dans le jeu. Les publications suivantes mettent le
   sitemap à jour. Aucune date de modification artificielle ou demande répétée automatisée.

La génération du sitemap et sa publication ne prouvent ni la vérification de propriété,
ni une soumission, ni une indexation ou un classement. Les accès Google/Bing du propriétaire
restent nécessaires. [Guide Google](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

### Revue du 17 novembre 2026 — ce qui a été corrigé

Revue du site sur trois angles (indexation et icônes, publicité et confidentialité, mise en
page), chaque constat vérifié dans le build. Corrigé dans ce lot, sans toucher aux textes
approuvés (politique de confidentialité, soutien) :

- **« Jouer » dans le premier écran.** Sur téléphone, le bouton vient juste sous le titre,
  avant le paragraphe ; en paysage le haut de page est resserré. Mesuré de 320×568 à
  1280×800 ; la recette `test:discovery` le contrôle sur cinq tailles, dont 360×640 et
  667×375.
- **Liens de 48 px au moins** sur les pages publiques (langue, navigation, pied de page,
  soutien, logo). Dans le jeu, « À propos » n'apparaît plus que dans la langue du jeu ; il
  restait à 27 px de haut dans le pied de l'accueil et a été déplacé dans la suite de la
  revue (ci-dessous).
- **Page du jeu (`/`).** Elle nomme maintenant son image de partage, le nom du site et une
  icône pour l'écran d'accueil d'un téléphone (`GAME_PAGE`, `augmentGamePage`). Sa
  description est dans les deux langues : le jeu écrit son titre dans la langue du joueur,
  et un moteur de recherche, qui n'annonce pas de langue, lisait un titre anglais avec une
  description française. Le titre lui-même ne change pas : la recette de langue tient à ce
  qu'il suive la langue du jeu.
- **Images légères.** `scripts/export-site-icons.py` tire de l'icône de 512 px (356 Ko) une
  image de page de 31 Ko, un logo de 18 Ko, une icône d'onglet de 6 Ko, une icône d'écran
  d'accueil et `favicon.ico`. L'icône de 512 px ne sert plus aux pages ; l'aperçu d'un lien
  partagé est devenu une image large (suite de la revue, ci-dessous).
  Aucune image nouvelle, aucune dépense.
- **Prototype hors des résultats de recherche.** `robots.txt` l'interdisait d'exploration,
  ce qui n'empêche pas l'indexation ; il porte maintenant l'en-tête `X-Robots-Tag: noindex`
  (`deploy/policy.ts`) et `robots.txt` laisse tout lire, pour que l'en-tête soit vu.
- **Anglais.** Les trois nouveaux serpents portent leurs noms anglais ; le lien
  « Privacy policy » des pages anglaises ouvre la moitié anglaise (`/confidentialite/#en`).
- **Budget de la page du jeu.** Il restait 62 octets sur 32 768. Deux formats sans effet sur
  la page sont retirés au build (saut de ligne avant la fin d'une balise, barre des éléments
  vides) et ce que le site ajoute à la page est compté à part : `WEB_HEAD_BUDGET`, 1 024
  octets alors (1 280 depuis le 18 novembre), dont 701 utilisés alors (1 128 aujourd'hui). La page du jeu elle-même pèse 32 085 octets sur 32 768
  (`scripts/check-dist.mjs`).

Non vérifié : le site en ligne n'était pas joignable depuis l'environnement de la revue ;
tout est mesuré sur le build. Rien n'est essayé sur un vrai téléphone. Après publication,
contrôler dans la Search Console la page explorée de `/` (titre, description) et l'en-tête
du prototype.

### Suite de la revue — 17 novembre 2026, accord du parent sur les six points

- **Lien PayPal dans un seul endroit.** Il n'est plus dans le pied des dix pages, dont
  celles écrites pour les enfants : il reste dans le bloc « Soutenir le développement » de
  la page parents, avec sa mention approuvée. Dans chaque pied, « Soutenir le
  développement » mène à ce bloc (`/fr/parents/#soutien`, `/en/parents/#support`), jamais
  au paiement. Le mot « PayPal » n'apparaît plus que sur la page parents et dans la
  politique, dont le texte reste exact (« un lien vers PayPal »).
- **Image de partage large.** 1200×630, 141 Ko : une vraie bataille du jeu (mission « Le
  refuge », vague 1), prise par l'interface publique du build, sous l'icône et les deux
  noms du jeu dans la police du jeu. `scripts/export-share-image.mjs` la refait après
  `npm run build` ; aucun générateur, aucune dépense. Les pages l'annoncent avec sa taille
  et `summary_large_image` ; aucune page ne l'affiche. Limite contrôlée : 300 Ko.
- **Titres.** Accueil français : « La Conquête des Serpents — tower defense gratuit pour
  enfants » ; anglais : « Snake Attack TD — free tower defense game for kids ». Chaque
  accueil nomme une fois le jeu dans l'autre langue.
- **« Nouveautés » écrite pour l'enfant**, en « tu » : trois nouveaux serpents, des œufs en
  plus, le Voyage, un joueur pour chacun. Ce qui s'adresse aux adultes (Web et Android, une
  nouveauté ne change pas une partie commencée) est passé sur la page parents. Quelques
  phrases abstraites des autres pages sont dites plus simplement.
- **« Qui a fait ce jeu ? »** sur la page parents : un enfant l'a inventé sur papier, son
  parent le réalise et le publie sous le nom zyclope ; l'adresse de contact est celle de la
  politique (`CONTACT_EMAIL`, `src/site.ts`, un seul lieu), avec un lien vers la politique.
  Rien d'autre n'est affirmé sur l'éditeur.
- **« À propos du jeu » à 48 px.** Le lien quitte le pied de l'accueil (27 px de haut) pour
  les boutons de « Pour les parents », sur la ligne de la sauvegarde familiale : 48 px de
  haut, de 116 à 277 px de large selon l'écran, sans ligne en plus. Mesuré en 640×360,
  780×360, 812×375 (anglais), 1280×800, avec et sans le bouton « Joueurs », et dans une
  fenêtre en hauteur (600×900), où il prend sa propre ligne. L'application Android et la
  copie portable n'ont pas ce lien.

Vérifié : `npm run verify`, `test:discovery` (50 pages et tailles, lien de paiement
intercepté, jamais de vrai paiement), `test:locale`, et les recettes de la CI. Non
vérifié : l'aperçu réel d'un lien partagé dans une messagerie (il faut le site publié) ;
rien n'est essayé sur un vrai téléphone ; l'anglais des nouvelles phrases n'est pas relu
par une personne. L'image de partage montrait la première vague ; elle a été refaite dans
le lot suivant.

### Relecture à huit angles — 17 novembre 2026

À la demande du parent, huit relecteurs indépendants ont relu le lot entre deux lots, chacun
sous un angle : lecture d'un enfant de 6-7 ans, intérêt du jeu, confidentialité et argent,
accessibilité, référencement et partage, code et tests, téléphone en paysage, fidélité aux
règles du fils. **Ce ne sont pas des avis d'enfants ni de parents** : chacun a mesuré dans le
build et cité sa preuve. Leurs fichiers de travail sont dans `artifacts/council/` (hors Git).

Corrigé dans ce lot, sans décision à prendre :

- **Une phrase fausse.** « On l'essaie en famille, puis elle arrive ici » : les œufs en plus
  et les trois serpents n'ont pas encore été joués par les enfants. Remplacée par « Voici ce
  qui vient d'arriver dans le jeu. Beaucoup d'idées viennent de l'enfant qui l'a inventé. »
  Un test refuse le retour de cette promesse.
- **Des phrases qui promettaient trop.** Les nouveaux serpents et les œufs en plus
  n'arrivent que dans une _nouvelle_ « Aventure classique » (nom du bouton du jeu) ; la
  garde du roi n'existe que dans l'aventure classique ; le roi est nommé King Snake.
- **Les mots du jeu.** Les pages nomment les boutons par leurs textes du catalogue
  (« Dangers », « Tes favoris », « Tous les alliés », « Aventure classique ») et, en
  anglais, les alliés et serpents par leurs noms du jeu (Clubber, Medic, Shield Guard,
  Shellback, sticker book). « Comment jouer » est réécrite pour l'enfant en entier. Un test
  compare les nombres écrits en lettres à ceux du jeu (missions, vagues, étapes, joueurs,
  œufs, esquive).
- **L'œuf de l'index des serpents** disait « Un serpent en sort » ; il en sort deux, comme
  le dit déjà la fiche « Dangers ». Seul texte du jeu changé.
- **Page du jeu `/`.** Elle annonce maintenant le titre du lien partagé (les deux noms), la
  taille de l'image et `summary_large_image`. Ce que le site ajoute à la page : 914 octets
  sur 1 024.
- **Image de partage refaite.** Vague 8 d'une aventure classique jouée selon les règles par
  le script (alliés achetés avec les pièces gagnées, rien posé à la main), sans numéro de
  version ; titre sur deux lignes dans le carré central, lisible quand une messagerie rogne
  l'image ; texte alternatif propre à l'image ; cache long comme les autres fichiers. Un
  test lit ses dimensions.
- **Page parents.** Le lien du pied, qui menait au bloc déjà à l'écran, est retiré de cette
  page ; le lien PayPal est relié à sa phrase pour un lecteur d'écran ; le dernier bloc
  d'un nombre impair prend toute la largeur ; l'adresse de contact peut se couper ;
  « Lire les informations utiles » cite aussi la publicité et le soutien.
- **Page de confidentialité.** Les liens de son en-tête passent de 26 à 48 px de haut
  (style seul, texte inchangé) ; la recette les contrôle.
- **Garde-fous.** Le build s'arrête si le gabarit du jeu n'a plus la rangée qui reçoit le
  lien « À propos » (il le perdait sans rien dire) ; le test porte sur le vrai gabarit ; la
  recette contrôle aussi la largeur des liens (« Le jeu » faisait 45 px). Ce garde-fou a
  montré que le build habillait aussi les pages des recettes : seule la page du jeu l'est
  maintenant (`vite.config.ts`).
- **Publicité allumée (plus tard).** Son bouton décalait le « ? » de la sauvegarde et le
  lien « À propos » ; il prend maintenant sa propre ligne, et la recette publicitaire le
  mesure.
- **Divers.** Le lien « Aller au plateau » ne s'affiche plus à l'accueil du jeu, où il ne
  menait nulle part. `.htaccess` demande la compression des textes si l'hébergeur ne la
  fait pas déjà (deux modules exigés, sans effet s'ils manquent).

À décider par le parent (rien n'est fait) :

- Retirer « Soutenir le développement » du pied des pages écrites pour l'enfant (le menu
  « Pour les parents » suffirait) et nommer le lien du bloc « Soutenir sur PayPal (nouvel
  onglet) ».
- Ajouter « du jeu » à la phrase approuvée « que l'on peut couper dans « Pour les
  parents » », lue sur une page qui porte le même titre.
- Avant d'allumer la publicité : interdire au navigateur les fonctions publicitaires de
  profilage (`Permissions-Policy`), et adapter le contrôle du site en ligne, qui refuserait
  aujourd'hui la règle de sécurité de la page du jeu avec publicité.
- Textes du jeu trop petits pour un enfant qui lit lentement : traité le 18 novembre, sans
  décision à prendre (`ARCHITECTURE.md`, « Textes lisibles sur téléphone »). Restent les
  reformulations de phrases trop techniques, qui attendent l'accord du parent.

Questions pour le fils (ses règles) :

- Le serpent ninja : il esquive le premier coup. Il le voulait « aussi rapide que le Ninja,
  parfois il se téléporte dans le dos » (`GAME_DESIGN.md`). On garde l'esquive ou on essaie
  son idée ?
- Les noms de ses trois serpents ; les gardes du roi dans le voyage ; qui bat le
  spinosaure ; combien de pommes.

Non vérifié : aperçus réels dans les messageries ; compression et page 404 réelles de
l'hébergeur ; aucun lecteur d'écran réel ; rien sur un vrai téléphone ni avec les enfants.

### Deuxième relecture à huit angles — 18 novembre 2026

Mêmes huit angles, sur les deux lots suivants (corrections du site, textes lisibles sur
téléphone). Corrigé sans décision :

- **Image de partage** : le bandeau du titre cachait les serpents de la voie du bas. Le
  titre est maintenant posé en haut, sur l'en-tête de la page : tout le plateau reste
  visible, et l'interface française de l'en-tête n'apparaît plus sur les pages anglaises.
- **Écran anglais « Threats »** : « Voies ouvertes » restait en français, parce que deux
  textes étaient collés bout à bout ; c'est maintenant une seule phrase à trou.
- **Écran des cadeaux sur téléphone** : le clavier ne passe plus sur le plateau et les
  favoris cachés derrière le panneau ; l'anneau de focus est plus foncé sur le papier.
- **Documents** : phrases devenues fausses corrigées (pied de page de 8 pages et non 10,
  dates, index des documents, numéro de build dans le README).

Le détail du jeu (plaques du plateau, annonce) est dans `ARCHITECTURE.md`, « Textes lisibles
sur téléphone ».

À décider par le parent (rien n'est fait) :

- « pose un Archer, il le touche de loin » promet trop : mesuré sur le vrai moteur, 100
  départs, un Archer par voie — le serpent rare mord quand même 28 fois sur 100 à la vague
  8 et 100 fois sur 100 à la vague 11. Proposé : « un Archer peut le toucher avant qu'il
  morde ».
- « tu vois quels serpents arrivent, et par quel chemin » : « Dangers » ne dit que quels
  chemins sont ouverts.
- « quand tu commences une nouvelle Aventure classique » : aucun bouton ne dit
  « nouvelle » ; proposé : « Touche "La grande aventure" pour en commencer une nouvelle ».
- La page parents parle de l'application Android au présent, alors qu'elle n'est pas
  encore publique.
- `README.md` (racine) : « publicité rare entre missions » contredit la règle « jamais dans
  l'application ».
- Un seul mot pour la même jauge : « Camp », « cristal », « ♥ », « REFUGE ».
- Lot « montrer ce qui existe » (aucune règle touchée) : « Encourager » accessible pendant
  la vague, annonce à l'arrivée d'un nouveau serpent, annonce d'un allié débloqué ; textes à
  valider avec le fils.

Questions de plus pour le fils : la sauterelle, une fois qu'elle a sauté, vole-t-elle
encore ? Le serpent ninja qui se téléporte : une fois ou plusieurs, dans le dos de qui ?

### Troisième relecture à huit angles — 18 novembre 2026

Sur le lot précédent et sur le plan de celui-ci, avant qu'il soit écrit. Corrigé :

- **Page 404.** Une adresse qui ne mène nulle part reçoit une page dans les deux langues,
  avec le chemin du jeu et des pages publiques (`notFoundPageHtml`, `ErrorDocument 404` en
  chemin local pour garder le code 404). Sans script ni redirection, hors des résultats de
  recherche et du sitemap, sans encart ni compte publicitaire. Textes : « Cette page
  n'existe pas. L'adresse a peut-être changé. Le jeu, lui, est toujours là. » — à relire
  par le parent.
- **Contrôle du site en ligne.** « Publier le site » vérifie maintenant qu'une adresse
  inconnue répond 404 sans cookie, et signale (sans arrêter la publication) si la page ou
  le script ne sont pas servis compressés, ou si la page 404 n'est pas celle du build.
- **Aperçu de partage de la page du jeu** : adresse, type et texte alternatif de l'image
  ajoutés ; ce que le site ajoute à la page passe à 1 128 octets, pour un plafond relevé de
  1 024 à 1 280. Le bandeau du titre de l'image est opaque : l'interface ne se voit plus
  au travers.
- **Documents** : quatre phrases encore fausses corrigées (source du build 62, compte des
  documents, site publié avant le build 63, publicité décidée et non « repoussée »).

Le détail du jeu (annonce qui ne saute plus, « Esquive ! », plaque du refuge, clavier sur
l'écran des cadeaux, textes passés à 13 px) est dans `ARCHITECTURE.md`.

Le compteur d'étoiles de l'en-tête de l'accueil reste à 11 px sur téléphone : à 13 px il
prenait la place du nom du joueur, coupé quand quatre joueurs partagent l'appareil.

### Quatrième relecture à huit angles — 18 novembre 2026

Sur le lot précédent, en ligne, et sur le plan de celui-ci. Corrigé :

- **Plaque du refuge.** Sur tablette, le retour à la ligne laissait « % » seul ; sur
  téléphone, la deuxième ligne commençait par le point. Les deux lignes sont maintenant
  écrites (« REFUGE » / « 100 % »), sur téléphone seulement, et la plaque grandit vers la
  droite, où rien ne se pose ; ailleurs elle reste sur une ligne.
- **Annonce sous le plateau.** Relevée au-dessus de « Courage ! », elle ne redescendait
  plus : elle redescend une seule fois, une seconde après la fin de la plaque. La plaque
  « Confusion », agrandie, est poussée contre le bord gauche du plateau : une annonce longue
  la recouvrait de 15 à 37 px.
- **Version anglaise** : « 2 alliés hésitent » restait en français sur le plateau (deux
  textes collés) ; c'est une seule phrase à trou.
- **« Nouveau » du Voyage sur ordinateur** : l'étiquette, à droite du bouton, passait sous
  l'image des personnages ; elle est maintenant par-dessus.
- **Anneau de focus du plateau** : un deuxième trait restait d'un seul côté.
- **Accueil du jeu plus léger.** L'image des personnages est servie en WebP (30 Ko au lieu
  de 356), et l'onglet reçoit une icône de 48 px au lieu du même fichier de 356 Ko :
  premier chargement de 1 656 à 1 330 Ko, sans différence visible (mesure du relecteur).
  L'application gagne 325 Ko. `icon-512.png` reste la source et l'icône de la boutique.
- **Page du jeu** : sa description sert aussi aux liens partagés (une seule balise).
- **Page 404** : le titre anglais était plus grand que le titre français sur téléphone.
- **Ce que j'avais annoncé à tort** : sur téléphone, les étiquettes des chapitres de
  l'accueil étaient restées à 11 px (une autre règle l'emportait). Leur plancher est
  maintenant à 13 px.
- **Documents** : toutes les décisions en attente et les questions pour le fils sont
  rassemblées dans `PLAN-ACTUEL.md`, « Décisions qui attendent le parent » ; les listes des
  sections ci-dessus restent comme historique.

Reste à faire sans décision : poser un allié au clavier (le chemin est vérifié : les places
proposées sont toutes acceptées par le jeu, 211 poses rejouées), un test qui impose la
taille minimale à tous les textes du plateau, les annonces trop courtes pour être lues
lentement (1,7 s pour cinq mots), « Tu as des pièces, recrute ! » qui clignote. Les
symboles de menace des antres demandent des signes à choisir avec le fils.

Reste à faire sans décision : les symboles de menace à 11 px, poser un allié au clavier (la
conception est prête : flèches et Entrée sur le plateau, par le même chemin que le doigt),
quelques textes d'interface qui ne passent pas à 13 px sans revoir leur carte (détail des
cadeaux en 640×360, notes de « Dangers », verrou des caprices), l'icône de l'accueil du jeu
(356 Ko, 30 Ko en WebP).

À décider par le parent : le miel, « Réserve », les pastilles de soin et la garde du roi
n'ont pas la place de grandir là où ils sont ; il faut les raccourcir (par exemple garder
les secondes seules) ou les remplacer par une image.

### Publicité — textes approuvés le 17 novembre 2026, rien d'activé

La revue recommandait de ne pas activer la publicité ; le parent a décidé de poursuivre.
La politique de confidentialité a une section « Publicité sur le site Web » et deux phrases
reformulées (« sans publicité », « aucun cookie ») ; la page parents ne dit plus « sans
publicité ». Tout est décrit dans
[PUBLICITE-WEB-PROPOSITION.md](publication/PUBLICITE-WEB-PROPOSITION.md), avec l'ordre
d'activation. **Tant que `WEB_AD_DELIVERY` est sur `disabled`, le site ne charge aucun
script de Google et ne pose aucun cookie** : les contrôles de publication le vérifient
toujours. Les passages plus bas qui citent l'ancienne phrase de la politique décrivent le
texte du 14 novembre.

### Soutien Web actif — accord du16novembre2026

Le parent a créé et approuvé le lien public
https://www.paypal.com/ncp/payment/XXQ7BEAZQ3QZL : montant libre en CHF, paiement
ponctuel, sans adresse ou frais de livraison. L'outil ne propose pas de montants
suggérés. `SUPPORT_URL` dans `deploy/discovery.ts` référence exactement cette URL.
Un passage explicite de `null` à `discoveryPageHtml` permet encore de masquer le soutien.

Depuis le 17 novembre 2026, le lien de paiement « Soutenir le développement » /
« Support development » n'est plus que dans le bloc des pages parents FR/EN, avec la
mention réservée aux adultes, facultative, en CHF et sans avantage dans le jeu ; le pied
des 8 autres pages publiques mène à ce bloc, pas à PayPal (les pages parents, qui le
montrent, n'ont plus ce lien dans leur pied). Aucun SDK,
iframe, préchargement PayPal ou traitement de carte sur le site. Le lien ouvre un
nouvel onglet avec `noopener noreferrer nofollow`, sans profil ni code de partie.

Le panneau parents du jeu conserve sa taille : aucun lien de paiement ajouté dans
la coquille HTML du jeu. Depuis « Pour les parents » du jeu, « À propos du jeu » /
« About the game » mène aux pages publiques puis à « Pour les parents » / « For parents ». Le bloc dormant
qui aurait ajouté une ligne au panneau a été retiré ; le budget HTML reste32768octets
pour la page du jeu, et ce que le site y ajoute est compté à part (voir la revue du 17 novembre).

Le parent a approuvé les paragraphes de confidentialité FR/EN le16novembre2026,
documentés dans [SOUTIEN-WEB-PAYPAL-PROPOSITION.md](publication/SOUTIEN-WEB-PAYPAL-PROPOSITION.md).
La source unique et sa date sont actualisées ; les engagements précédents sont
préservés et comparés à l'archive. Les informations PayPal éventuellement reçues
par l'éditeur sont distinguées des données locales des enfants. Aucun anonymat
sur le reçu ni déductibilité fiscale promis. Aucun paiement réel effectué.

La recette vérifie30combinaisons page/taille, six ouvertures clavier interceptées
localement sans paiement, absence de requête externe avant clic et d'URL de
paiement dans les fichiers Android. L'identité sur un reçu réel et les frais débités
restent non vérifiés. La page PayPal peut proposer une interface partiellement
allemande malgré une préférence de navigateur fr-CH ; aucune langue imposée par
un paramètre non documenté.

Android utilise `dist-android/`, excluant toutes ces pages et liens. Les paquets Play déjà
construits restent intacts. Recette : `npm run test:discovery`, plus les contrôles des deux
compilations et le workflow de publication qui relit chaque page et le sitemap en ligne.

### Liaison AdSense — aucune diffusion à cette étape

Le parent a choisi AdSense comme fournisseur automatique et a communiqué son ID
public `pub-8498417364292905`. D’après le retour du parent, le domaine est validé et son examen Google demandé ;
ce retour ne constitue pas une approbation de diffusion. Cette étape publie uniquement :

- Dans le head de `/`, la meta `google-adsense-account` pour `ca-pub-8498417364292905`.
- `/ads.txt` : `google.com, pub-8498417364292905, DIRECT, f08c47fec0942fa0`.

La source est `deploy/adsenseVerification.ts` ; ces éléments sont injectés uniquement
par le build Web. Aucun script publicitaire, slot, cookie, requête vers Google,
assouplissement de CSP ou modification de la politique approuvée. Le jeu reste
actuellement sans annonces et l’APK reste hors périmètre. Ne pas confondre liaison
technique, approbation du site par Google et activation des annonces.

Dans AdSense : Sites → Ajouter un site → `snakeattacktd.com` → validation par Meta
(ou ads.txt si l’interface la propose) → Valider → Demander un examen. Le parent
termine les informations du compte directement dans Google si nécessaire. Aucun
mot de passe ou document personnel à transmettre à Codex. La publication du code
ne prouve pas que ces actions ont été faites ou que Google a approuvé le site.

La diffusion réelle sera un autre passage : emplacement manuel sur la page du jeu,
traitement enfant, gestion des données/consentements, textes FR/EN de confidentialité
et des pages parents revus et approuvés, recette avant activation. Les annonces qui
choisissent automatiquement leurs emplacements restent désactivées. Les pubs ne
seront pas ajoutées dans les remerciements. Sur S24, préserver l’espace de combat.

[Choix et sources](superpowers/specs/2026-11-16-adsense-verification-design.md).

- **Adresse unique** : `http://` et `www.` sont renvoyés vers `https://snakeattacktd.com`.
  La règle HTTPS interroge `%{HTTPS}` et `X-Forwarded-Proto`, comme le
  [guide d'Infomaniak](https://www.infomaniak.com/fr/support/faq/1961/forcer-le-https-ssl-de-lurl-affichee-par-le-navigateur-web)
  le prévoit pour éviter une boucle de redirection.
- **Cache** : les pages sont redemandées à chaque visite (`no-cache`), c'est ainsi qu'une
  nouvelle version arrive ; seuls les fichiers à empreinte de `assets/` sont gardés un an.
- **Accès direct** : `/confidentialite` est un dossier ; Apache renvoie vers
  `/confidentialite/` et sert la page. Le jeu n'a qu'une page, il n'y a pas d'autre adresse à
  actualiser.

## Réglé une fois par le parent (15 novembre 2026)

Fait : site `snakeattacktd.com` créé sur l'hébergement (Apache, sans application), `www` en
alias, certificat Let's Encrypt installé, adresses A et AAAA ajoutées à la zone DNS sans
toucher à la messagerie, compte FTP + SSH de déploiement avec une clé ed25519, quatre
secrets dans GitHub. Les étapes, pour les refaire ou changer de clé :

1. **Infomaniak, Manager** : créer le site `snakeattacktd.com` sur l'hébergement Web, activer
   le certificat SSL gratuit, et noter le dossier du site (souvent `sites/snakeattacktd.com`).
2. **Compte FTP + SSH** : en créer un pour le déploiement. Y déposer une clé publique
   **ed25519** (Infomaniak refuse les clés RSA), sur une seule ligne, dans
   `.ssh/authorized_keys` à la racine de l'hébergement
   ([guide](https://www.infomaniak.com/fr/support/faq/2054/se-connecter-avec-cle-ssh)).
   La clé privée ne va nulle part ailleurs que dans le secret GitHub ci-dessous.
3. **GitHub, Settings → Secrets and variables → Actions** du dépôt : créer quatre secrets.

   | Secret                 | Valeur                                                      |
   | ---------------------- | ----------------------------------------------------------- |
   | `INFOMANIAK_SSH_KEY`   | la clé privée ed25519, en entier                            |
   | `INFOMANIAK_SSH_HOST`  | l'hôte SSH donné par le Manager (`xxxx.ftp.infomaniak.com`) |
   | `INFOMANIAK_SSH_USER`  | le nom du compte FTP + SSH                                  |
   | `INFOMANIAK_SITE_PATH` | le dossier du site sur le serveur, sans barre finale        |

Aucun de ces secrets n'est dans le dépôt, ni connu de Claude ou de Codex.

## Publier

Onglet **Actions** de GitHub → **Publier le site** → **Run workflow** :

- `ref` : ce qu'on publie, `main` par défaut ;
- `confirmation` : écrire `PUBLIER` ;
- `prune` : à cocher seulement pour retirer du serveur les fichiers d'anciens builds.

Le workflow (`.github/workflows/deploy-site.yml`) ne se lance jamais seul. Il compile depuis
Git, passe `npm run verify`, écrit `version.json` (commit publié), envoie `dist/` par rsync,
puis relit le site avec `scripts/check-live-site.mjs` : version, en-têtes, redirections,
absence de cookie, et politique en ligne identique octet pour octet à celle du commit. Sans
`prune`, rien n'est retiré du serveur : une page restée ouverte pendant l'envoi retrouve ses
anciens fichiers.

Le même contrôle se lance à tout moment, sans rien modifier :

```sh
node scripts/check-live-site.mjs https://snakeattacktd.com
```

## Revenir en arrière

Relancer **Publier le site** avec, dans `ref`, le commit précédent : `version.json` en ligne
donne le commit publié, `git log` donne celui d'avant. Le site est entièrement reconstruit
depuis ce commit ; aucune donnée n'est à restaurer, le site n'en garde pas.

Si le site ne répond plus du tout après une publication (erreur 500), la cause probable est
une directive de `.htaccess` refusée par l'hébergeur : la retirer ou renommer le fichier
depuis le Manager rétablit le site, puis corriger `deploy/policy.ts`.

## Les sauvegardes ne suivent pas le changement d'adresse

Le jeu web garde tout dans le stockage du navigateur, qui est **propre à chaque adresse**.
Une famille qui jouait sur l'ancien site ne retrouve rien sur le nouveau, et rien ne peut
l'y transférer automatiquement. **L'application Android n'est pas concernée** : ses
sauvegardes ne dépendent pas du site.

Le passage se fait à la main, joueur par joueur, avec l'outil qui existe déjà (« Pour les
parents » → « Sauvegarde familiale ») :

1. sur l'ancien site, choisir le joueur, puis « Exporter mon aventure » ;
2. sur le nouveau site, recréer le joueur, puis « Retrouver un fichier familial ».

Le fichier contient l'aventure, les étoiles, les missions et les carnets du joueur actif. Il
ne contient **ni la liste des joueurs** (personnage, surnom), **ni le voyage en cours, ni son
record**, ni les réglages : ceux-là sont à refaire. Vérifié dans le code (`src/familyBackup.ts`)
et par `npm run test:family` ; pas essayé entre les deux vrais sites.

Texte proposé pour prévenir les familles sur l'ancien site, à faire valider par le parent
avant tout affichage (historique du lot initial) :

> **FR.** Le jeu déménage sur snakeattacktd.com. Tes parties restent sur cet ancien site :
> elles ne suivent pas toutes seules. Pour les emporter, demande à un parent d'ouvrir « Pour
> les parents », puis « Sauvegarde familiale », et d'exporter l'aventure de chaque joueur.
> Sur le nouveau site, il la retrouvera au même endroit. Le voyage en cours et les réglages
> sont à refaire.
>
> **EN.** The game is moving to snakeattacktd.com. Your games stay on this old site: they
> do not follow on their own. To take them along, ask a parent to open “For parents”, then
> “Family save”, and export each player's adventure. On the new site, they will restore it
> in the same place. The voyage in progress and the settings have to be set up again.

## Ce que l'hébergeur enregistre

Le jeu n'ajoute aucun outil de suivi et le site ne pose aucun cookie (contrôlé à chaque
publication). Mais un site n'est jamais sans données techniques : comme tout serveur Web,
l'hébergement Infomaniak tient des **journaux d'accès et d'erreurs**. D'après sa
[documentation](https://www.infomaniak.com/fr/support/faq/1926/afficher-les-logs-dacces-et-derreurs-web),
ils sont consultables dans le Manager et dans le dossier `ik-logs` de l'hébergement, et
conservés peu de temps : la page indique selon les versions « au moins 7 jours » ou « 10
jours au maximum ». Leur contenu exact (adresse IP, date, page demandée, navigateur) est à
relever dans `ik-logs` après la première publication ; il n'a pas été lu ici.

L'ancien site ajoutait à chaque page un script de protection de son hébergeur
(`/cdn-cgi/challenge-platform/…`). Le nouveau site n'en a pas : la page de confidentialité
ne charge aucun script.

**Dit dans la politique.** La page d'abord publiée décrivait l'application Android et ne
parlait pas des journaux du site. Le parent a accepté le 14 novembre 2026 d'y ajouter une
section « Site web » / « Website », dans les deux langues, placée avant le contact :

> **FR.** Le site snakeattacktd.com est hébergé par Infomaniak, en Suisse. Comme tout
> serveur Web, l'hébergeur enregistre dans des journaux techniques l'adresse IP, la date, la
> page demandée et le navigateur des visiteurs, pour faire fonctionner et protéger le
> service. Ces journaux sont conservés quelques jours par l'hébergeur. zyclope ne les
> utilise pas pour suivre les visiteurs et le site ne dépose aucun cookie.
>
> **EN.** The snakeattacktd.com website is hosted by Infomaniak, in Switzerland. Like any
> web server, the host records visitors' IP address, date, requested page, and browser in
> technical logs, to run and protect the service. The host keeps these logs for a few days.
> zyclope does not use them to track visitors, and the site sets no cookies.

Cette section ne devient vraie qu'une fois le site en ligne sur Infomaniak. Tant que
l'ancien site sert sa propre page, celle-ci ne la contient pas.

## La politique de confidentialité : une seule source

Ajout approuvé du16novembre2026 : section « Soutien facultatif sur le site Web » /
« Optional support on the website » et date actualisée. La fixture
`tests/fixtures/soutien-web-approuve-2026-11-16.json` fige ce texte ; la comparaison
historique ci-dessous retire uniquement cette section approuvée et vérifie encore
les anciens engagements. Le lien PayPal de paiement n'est pas dans cette politique.
Le prochain APK construit depuis cette source affichera aussi cette explication
sur le site ; aucun APK/AAB signé n'est livré pour ce lot Web.

`src/i18n/privacyPolicy.ts` contient le texte approuvé, en français et en anglais, repris mot
pour mot de la page publiée le 14 novembre 2026. La page publique
(`deploy/privacyPage.ts`) et la fenêtre « Confidentialité » de l'application
(`src/ui/privacy/`) en sortent toutes les deux.

- `tests/privacy-policy.test.ts` compare le texte à la page telle qu'elle était publiée
  (`tests/fixtures/confidentialite-publiee-2026-11-14.html`). Changer un mot fait échouer le
  test : c'est voulu. Une modification est une décision de l'éditeur, dans les deux langues,
  avec la ligne « Mise à jour » et la page de référence refaites ensemble.
- Le même test compare la version et le build cités par la politique à `package.json` et à
  `android/app/build.gradle`. **Un nouveau build Android demande donc de relire la politique
  et de mettre à jour `POLICY_APP`** dans `src/i18n/privacyPolicy.ts`.
- Ajouts à ce qui était publié, acceptés par le parent le 14 novembre 2026 : la ligne
  « Mise à jour : 14 novembre 2026 » (la page n'avait pas de date), la section « Site web »
  ci-dessus et, dans l'application seulement, le lien « Lire cette politique sur
  snakeattacktd.com ». Le test retire ces ajouts avant de comparer le reste à la page de
  référence, et vérifie la section « Site web » mot pour mot.

## Ce qui n'est pas vérifié

- Le site n'a pas été ouvert ni joué par une personne sur le nouveau domaine : le contrôle
  est automatique (réponses, en-têtes, redirections, texte de la politique).
- Le contenu réel des journaux de l'hébergeur (`ik-logs`) n'a pas été lu ; la section « Site
  web » de la politique s'appuie sur la documentation d'Infomaniak.
- La fenêtre de l'application sur le Galaxy S24 et l'ouverture des liens depuis l'APK.
  Le contenu du véritable APK61 a été contrôlé hors ligne FR/EN dans un navigateur, avec
  marges simulées ; cela ne remplace pas l’essai physique.
- Les liens de la fiche Google Play : à remplacer par le parent ou Codex par
  `https://snakeattacktd.com/confidentialite`.
- L’ancien site sert sa propre page de confidentialité, sans la section Infomaniak.
  Il affiche désormais l’avis de migration : voir ci-dessous.

## Point de livraison Codex — 15 novembre2026

- Android61 préparé : `versionCode`61 et `POLICY_APP.build`61, version0.38.0, même package
  et clé d’envoi. Texte et date de la politique inchangés. La comparaison actualise uniquement
  version/build attendus de la fixture historique, sans la modifier. Les nombres réellement
  affichés et les autres mots restent comparés, en plus du contrôle Gradle/package.json.
- Verify717tests, navigateur, audit13/13, menus5648 (170 confidentialité), hors ligne et
  sauvegarde familiale verts. Politique du vrai APK lisible hors ligne FR/EN à780×360
  avec marges simulées, texte exact, défilement et fermeture, sans requête extérieure.
- Pendant cette préparation, une autre session a déjà publié l’avis FR/EN sur l’ancien
  site : Sites37, source `fe8bd54c391f6ce54df2e0199ee41801b469862b`. Le contrôle avant
  publication a détecté ce changement distant : Codex a retiré son propre brouillon,
  conservé l’avis existant et n’a rien republié sur cet hébergement. Six contrôles locaux
  FR/EN, dont deux avec plusieurs profils, passent ; l’URL publique répond200 et contient
  l’avis. Les128fichiers préexistants hors index sont inchangés, politique comprise.
- La fiche Play n’est pas modifiée ici : aucun profil de navigateur authentifié Google
  disponible. Renseigner **https://snakeattacktd.com/confidentialite** depuis la session
  connectée du parent ; ni Alpha ni production activés.

Notes à coller dans Play :

```text
<fr-FR>
Nouveau dans « Pour les parents » : la politique de confidentialité se lit maintenant dans le jeu, même sans connexion.
</fr-FR>
<en-US>
New in “For parents”: the privacy policy can now be read inside the game, even offline.
</en-US>
```

### Publication du build61

PR55 et56 intégrées, publication manuelle « Publier le site »
[43698517225](https://github.com/zyclope0/snakeattak/actions/runs/43698517225) réussie depuis
main `099cebf07dcf9f119c05d9f792c43248aca1a88b`, sans purge. Le contrôle du workflow est
entièrement vert, politique exacte et redirections comprises. Les131fichiers distribués
comparés au build correspondent aux paquets Android (30MP3) ; `.htaccess` reste propre
au serveur Web. Le navigateur a parcouru accueil, confidentialité et camp FR/EN sur
1280×800,780×360 et812×375, sans erreur ou ressource manquante. Aucun essai humain revendiqué.
La CI complète de main43698515202 est encore en cours au dernier contrôle ; elle est
distincte des717tests et du contrôle de publication déjà passés.

## Encart manuel — préparation désactivée du 16 novembre 2026

Le conseil (architecture, QA, confidentialité, parent et deux âges d'enfants simulés)
retient un seul emplacement hors commandes, sans réduction du plateau. Ce conseil
ne remplace ni des essais avec les enfants ni une validation juridique.

- `npm run build:ads-preview`, puis `npm run preview -- --outDir dist-ads-preview` :
  aperçu local FR/EN, sans publicité réelle, sans script, iframe ou requête Google.
- `npm run test:ads-preview` : transitions, rotation tactile, langues et coordonnées
  exactes de recrutement après déplacement du plateau.
- Le calcul pur `src/ui/webAds/layout.ts` choisit un format 200×200, 180×150 ou
  234×60, avec 150 px entre la création et le plateau/HUD/dock. Aucun encart si
  la fenêtre est trop petite, tactile, agrandie, zoomée ou avec un dialogue ouvert.
- Le mode local a sa sortie dédiée `dist-ads-preview/`, à ne jamais publier.
  Les builds ordinaires Web, Android et portable n'embarquent ni cet aperçu ni
  le slot. Le contrôle `scripts/check-web-ad-disabled.mjs` le vérifie après build.
- Le contrat préparé dans `src/ui/webAds/contract.ts` conserve le client
  `ca-pub-8498417364292905`, le slot `7092707633`, le traitement enfant `1` et
  la pleine largeur `false`. Ce contrat n'effectue aucune demande d'annonce.

Avant toute diffusion : approbation Google, réglages enfant et catégories relus,
optimisation automatique revue, consentement applicable réellement testé et texte
FR/EN de confidentialité approuvé. Une annonce non personnalisée n'est pas une
preuve d'absence de cookies ; le signal enfant ne cloisonne pas un script tiers
vis-à-vis du DOM ou du stockage. La CSP et le texte approuvé restent inchangés.
Aucun SDK publicitaire Android, aucun formulaire fiscal ou paiement traité ici.
