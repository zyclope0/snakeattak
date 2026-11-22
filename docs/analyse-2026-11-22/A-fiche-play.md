# Fiche Google Play et publication d'un jeu pour enfants — référence sourcée

> Annexe de [ANALYSE-2026-11-22.md](../ANALYSE-2026-11-22.md). Rapport brut d'une recherche
> du 22 novembre 2026, gardé pour ses sources et ses mesures. Seul ce qui est repris dans
> l'analyse a été recoupé ; le reste est à vérifier avant d'être cité. Les chemins de travail
> cités (dossier « scratchpad ») n'existent plus.

Recherche du 22 novembre 2026, pour « La Conquête des Serpents » (jeu 6–10 ans, paysage, hors ligne,
sans publicité, sans achat, sans collecte, test fermé « Alpha »).

## Comment lire ce document

Chaque affirmation porte un niveau de preuve :

- **[D]** page officielle lue directement ce jour (seul `developer.android.com` était joignable).
- **[R]** page officielle Google lue seulement à travers l'extrait renvoyé par le moteur de
  recherche. Le fond est fiable, le mot à mot est à revérifier sur la page.
- **[V]** source d'un vendeur ou d'une agence ASO, lue par extrait de recherche. Indicatif, pas une norme.

**Limite importante.** Depuis cette session, `support.google.com`, `play.google.com`,
`android-developers.googleblog.com` et tous les sites ASO refusaient la connexion. Aucune fiche du
Play Store n'a donc pu être regardée : les images de Kingdom Rush, Bloons TD 6, Plants vs. Zombies,
Toca Boca, etc. ne sont **pas** décrites de visu ici (voir « Non confirmé »).

---

## A. Éléments de la fiche Play : spécifications officielles

### Icône

- 512 × 512 px, PNG 32 bits, sRGB, 1024 Ko au plus, carré plein ; Play applique lui-même le masque
  (rayon = 30 % de la taille) et l'ombre, donc ni coins arrondis ni ombre portée dans le fichier. [D]
  https://developer.android.com/google-play/resources/icon-design-specifications
- Interdits dans l'icône : texte ou graphisme indiquant un classement, une promotion ou une incitation
  à installer, la participation à un programme Play, ou tout élément trompeur. [D] (même page)

### Image de présentation (feature graphic)

- 1024 × 500 px, JPEG ou PNG 24 bits sans alpha ; obligatoire pour publier la fiche. [R]
  https://support.google.com/googleplay/android-developer/answer/9866151
- Où elle sert : pour les jeux, Play montre des groupes de jeux recommandés en grand format, avec
  vidéo et captures, et c'est là qu'il affiche l'image de présentation. [R] (même page)
- Elle sert aussi de couverture à la vidéo, avec un bouton lecture par-dessus. [R/V]
  (extrait attribué à la page 9866151 et repris par https://www.apptweak.com/en/aso-resources/google-play-store-aso-checklist)
- Recommandations : sujet principal vers le centre ; éviter blanc pur, noir et gris foncé (se fondent
  dans le fond de Play) ; pas d'image d'appareil ; pas de badge Google Play ni d'autre magasin ;
  adapter image et texte à chaque langue ; éviter ce qui se périme vite. [R]
  https://support.google.com/googleplay/android-developer/answer/1078870
- Mots à ne pas mettre : « Best », « #1 », « Top », « New », « Free », « Discount », « Sale »,
  « Million downloads » ; pas d'appel à l'action (« download now », « install now », « play now »,
  « try now »). [R] (même page)
- Critère qualité Android : l'image de présentation ne contient **ni image d'appareil, ni capture
  d'écran, ni petit texte illisible une fois réduite**, et ne ressemble pas à une publicité. [D]
  https://developer.android.com/docs/quality-guidelines/core-app-quality
- Statut des règles : les « Requirements » sont obligatoires (retrait ou suspension possibles) ; les
  « Highly recommended » rendent la fiche plus éligible aux recommandations, sans effet sur la page
  elle-même si on ne les suit pas. [R] (page 1078870)
- Depuis 2021, des éléments non conformes peuvent rendre l'appli inéligible à la promotion sur les
  grandes surfaces (accueil Apps et Jeux). [R, page de 2021]
  https://android-developers.googleblog.com/2021/04/updated-guidance-to-improve-your-app.html

### Captures d'écran téléphone

- 2 à 8 captures ; côtés de 320 à 3 840 px ; rapport jusqu'à 2,3:1 (9:16, 16:9, 20:9). [D]
  https://developer.android.com/google/play/requirements/screenshots-android-cli
- Pour la promotion : 4 captures ou plus en 1080p au moins ; **pour les jeux : 3 ou plus en 16:9 ou
  9:16**. [D] (même page)
- Formulation de l'aide : pour un jeu, au moins trois captures 16:9 paysage (1920 × 1080 px minimum)
  ou trois 9:16 portrait (1080 × 1920 px minimum). [R] (page 9866151)
- Format JPEG ou PNG 24 bits sans alpha. [R/V] (page 9866151, repris par
  https://appradar.com/blog/android-app-screenshot-sizes-and-guidelines-for-google-play)

### Tablettes, pliables, ordinateur

- Tablettes 7 et 10 pouces : jusqu'à 8 chacune, rapport jusqu'à 2,3:1, 1 080 à 3 840 px. [D]
  (page screenshots-android-cli)
- Ordinateur / Chromebook : 4 à 8, 16:9 exact (1 920 à 7 680 px de large) ou 9:16. [D] (même page)
- Pliables : 3 à 8, avec au moins une en 1:1 et une en 4:3. [D] (même page)
- L'aide recommande au moins 4 captures pour tablette et Chromebook. [R] (page 9866151)

### Contenu des captures

- Montrer l'expérience réelle dans le jeu ; une accroche seulement si elle est nécessaire, et le
  moins de texte possible ; un jeu de captures par langue si elles portent du texte. [R]
  https://support.google.com/googleplay/android-developer/answer/13393723
- Pas de classement (« #1 », « Popular »), pas de prix ni de promotion, rien qui déforme ce que fait
  le jeu. [R] (même page)
- Captures et vidéos ne montrent pas d'appareil non Android et ne présentent pas le contenu de façon
  trompeuse. [D] (page core-app-quality)
- Texte alternatif conseillé sur les captures. [R]
  https://support.google.com/googleplay/android-developer/answer/4448378

### Vidéo de présentation

- Une adresse YouTube (pas une liste ni une chaîne), vidéo publique ou non répertoriée, sans limite
  d'âge, monétisation coupée, intégrable. [R/V] (page 9866151, repris par
  https://www.gummicube.com/blog/google-play-store-preview-video-guidelines/)
- Paysage recommandé, non imposé. [V] (même source)

### Textes

- Nom : 30 caractères ; description courte : 80 ; description complète : 4 000. [R]
  https://support.google.com/googleplay/android-developer/answer/9859152
- Titre, icône, nom du développeur : pas d'émoji ni de caractères spéciaux répétés, pas de tout en
  majuscules sauf marque, aucune mention de classement, de prix, de promotion ou de programme Play. [R]
  https://support.google.com/googleplay/android-developer/answer/9898842
- Description : ni « free » ou « discount », ni « #1 » ou « Best » ; les mots-clés répétés ou hors
  sujet peuvent mener à une suspension. [R] (pages 9859152 et 9898842)

### Langues (FR et EN)

- On ajoute ses propres traductions et ses images par langue (« Manage translations ») ; une
  traduction automatique gratuite existe, non relue par un humain. [R]
  https://support.google.com/googleplay/android-developer/answer/9844778

### Fiches personnalisées et tests A/B

- Fiches personnalisées : jusqu'à 50 ; ciblage par pays, préinscription, mots-clés de recherche,
  utilisateurs inactifs, adresse dédiée ou campagne Google Ads ; il faut d'abord une fiche principale
  et une appli publiée ; pas de traduction automatique. [R]
  https://support.google.com/googleplay/android-developer/answer/9867158
- Tests de fiche : un test « default graphics » ou jusqu'à cinq tests localisés à la fois ; icône,
  image de présentation, captures ; arrêt automatique après 6 mois ; Google conseille au moins une
  semaine et un seul élément testé à la fois. [R]
  https://support.google.com/googleplay/android-developer/answer/12053285
- Pour une toute petite appli : aucun seuil de trafic publié. Le test porte sur les visiteurs de la
  fiche, donc peu de visiteurs = pas de résultat exploitable (déduction, pas une règle écrite).

---

## B. Comment les jeux composent leurs images

### Ce que dit Google

- Captures de l'expérience réelle, texte minimal, pas de cadre d'appareil. [R] (pages 13393723 et 1078870)
- L'image de présentation ne contient pas de capture d'écran. [D] (page core-app-quality)

### Le motif relevé dans les analyses ASO

- Armello et Teamfight Tactics : une image du jeu dans un grand cadre, un texte d'accroche en bas, un
  personnage sur le côté (4 captures sur 5 pour Armello). [V]
  https://www.gummicube.com/blog/armello-app-store-screenshot-spotlight
  https://www.gummicube.com/blog/teamfight-tactics-app-store-screenshot-spotlight
- Genshin Impact : un personnage différent sur le côté de chaque image, avec une phrase de valeur
  dessous. [V] https://www.gummicube.com/blog/genshin-impact-screenshots-spotlight
- Clash of Clans : surtout du jeu réel, plus des accroches simples par fonction ; parfois des
  personnages au premier plan. Clash Royale : plus épuré, personnages discrets. Étude de 14 jeux de
  stratégie ; mots fréquents : unleash, epic, battle, team-up, defense/protect, build. [V]
  https://geeklab.app/posts/aso-breakdown-aso-trends-in-real-time-strategy-games/
- Guide Yellowhead 2024 : les personnages sont montrés à côté du jeu ou d'une fonction ; captures
  « affiche » en début ou fin de série ; légendes brèves. [V]
  https://www.yellowhead.com/wp-content/uploads/aso-creative-gaming-trends-2024.pdf

### Jeux pour enfants

- Toca Boca World, Barbie Dreamhouse Adventures, Avatar World (App Store US, juin 2024) : icônes et
  captures menées par les personnages. [V]
  https://geeklab.app/posts/aso-breakdown-top-3-kids-life-simulator-apps/
- Toca Life World (octobre 2020) : six captures, les mêmes sur les deux magasins, texte court dans un
  cartouche, personnages à côté, série saisonnière Halloween. [V, ancien]
  https://www.gummicube.com/blog/toka-app-store-screenshots/
- Conseil général : chaque capture met en avant une fonction ou un bénéfice, en gardant énergie et
  plaisir. [V] https://www.gummicube.com/blog/aso-best-practices-for-promoting-kids-apps
- YouTube Kids (juillet 2026) : titre au-dessus des captures jugé trop petit pour être lu en
  défilant. [V] https://www.gummicube.com/blog/app-store-optimization-tips-for-youtube-kids

### Légendes, lisibilité, ordre

- 4 à 5 mots : repère d'Appfigures, pas une mesure. [V]
  https://appfigures.com/resources/aso/optimizing-screenshots-creatives
- Aggretsuko : jusqu'à 14 mots par image, signalé comme trop long. [V]
  https://www.gummicube.com/blog/aggretsuko-app-store-screenshots
- Texte assez grand pour un petit écran ; palette cohérente avec l'identité du jeu. [V]
  https://www.apptweak.com/en/aso-blog/best-aso-practices-for-your-app-game-creatives
- Seuls 9 % des utilisateurs font défiler les captures (17 % pour les jeux) : les trois premières,
  ou la première en paysage, sont les seules vues par la plupart. [V]
  https://www.appsflyer.com/blog/tips-strategy/app-store-screenshots/
- Sur Google Play, portrait et paysage à peu près à égalité pour les jeux « casual ». [V]
  https://www.apptweak.com/en/aso-blog/creatives-trends-for-top-casual-mobile-games
- 63 % des jeux mobiles en paysage (chiffre Storemaven cité par Udonis). [V]
  https://blog.udonis.co/mobile-marketing/mobile-games/app-store-screenshots

### Jeux nommés dans la demande

- Kingdom Rush : étude App Radar annonçant +300 % d'installations avec des visuels testés en A/B ;
  le détail des images n'est pas dans l'extrait. [V]
  https://appradar.com/case-studies/kingdom-rush-how-we-3x-d-installs-for-the-biggest-tower-defense-game
- Bloons TD 6, Plants vs. Zombies, LEGO DUPLO World, Pok Pok, Sago Mini, PBS Kids Games, Khan Academy
  Kids : aucune description vérifiable trouvée.

---

## C. Politique Familles et applis pour enfants

- Déclarer le public cible par tranches d'âge avant de publier ; ne cocher plusieurs tranches que si
  l'appli est vraiment conçue pour chacune. [R]
  https://support.google.com/googleplay/android-developer/answer/9867159
- Dès qu'une tranche inclut des enfants, la politique Familles s'applique ; y manquer peut entraîner
  retrait ou suspension. [R] https://support.google.com/googleplay/android-developer/answer/9893335
- Appli visant seulement des enfants : pas de transmission d'identifiant publicitaire ni
  d'identifiants matériels, pas de permission de localisation, aucun SDK non approuvé pour les
  services destinés aux enfants. [R] (même page)
- Publicité : uniquement par SDK auto-certifié Familles, jamais personnalisée ; écran d'âge neutre
  pour un public mixte. [R] (même page)
- Sans publicité ni SDK, ces trois volets (SDK certifié, écran d'âge, formats d'annonce) sont sans
  objet (déduction du champ de la règle).
- « Designed for Families » a été fondu dans la politique Familles le 16 novembre 2022. [R, 2022]
  https://android-developers.googleblog.com/2022/11/helping-kids-and-families-find-high-quality-apps-for-kids.html
- Onglet Enfants : toutes les applis qui y figurent sont « Teacher Approved » ; toute appli conforme
  à la politique Familles peut être examinée, sans garantie. [R, 2022] (même page)
- Teacher Approved : mise en file automatique ; des experts notent qualité et adéquation à l'âge
  (conception et attrait, développement sain avec ou sans visée éducative, effet des pubs et achats).
  Exclus : jouet physique requis, apprentissage des langues, usage avec un adulte, usage en classe,
  fonctions sociales entre enfants. Appli publiée et sans action de politique en cours. [R]
  https://support.google.com/googleplay/android-developer/answer/10075896
- Sécurité des données : formulaire et lien vers une politique de confidentialité obligatoires même
  sans aucune collecte ; les deux peuvent dire qu'aucune donnée n'est collectée ni partagée. Seul le
  test interne en est dispensé. [R]
  https://support.google.com/googleplay/android-developer/answer/10787469
- Politique de confidentialité : lien dans la Play Console **et** lien ou texte dans l'appli ; pour
  une appli visant des enfants, lien sur la fiche et dans l'appli quelles que soient les données. [R]
  https://support.google.com/googleplay/android-developer/answer/10144311
  https://support.google.com/googleplay/android-developer/answer/9859455
- Classification : questionnaire IARC obligatoire et gratuit ; une appli non classée peut être
  retirée ; à refaire si le contenu change. [R]
  https://support.google.com/googleplay/android-developer/answer/9898843
- Vérification des développeurs Android entrée en vigueur le 30 septembre 2026 (d'abord Brésil,
  Indonésie, Singapour, Thaïlande) ; Google demande de contrôler sur l'accueil de la Play Console
  que chaque appli est bien enregistrée. [D] https://developer.android.com/distribute/play-policies

---

## D. Processus de publication

- Test interne : jusqu'à 100 testeurs, diffusion en quelques minutes. Test fermé : listes d'adresses
  (200 listes de 2 000). Test ouvert : visible sur Play, tout le monde peut rejoindre. Les retours de
  test ne touchent pas la note publique. [R]
  https://support.google.com/googleplay/android-developer/answer/9845334
- **Règle des 12 testeurs** (comptes personnels créés après le 13 novembre 2023) : au moins
  12 testeurs inscrits au test fermé au moment de la demande, inscrits sans interruption depuis
  14 jours. Puis « Apply for production » et un questionnaire en trois parties. [R]
  https://support.google.com/googleplay/android-developer/answer/14151465
- Rapport de pré-lancement : produit à chaque envoi, selon la capacité du laboratoire ; un robot
  parcourt l'appli quelques minutes sur un ensemble d'appareils ; stabilité, performance,
  accessibilité, sécurité. La liste des appareils n'est pas publiée. [R]
  https://support.google.com/googleplay/android-developer/answer/9842757
- **Android vitals**, seuils qui réduisent la visibilité : plantages perçus 1,09 % en moyenne et 8 %
  par modèle de téléphone ; ANR perçus 0,47 % et 8 % ; moyenne sur 28 jours ; avertissement possible
  sur la fiche. [D] https://developer.android.com/google/play/vitals
- Mémoire et optimisation du code : effet possible sur la visibilité à partir de février 2027. [D]
  (même page)
- Déploiement par étapes : pourcentage réglé à la main, arrêt possible ; ceux qui ont déjà la version
  la gardent. [R] https://support.google.com/googleplay/android-developer/answer/6346149
- **Niveau d'API cible** : depuis le 31 août 2026, nouvelles applis et mises à jour visent Android 16
  (API 36) ; report possible jusqu'au 1er novembre 2026, donc échu. [D]
  https://developer.android.com/google/play/requirements/target-sdk
- **Pages de 16 Ko** : obligatoire pour les applis visant Android 15 et plus ; à partir du
  1er février 2027, une mise à jour non compatible ne peut plus être publiée. Sans bibliothèque
  native (pas de dossier `lib`), l'appli est déjà compatible. [D]
  https://developer.android.com/guide/practices/page-sizes
- **Bord à bord** : imposé sur Android 15 pour une cible API 35 ; avec une cible API 36, l'option de
  refus est désactivée. [D]
  https://developer.android.com/about/versions/15/behavior-changes-15
  https://developer.android.com/about/versions/16/behavior-changes-16
- Orientation imposée ignorée sur écrans de 600 dp et plus pour une cible API 36, **sauf pour les
  jeux** (drapeau `android:appCategory`). [D] (page behavior-changes-16)
- Taille : App Bundle obligatoire ; téléchargement compressé de 4 Go au plus. [D]
  https://developer.android.com/guide/app-bundle
- Avis dans l'appli : demande le Play Store sur l'appareil et la bibliothèque Play Core 1.8.0 ou
  plus, avec un quota. Ce serait l'ajout d'une bibliothèque. [D]
  https://developer.android.com/guide/playcore/in-app-review
- Notes de version : 500 caractères par langue. [R]
  https://support.google.com/googleplay/android-developer/answer/9859348
- Cibles tactiles de 48 dp au moins. [D] (page core-app-quality)

---

## E. Bases de l'ASO pour un petit jeu non commercial

- Classement de recherche : mélange de notes, avis, téléchargements et autres facteurs ; titre
  unique ; description sans bourrage, l'essentiel en premier. [R] (page 4448378)
- Catégorie et étiquettes : cinq étiquettes au plus, compréhensibles par quelqu'un qui ne connaît pas
  le jeu ; ne les changer qu'après un changement important. [R]
  https://support.google.com/googleplay/android-developer/answer/9859673
- Catégories de jeux relevées : Action, Adventure, Arcade, Board, Card, Casino, Casual, Educational,
  Music, Puzzle, Role Playing, Simulation, Sports, Strategy, Trivia, Word (liste d'un tiers, peut-être
  incomplète). Aucune catégorie « Enfants » n'y figure : la surface enfants est l'onglet Enfants. [V]
  https://serpapi.com/google-play-games-categories
- Note affichée calculée sur les notes les plus récentes. [R]
  https://support.google.com/googleplay/android-developer/answer/138230
- Mise en avant « Indie Games Corner » : équipe de 1 à 15 personnes, note moyenne de 3,8 ou plus. [R]
  https://support.google.com/googleplay/contact/indie_corners
- Chiffres de vendeurs à prendre comme arguments commerciaux : 4–5 mots (Appfigures), 9 % / 17 %
  (AppsFlyer), 63 % (Storemaven), +300 % (App Radar), 4,68 étiquettes par jeu (AppTweak,
  https://www.apptweak.com/en/aso-blog/a-closer-look-at-the-impact-of-google-play-tags).

---

## F. Motifs fréquents de refus ou de retrait

Aucun classement par fréquence n'a été trouvé ; ce sont les cas cités par les politiques.

1. Public cible mal déclaré, ou fiche qui s'adresse aux enfants alors que le contenu ne convient
   pas. [R] (page 9893335)
2. SDK ou publicité non conformes à la politique Familles. [R] (même page)
3. Identifiants transmis ou permission de localisation dans une appli pour enfants. [R] (même page)
4. Politique de confidentialité absente, inexacte, ou absente de l'appli. [R] (pages 10144311, 9859455)
5. Formulaire Sécurité des données manquant ou contredit par l'appli. [R] (page 10787469)
6. Métadonnées : mots-clés répétés, mentions de classement ou de prix, images trompeuses. [R]
   (page 9898842)
7. Appli qui plante, ne se lance pas, ou au contenu trop mince. [R]
   https://support.google.com/googleplay/android-developer/answer/14983486
8. Classification de contenu absente. [R] (page 9898843)
9. Niveau d'API cible périmé. [D] (page target-sdk)

---

## Non confirmé

- Aucune fiche Play Store vue : composition réelle des images de Kingdom Rush, Bloons TD 6, Plants
  vs. Zombies, Toca Boca, LEGO DUPLO World, Pok Pok, Sago Mini, PBS Kids Games, Khan Academy Kids.
- Mot à mot de toutes les pages `support.google.com` (niveau [R]).
- Zone de sécurité chiffrée de l'image de présentation : aucune valeur officielle trouvée.
- Poids maximal d'une capture (8 Mo cité une fois) ; bornes tablette (3 840 px lu directement,
  7 680 px dans des extraits).
- Durée de la vidéo (30 s à 2 min selon des vendeurs, non confirmé par Google).
- Nombre de variantes d'un test de fiche ; usage des tests et des fiches personnalisées pendant un
  test fermé ; seuil de trafic.
- Libellés exacts des tranches d'âge (seul « Ages 5 & Under » confirmé).
- Français parmi les langues acceptées par Teacher Approved.
- Délai d'examen de la demande de production (environ 7 jours selon des tiers).
- Déploiement par étapes possible ou non pour la toute première version de production.
- Nombre de notes requis avant affichage de la note.
- Définitions officielles des catégories Strategy, Educational, Casual.
- Avis dans l'appli sans permission INTERNET : non précisé par la page.
