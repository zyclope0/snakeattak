# C — Page d'accueil : standards et pratiques du domaine (référence sourcée)

> Annexe de [ANALYSE-2026-11-22.md](../ANALYSE-2026-11-22.md). Rapport brut d'une recherche
> du 22 novembre 2026, gardé pour ses sources et ses mesures. Seul ce qui est repris dans
> l'analyse a été recoupé ; le reste est à vérifier avant d'être cité. Les chemins de travail
> cités (dossier « scratchpad ») n'existent plus.

Recherche du 22 novembre 2026. Objet : savoir contre quoi juger l'écran d'accueil de « La Conquête
des Serpents » (6–10 ans, paysage téléphone d'abord), avant de le changer. Ce document ne juge pas
l'écran actuel ; il donne la règle et la source.

## Comment lire ce document (niveau de preuve)

L'environnement de cette session ne laisse sortir le réseau que vers quelques hôtes. Seuls
`developer.apple.com` et `developer.android.com` ont pu être lus directement. Tous les autres sites
(nngroup.com, joanganzcooneycenter.org, support.google.com, play.google.com, developers.google.com,
gameaccessibilityguidelines.com, learn.microsoft.com, m3.material.io, w3.org, gameuidatabase.com,
wikis de jeux, github.com/bbc) ont été refusés ; leur contenu vient d'extraits renvoyés par le moteur
de recherche. Chaque affirmation porte donc une marque :

- **[P]** page primaire lue directement pendant cette session (citation exacte possible).
- **[E]** source primaire, mais connue seulement par l'extrait du moteur de recherche (la page n'a
  pas été ouverte). Le sens est fiable, le mot à mot est à revérifier avant de le citer ailleurs.
- **[2]** source secondaire (presse, blog de praticien, wiki de fans, fiche de boutique).
- **[calcul]** déduction arithmétique de ma part à partir de chiffres sourcés ; ce n'est pas une source.

Les citations sont laissées en anglais, telles que lues.

---

## 1. Interface pour enfants de 6 à 10 ans : ce que dit la recherche

### 1.1 Nielsen Norman Group (études d'utilisabilité, 125 enfants de 3 à 12 ans, 2001/2010/2018)

- **Tranches d'âge étroites.** NN/g recommande au moins trois groupes (3–5, 6–8, 9–12) et observe que
  les enfants réagissent mal à un contenu fait pour « even one school grade below or above their own
  level ». [E] https://www.nngroup.com/articles/childrens-websites-usability-issues/
  → 6–10 ans chevauche deux groupes NN/g : il faut viser le plus jeune pour l'usage (6–8) sans faire
  « bébé » pour les 9–10.
- **Lecture.** Tableau NN/g : « Reading: not at all (youngest children), tentative (young children),
  scanning (older children) ». [E] même URL.
- **Taille du texte.** Même tableau : « Font size: 14 point (young children), 12 point (older
  children) » (adultes : 12). [E] même URL. Chiffres issus d'études Web ; pas de valeur donnée pour un
  téléphone en paysage.
- **Défilement.** « Scrolling: Avoid (young children), Some (older children) ». [E] même URL.
- **Retour.** Les jeunes enfants utilisent un bouton retour **quand il est bien visible dans
  l'interface**, pas celui du navigateur. [E] même URL.
- **Longues consignes ignorées.** « Kids skipping the long paragraphs of instructions » (U.S. Mint
  Kids, puis de nouveau sur Roblox huit ans après) ; à l'inverse, « As long as the site offered clear
  instructions with images, 7–9-year-olds had no trouble ». [E] même URL.
- **Conventions et cohérence.** « comply with UI conventions and employ a consistent design within
  your site or app ». [E] même URL.
- **Son et animation attendus.** « Kids expected some sites to play sound or have animation » (deux
  filles de 8 ans cherchent plusieurs minutes à déclencher son et animation). [E] même URL.
- **Publicité / petites cibles.** Deux enfants de 7 ans n'arrivent pas à fermer une publicité dont la
  croix fait 5 mm ; un toucher à côté ouvre la boutique d'applications. [E] même URL. (Sans objet ici
  — pas de publicité dans l'application — mais la leçon vaut pour toute petite croix de fermeture.)
- **Cibles tactiles.** « We recommend at least 2cm × 2cm touch targets for young children (4 times
  bigger than the 1cm x 1cm recommended target size for adult users). » [E]
  https://www.nngroup.com/articles/children-ux-physical-development/ ; base adulte 1 cm × 1 cm : [E]
  https://www.nngroup.com/articles/touch-target-size/
- **Gestes.** Toucher et balayer de grandes cibles : faciles pour tous ; glisser-déposer fin : dur
  pour les jeunes. Vers 11 ans, mêmes capacités physiques que l'adulte. Avant 9 ans, sur ordinateur :
  clics simples, pas de glisser ni de petites cibles. [E] même URL et
  https://www.nngroup.com/articles/childrens-websites-usability-issues/
- **Cognition.** Les consignes sont prises au pied de la lettre : « Instructions should be tailored
  to the kids' level of understanding » ; s'appuyer sur ce que l'enfant connaît déjà (objets
  familiers) ; des icônes abstraites échouent (« Young kids didn't know what the "redo" and "undo"
  buttons did ») ; avant 6 ans un retour discret n'est pas remarqué. [E]
  https://www.nngroup.com/articles/kids-cognition/
- **Nombre d'entrées d'un menu.** NN/g dit seulement que ces questions dépendent des limites du
  cerveau plus que de la technologie ; **aucun nombre** n'est donné dans les extraits. [E]
  https://www.nngroup.com/articles/childrens-websites-usability-issues/ — le rapport complet (156
  règles) est payant : https://www.nngroup.com/reports/children-on-the-web/

### 1.2 Sesame Workshop, « Best Practices: Designing Touch Tablet Experiences for Preschoolers » (2012)

Document : https://joanganzcooneycenter.org/wp-content/uploads/2020/02/SesameWorkshop-2012.pdf
(plus de 50 études ; PDF non lu, contenu connu par la presse de l'époque).

- Le toucher simple est le geste le plus intuitif ; pincer, incliner, double toucher, multi-doigts
  sont difficiles. [2] https://appleinsider.com/articles/12/12/24/sesame-workshop-wants-to-improve-ipad-apps-for-kids-with-free-developer-guidelines
- Les enfants posent les poignets sur le bord bas : les icônes et zones actives du bas déclenchent
  des sorties involontaires ; Sesame a remonté ces zones en haut. [2] même URL et
  https://licensinginternational.org/news/sesame-workshop-shares-tips-for-creating-touch-screen-content-for-preschoolers
- « Children expect immediate feedback from their touch. Sound effects are an effective way to
  communicate input registration. » [2] (citation rapportée) même URL.
- Dialogue et renfort visuel plutôt que texte (« Provide context-specific dialogue and visual
  reinforcements to help preschoolers who usually cannot read »). [2]
  https://licensinginternational.org/news/sesame-workshop-shares-tips-for-creating-touch-screen-content-for-preschoolers
- Les enfants tiennent spontanément la tablette en paysage. [2] même URL.

**Ce qui se transpose aux 6–10 ans** : retour immédiat et sonore, toucher simple, redondance
voix + image, pas de sortie accidentelle. **Ce qui ne se transpose pas tel quel** : l'absence totale
de texte (les 6–10 ans lisent, « tentative » puis « scanning » selon NN/g) et la règle « rien en
bas » (établie sur tablette posée, avec des 2–5 ans ; non vérifiée pour un téléphone tenu à deux
mains).

### 1.3 Google : familles, « Teacher Approved », « Building for kids »

- Critères Teacher Approved : âge, qualité de l'expérience, enrichissement, plaisir (« delight »).
  Deux formulations utiles pour un écran d'accueil : « The user interface design is easy for children
  in the target age group(s) to use and understand » et « Visuals are high quality, appropriate, and
  attractive for children in the target age group(s) ». [E]
  https://play.google.com/console/about/programs/teacherapproved/ et
  https://support.google.com/googleplay/android-developer/answer/10075896
- « Ensure that your app is usable for the intended age, including navigation, visuals, and text or
  voice-over. » [E] https://support.google.com/googleplay/android-developer/answer/10075896
- L'application n'a pas à être éducative, seulement « enriching ». [E] même URL. Réserve : des
  chercheurs jugent ces critères vagues et les évaluateurs anonymes. [2]
  https://theconversation.com/google-promotes-teacher-approved-apps-for-kids-heres-what-parents-should-know-278663
- Guide « Designing engaging apps » (Building for kids) : navigation par icônes **toujours
  visible** ; éléments déjà connus (« home buttons and back arrows ») ; éviter les boutons en texte
  seul (exclut les non-lecteurs) ; cibles « big enough so kids still developing their motor skills
  can easily interact with them » ; les enfants tiennent l'appareil autrement que l'adulte ; éviter
  multi-doigts, double toucher, pincement ; prévoir une **zone réservée aux parents** qui explique
  le fonctionnement et regroupe les réglages. [E]
  https://developers.google.com/building-for-kids/designing-engaging-apps
- Qualité Android, commune à toute application : « Touch targets are at least 48 dp » ; contraste
  3:1 (grand texte, graphismes) et 4,5:1 (petit texte, moins de 18 pt ou 14 pt gras) ; indicateur de
  progression si le démarrage dépasse deux secondes. [P]
  https://developer.android.com/docs/quality-guidelines/core-app-quality

### 1.4 Apple : catégorie Enfants

- Tranches : 5 ans et moins, 6–8, 9–11. [P] https://developer.apple.com/kids/
- Barrière parentale : « These are adult-level tasks that must be completed in order to continue
  using your app or game. » Elle protège les achats et les liens sortants. Exemples montrés : une
  tâche de calcul, une question à laquelle répondre. « If your app is intended for pre-literate
  children, consider using a voiceover prompt to help kids know that they need to involve their
  parent. » [P] https://developer.apple.com/kids/
- Règle 1.3 : liens sortants, achats et « other distractions » seulement « reserved for a
  designated area behind a parental gate ». [E]
  https://developer.apple.com/app-store/review/guidelines/#kids-category
- Apple ne décrit **pas** ce qu'est une « bonne » barrière au-delà de « tâche de niveau adulte ».
  Aucune étude mesurant l'efficacité des barrières (calcul, glissement, appui long) n'a été trouvée.

### 1.5 Debra Levin Gelman, « Design for Kids » (Rosenfeld, 2014)

- Tranches de deux ans ; chapitre 6 « Kids 6–8: The Big Kids », chapitre 7 « Kids 8–10: The "Cool"
  Factor ». [E] https://rosenfeldmedia.com/books/design-for-kids/
- Titres de sections du chapitre 6–8 visibles en aperçu : « Outside Influences », « Leveling Up »,
  « Explain, Explain, and Explain Again », « We Need Some Stinkin' Badges ». [2]
  https://www.scribd.com/book/500164090/Design-For-Kids-Digital-Products-for-Playing-and-Learning
- Entretien de l'autrice : monter de niveau compte beaucoup à 6–8 ans, âge où l'on craint de
  paraître « babyish ». [2] https://uxpod.com/episodes/design-for-kids-an-interview-with-debra-levin-gelman.html
- Résumé de lecteur : les 6–8 ans aiment connaître les règles, veulent bien faire et veulent les
  consignes d'emblée. [2] https://www.vickyteinaki.com/blog/born-digital-app-design-kids/
- Le texte même des chapitres 6 et 7 n'a pas été lu.

### 1.6 Droits de l'enfant et pratiques manipulatrices

- Guide D4CR (avec l'UNICEF) : 10 principes en trois thèmes (inclusion ; jeu et apprentissage ;
  sécurité et durabilité). Formulés pour un menu : « Everyone can use », « Use communication children
  can understand », « Help children recognise and understand commercial activities », ne pas
  détourner les données. Liste complète non vérifiée. [E] https://childrensdesignguide.org et
  https://joanganzcooneycenter.org/2022/09/26/the-designing-for-childrens-rights-guide/
- Code britannique (ICO), norme 13 : pas de « nudge techniques » poussant l'enfant à livrer des
  données ou à baisser ses protections ; encourager au contraire pauses et sauvegardes. [E]
  https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/13-nudge-techniques/
- Radesky et al., JAMA Network Open 2022 (133 applications, 160 enfants de 3–5 ans) : seulement 20 %
  des applications sans procédé manipulateur (pression parasociale d'un personnage, fausse urgence,
  navigation contrainte, appâts). [E] https://pmc.ncbi.nlm.nih.gov/articles/PMC9206186/
  → Les interdits du projet (ni minuteur, ni récompense de retour, ni classement) sont exactement
  ceux que cette littérature désigne. Une mascotte d'accueil ne doit donc ni supplier ni culpabiliser.

### 1.7 Travaux universitaires utiles

- Cibles tactiles : Anthony et al. (ITS 2012, 49 enfants de 7–17 ans et 36 adultes) — les enfants
  touchent plus souvent hors cible ; les « holdovers » (toucher resté à l'emplacement de la cible
  précédente) sont à 96 % le fait d'enfants et à 81 % sur les plus petites cibles. [E/2]
  https://doi.org/10.1145/2396636.2396671 ; suite 7–10 ans :
  https://init.cise.ufl.edu/designing-smarter-touch-based-interfaces-for-educational-contexts/
- Taille du texte : Bernard et al. (2002, 27 enfants de 9–11 ans) — le 14 points et les polices sans
  empattement sont **perçus** comme plus faciles et plus attirants ; c'est une préférence, pas un gain
  mesuré. [E] https://portfolio.erau.edu/en/publications/examining-childrens-reading-performance-and-preference-for-differ/
  Une étude PLoS ONE 2013 (100 enfants de CE1 et CM2) conclut que « bigger is not always better ».
  [E] https://doaj.org/article/4b393b5e9f87496da73aa680a5986392
- Nombre de choix : Maimaran — des enfants de 4–5 ans choisissant parmi 2 options s'engagent plus
  dans leur choix que parmi 6 ou 7. [2] https://insight.kellogg.northwestern.edu/article/choice-set-size-and-children
  Une affiche de recherche suggère que l'effet s'inverse vers 9–10 ans (non relue par des pairs).
  Aucune source ne donne un nombre d'options pour les 6–10 ans.
- Jeux pour 5–9 ans (HEIHEI, Nouvelle-Zélande) : contrôles intuitifs testés avec des enfants,
  tutoriels en images, ne pas dépendre du texte pendant le jeu, plein écran et de préférence paysage,
  50–60 images par seconde sur des appareils anciens. [E]
  https://www.nzonair.govt.nz/documents/719/HEIHEI_Games_2020-21_Guidelines.pdf
- BBC (jeux CBeebies/CBBC) : un cadre commun impose que l'**écran d'accueil soit le premier écran
  vu**, un jeu d'icônes dont « the pictorial shape and size must remain », un son qui respecte le mode
  silencieux, la pause quand le jeu perd le focus. [E]
  https://github.com/bbc/childrens-games-starter-pack/blob/master/docs/gel-guidelines.md et
  https://github.com/bbc/childrens-games-starter-pack/blob/master/docs/game-specifications.md

### 1.8 Règles vérifiables tirées de cette section

| Sujet                  | Règle                                                                                                        | Source                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| Choix au premier écran | Aucun nombre établi. Une action dominante ; peu de choix avant que l'enfant comprenne ce qu'ils veulent dire | WWDC17 (§2), Maimaran, NN/g               |
| Texte ou icônes        | Icône connue + mot court ; jamais texte seul, jamais icône abstraite seule                                   | Google Building for kids ; NN/g cognition |
| Taille du texte        | 14 pt jeunes / 12 pt plus grands (Web) ; iOS : 17 pt par défaut, 11 pt minimum                               | NN/g ; Apple HIG (§4)                     |
| Niveau de lecture      | Lecture hésitante à 6–8 ans : mots courts, pas de paragraphe                                                 | NN/g                                      |
| Taille des boutons     | Plancher 48 dp (Android) / 44 pt (iOS) ; idéal jeune enfant 2 cm                                             | Android ; Apple ; NN/g                    |
| Retour                 | Immédiat, visuel et sonore, bien visible                                                                     | Sesame ; NN/g ; WWDC17                    |
| Réglages, parents      | Zone parents à part, derrière une tâche d'adulte ; réglages toujours au même endroit                         | Apple ; Google ; WWDC17                   |
| Cohérence              | Mêmes boutons aux mêmes endroits sur tous les écrans                                                         | NN/g ; WWDC17 ; BBC                       |
| Pardon de l'erreur     | Bouton retour visible ; état restauré au retour                                                              | NN/g ; Apple ; Android                    |
| Voix                   | Voix ou son en complément du texte, surtout pour le plus jeune                                               | Apple ; Google ; Sesame                   |
| Progrès                | Montré clairement ; « monter de niveau » compte à 6–8 ans                                                    | Gelman ; BBC                              |

---

## 2. Le menu principal dans les jeux en général

### 2.1 Une action principale

- Apple, « Design Tips for Great Games » (WWDC 2017, session 811) : « Game Main Menus have become
  increasingly busy with news, tournaments, stores, and more. » … « make sure that the main call to
  action to play, start, battle, or begin a new game is the most dominant in your Main Menu UI. »
  [P] https://developer.apple.com/videos/play/wwdc2017/811
- Même session : « Don't ask players to make too many choices before they understand what it means
  in your game. » et « let people get into your game easily and quickly. » [P]
- Game Accessibility Guidelines, niveau de base (cognitif) : « Allow the game to be started without
  the need to navigate through multiple levels of menus ». [E]
  https://gameaccessibilityguidelines.com/allow-the-game-to-be-started-without-the-need-to-navigate-through-multiple-levels-of-menus/
- Apple HIG : « Let people play as soon as installation completes. » ; « People appreciate being
  able to start playing without first having to change a lot of settings. » [P]
  https://developer.apple.com/design/human-interface-guidelines/designing-for-games
- Aucune source reconnue ne fixe un nombre de touchers entre le lancement et le jeu.

### 2.2 Première fois, puis retour

- Premier lancement : on peut sauter l'écran titre et entrer dans le jeu ; l'écran titre reste utile
  au joueur qui revient (charger ou recommencer). [2]
  https://www.gamedeveloper.com/design/how-to-create-immersive-game-intros
- Retour : « Restore the previous state when your app restarts so people can continue where they
  left off. » ; « Avoid making people retrace steps to reach their previous location ». [P]
  https://developer.apple.com/design/human-interface-guidelines/launching — Android demande la même
  chose (State_Preservation, « game progress, menus »). [P]
  https://developer.android.com/docs/quality-guidelines/core-app-quality
- Tutoriel : « Teach through play » ; « design a flow that's fast, fun, and optional » ; si on l'a
  sauté, ne pas le reproposer mais le laisser trouvable. [P]
  https://developer.apple.com/design/human-interface-guidelines/onboarding ; WWDC17 : « provide a
  Skip Tutorial button », consignes « short and simple ». [P]

### 2.3 Hiérarchie des modes, portes fermées ou cachées

- Dévoiler peu à peu : WWDC17, « Successful tutorials teach gradually and in context through
  progressive disclosure. » [P]
- Les praticiens ne sont **pas d'accord** : déverrouiller progressivement et ne montrer que l'utile
  [2] https://adriancrook.com/?p=8055 ; ou au contraire montrer ce qui se débloquera pour signaler la
  richesse du jeu [2]
  https://gamedeveloper.com/design/best-practices-for-a-successful-ftue-first-time-user-experience- ;
  Unity conseille une carte des niveaux qui montre la suite. [2]
  https://unity.com/how-to/10-first-time-user-experience-tips-games
- Sur ce point il n'y a donc pas de standard : porte visible fermée ou porte cachée est un choix à
  essayer avec les enfants.

### 2.4 Carte comme menu, ou liste

- La « saga map » (carte linéaire de niveaux) donne « such clarity as to their progression ». [2]
  https://www.gamedeveloper.com/design/rethinking-progression-in-mobile-puzzle-games
- Formats de cartes mobiles (défilement vertical, grandes îles de 10 à 20 niveaux). [2]
  https://www.gamedeveloper.com/production/mobile-game-maps-which-format-is-right-for-you
- Ce sont des avis de praticiens ; aucune étude mesurée « carte contre liste » n'a été trouvée.

### 2.5 Décor vivant, mascotte, ton

- Le menu est « the initial taste » du jeu et doit en avoir le ton, sans retarder l'envie de jouer
  (Max Pears). [2] https://www.gamedeveloper.com/design/setting-the-tone-main-menus-are-the-game et
  https://www.gamesradar.com/the-hidden-value-of-video-game-main-menus-and-the-design-secrets-that-compel-you-to-hit-play
- WWDC17 : « design the first screen to fit within the style of your game. » [P]
- NN/g : les enfants s'attendent à du son et de l'animation (§1.1).

### 2.6 Chargement, écran de lancement, cohérence, contexte

- « Launch instantly » ; écran de lancement « nearly identical to the first screen » ; pas de texte,
  pas de logo d'ouverture, « Don't advertise ». [P]
  https://developer.apple.com/design/human-interface-guidelines/launching
- Chargement : « Show something as soon as possible » ; « always favor progress bars over activity
  indicators » ; conseils de jeu pendant l'attente, sans répéter le même dans une session. [P]
  https://developer.apple.com/design/human-interface-guidelines/loading et WWDC17
- Cohérence : « be consistent in the layout of your game's menu » ; contre-exemple cité : « The Back
  button is all over the place, and Settings disappears on the Choose Character screen. » [P] WWDC17
- Contexte : chaque écran doit laisser comprendre où l'on est dans la hiérarchie, et rien ne doit
  changer sans action du joueur (Xbox XAG 114). [E]
  https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/114
- Game UI Database : base de captures filtrable par type d'écran ; ses catégories exactes n'ont pas
  pu être lues. [2] https://www.gameuidatabase.com et https://aftermath.site/game-ui-database
- Où mettre crédits et confidentialité : aucune norme trouvée, hors la règle Apple « derrière la
  barrière parentale » pour tout lien sortant (§1.4).

---

## 3. Comparaisons : écrans d'accueil de jeux connus

Seul ce qui a une source est écrit. « n.v. » = non vérifié dans cette session. Aucune capture n'a pu
être regardée : ce sont des descriptions de tiers.

| Jeu                                                                                    | Action principale                                                   | Options visibles                                                                                                                                                | Modes                                                                                | Progrès                                                                                                                                                       | Parents / réglages                                                | Scène ou mascotte                                                                          | Sources                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Kingdom Rush** (et Frontiers)                                                        | Sur la carte, un drapeau « Start Here! » lance la première mission  | n.v.                                                                                                                                                            | Campagne ; après victoire, défis « Heroic » et « Iron » sur le même lieu             | Carte du royaume ; 1 à 3 étoiles par niveau ; le drapeau gagne des ailes dorées (Heroic) ou une teinte argent (Iron) ; les étoiles achètent des améliorations | n.v.                                                              | La carte est la scène                                                                      | [2] https://www.gamezebo.com/walkthroughs/kingdom-rush-frontiers-walkthrough/ ; https://kingdomrushtd.fandom.com/wiki/Heroic_Challenge ; https://kingdomrushtd.fandom.com/wiki/Iron_Challenge ; https://kingdomrushtd.fandom.com/wiki/Upgrades |
| **Bloons TD 6**                                                                        | Bouton Play                                                         | Au moins dix boutons (Play, Monkeys, Powers, Heroes, Store, Trophy Store, Achievements, Knowledge, Co-op, Settings) plus des boutons d'événements — menu chargé | Cartes en quatre familles (Beginner à Expert) ; « Advanced » après 12 cartes gagnées | Médailles par carte ; toutes les médailles donnent un cadre à la carte                                                                                        | Roue dentée                                                       | Décor touchable (maison, moulin, mairie qui donne l'heure) ; un personnage mène aux quêtes | [2] https://doombubbles.github.io/BTD-Mod-Helper/docs/BTD_Mod_Helper.UI.BTD6.MainMenuUI ; https://bloons.fandom.com/wiki/Bloons_TD_6 ; https://www.bloonswiki.com/Map_difficulty                                                               |
| **Plants vs. Zombies**                                                                 | Adventure                                                           | PC : 4 entrées. iOS/Android : 2 (« Adventure » et « More Ways to Play »)                                                                                        | Mini-jeux, puzzle, survie s'ouvrent en avançant dans l'aventure                      | n.v.                                                                                                                                                          | n.v.                                                              | n.v.                                                                                       | [2] https://plantsvszombies.wiki.gg/wiki/Game_modes_(PvZ)                                                                                                                                                                                      |
| **Plants vs. Zombies 2**                                                               | n.v.                                                                | Sections : Adventure, Player's House, Modes, Shop, Almanac                                                                                                      | Cartes de mondes, refaites en version 1.7.2                                          | n.v.                                                                                                                                                          | n.v.                                                              | n.v.                                                                                       | [2] https://strategywiki.org/wiki/Plants_vs._Zombies_2/Table_of_Contents ; https://tcrf.net/Plants_vs._Zombies_2:_It%27s_About_Time/Worlds_and_Levels                                                                                          |
| **Toca Life World**                                                                    | Bouton jouer sous le logo, puis carte des lieux                     | Écran de départ : jouer et boutique                                                                                                                             | Lieux touchables sur une carte                                                       | n.v.                                                                                                                                                          | n.v.                                                              | La carte                                                                                   | [2] https://toca-life-world.fandom.com/wiki/Toca_Boca_World/Tutorial                                                                                                                                                                           |
| **Pok Pok**                                                                            | « nothing but a red button on the screen », puis on touche un jouet | Un bouton, plus une petite icône adultes en bas à droite                                                                                                        | Jouets à toucher, aucun texte                                                        | Aucun (ni gain ni perte)                                                                                                                                      | Icône discrète en coin ; barrière : saisir l'heure sur un clavier | Salle de jeux                                                                              | [2] https://www.macstories.net/reviews/pok-pok-playroom-a-delightful-digital-toybox-for-kids/ ; https://playpokpok.com/faqs/ ; https://apps.apple.com/app/id1550204730                                                                         |
| **Khan Academy Kids**                                                                  | Grande flèche (ou gros bouton vert) qui lance le parcours           | Bibliothèque en haut à gauche ; personnages en bas                                                                                                              | Parcours ou bibliothèque                                                             | n.v.                                                                                                                                                          | Section parents (emplacement n.v.)                                | Maison ; Kodi l'ours guide                                                                 | [E/2] https://khankids.zendesk.com/hc/en-us/articles/360006764812 ; https://www.khanacademy.org/kids                                                                                                                                           |
| **PBS Kids Games**                                                                     | n.v.                                                                | n.v.                                                                                                                                                            | Plus de 250 jeux par émission                                                        | n.v.                                                                                                                                                          | Section « grown-ups » (stockage, Wi-Fi, sous-titres)              | n.v.                                                                                       | [2] https://www.bark.us/app-reviews/apps/pbs-kids-games/ ; https://pbskids.org/apps/pbs-kids-games                                                                                                                                             |
| **Pokémon Playhouse** (3–5 ans)                                                        | Choisir un lieu                                                     | Quatre lieux (tour, salon, aire de jeux…)                                                                                                                       | Mini-jeux par lieu                                                                   | Liste des Pokémon amis sur une console au centre                                                                                                              | Code pour les liens externes, fondé sur la lecture                | La maison                                                                                  | [2] https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Playhouse ; https://childrenandmedia.org.au/app-reviews/apps/pokémon-playhouse                                                                                                        |
| **Super Mario Run**                                                                    | n.v.                                                                | Quatre modes : World Tour, Toad Rally, Remix 10, Kingdom Builder                                                                                                | n.v.                                                                                 | n.v.                                                                                                                                                          | n.v.                                                              | n.v.                                                                                       | [2] https://www.mariowiki.com/Super_Mario_Run                                                                                                                                                                                                  |
| Mario Kart Tour, Sago Mini World, LEGO DUPLO World, Pokémon Smile, jeux « à la Clash » | n.v.                                                                |                                                                                                                                                                 |                                                                                      |                                                                                                                                                               |                                                                   |                                                                                            | Écrans non documentés par une source lisible                                                                                                                                                                                                   |

À retenir de ce qui est vérifié :

1. Partout où l'accueil a pu être décrit, **une seule action domine** et mène à une carte ou à une
   scène (Pok Pok, Toca, Khan Academy Kids, Kingdom Rush, PvZ mobile).
2. Les modes secondaires sont **regroupés ou ouverts avec le progrès** : PvZ sur téléphone réduit
   quatre entrées à deux ; Kingdom Rush range ses deux défis **sur le drapeau du niveau**, pas dans
   le menu.
3. La zone adulte est **petite, en coin, derrière une tâche d'adulte** (Pok Pok ; Khan Academy Kids).
4. Le contre-exemple est Bloons TD 6 : dix boutons et des événements, exactement le menu « busy »
   que décrit Apple — pour un public large, avec boutique.
5. Mario Kart Tour : son premier lancement a été jugé très mauvais à cause d'une porte de connexion
   obligatoire. [2] https://www.pocketgamer.biz/mario-kart-tour-worst-first-time-user-experience-ever

---

## 4. Téléphone en paysage

- **Zones sûres.** « Respecting the safe area is essential to make sure system UI and hardware
  features like the Dynamic Island don't obstruct content and controls. » ; un jeu verrouillé en
  paysage doit quand même bien se redimensionner ; l'art de fond va jusqu'au bord, sans déformer. [P]
  https://developer.apple.com/design/human-interface-guidelines/layout
- **Encoche Android.** « Don't let the cutout area obscure any important text, controls, or other
  information. » ; « Don't place or extend any interactive elements that require fine-touch
  recognition into the cutout area. » [P]
  https://developer.android.com/develop/ui/views/layout/display-cutout
- **Gestes système.** Retour : balayage depuis le bord gauche ou droit ; accueil : balayage depuis
  le bas, que l'application ne peut pas désactiver. Un bouton collé à ces bords entre en conflit. [P]
  https://developer.android.com/develop/ui/views/touch-and-input/gestures/gesturenav
- **Site Web.** `env(safe-area-inset-*)` avec `viewport-fit=cover` ; garder une marge plancher,
  par exemple `max(12px, env(safe-area-inset-right))`. [E] https://webkit.org/blog/7929/designing-websites-for-iphone-x/
  Les valeurs exactes en points des marges d'un iPhone en paysage n'ont pas été confirmées.
- **Proportions.** Les jeux doivent tenir en 16:10, 19,5:9 et 4:3 ; « Avoid fixed layouts ». [P]
  https://developer.apple.com/design/human-interface-guidelines/designing-for-games
- **Pouces.** Les utilisateurs préfèrent toucher au centre de l'écran (Hoober, 1 333 personnes
  observées) ; à deux pouces, les zones se recouvrent au milieu et le haut-centre est le plus loin
  (Clark). Ces travaux portent sur des adultes, surtout en portrait ; **rien de mesuré sur des
  enfants en paysage**. [2] https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php ;
  https://bigmedium.com/ideas/how-we-hold-our-gadgets.html
- **Bord bas chez les petits.** Sorties involontaires (Sesame, §1.2) : indice, pas preuve, pour les
  6–10 ans.
- **Texte minimal.** iOS : 17 pt par défaut, 11 pt minimum, texte agrandissable d'au moins 200 % ;
  police fine : viser plus grand. [P] https://developer.apple.com/design/human-interface-guidelines/accessibility
  NN/g : 14 pt pour les jeunes enfants (Web). Aucune source ne donne un chiffre propre à un écran de
  360 px de haut.
- **Cibles et écarts.** Android 48 dp [P] ; iOS 44 × 44 pt, avec environ 12 pt de marge autour d'un
  bouton à contour et 24 pt sans contour [P] ; WCAG 2.2 : 24 × 24 px au niveau AA, 44 × 44 au niveau
  AAA [E] https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html ; jeux YouTube
  Playables : 48 × 48 dp et 8 dp d'écart [E]
  https://developers.google.com/youtube/gaming/playables/certification/best_practices_design ;
  NN/g jeune enfant : 2 cm.
- **Combien de grandes cibles tiennent.** [calcul] Sur Android, 1 dp vaut 1/160 de pouce (définition
  Android, page non rouverte : https://developer.android.com/training/multiscreen/screendensities) ;
  en prenant 1 px CSS pour 1 dp, 360 de haut font environ 57 mm et 780 de large environ 124 mm. Une cible NN/g de 2 cm fait environ
  126 dp : il en tient **deux rangées au plus** en hauteur et cinq en largeur, sans titre ni marges ;
  avec un titre, une seule rangée. À 48 dp avec 8 dp d'écart il tiendrait six rangées, mais sans
  place pour un titre ni une scène. La règle des 2 cm vise surtout les moins de 6 ans ; pour 6–10 ans
  un entre-deux (environ 60 à 90 dp pour les actions principales) est une lecture raisonnable, pas un
  chiffre sourcé.
- **Dispositions courantes** (« scène au centre et rails sur les côtés ») : aucune source normative
  trouvée ; voir les jeux du §3.
- **Tablette et ordinateur.** Android demande de remplir la fenêtre sans bandes noires, de garder
  les mêmes fonctions dans toutes les orientations, et d'essayer au moins en 1024 × 640 dp et
  1280 × 800 dp. [P] https://developer.android.com/docs/quality-guidelines/adaptive-app-quality et
  https://developer.android.com/docs/quality-guidelines/core-app-quality
  Apple : mettre le plus important « near the top and leading side ». [P]

---

## 5. Finition (« bien léché »)

- **États des boutons.** « a lack of visual feedback can confuse players. » ; « Use a Press state
  when something has been tapped. » ; « use a Disabled state for control that's not currently active
  or enabled. » ; ce qui n'est pas touchable doit avoir l'air différent (couleur, forme). [P] WWDC17
- **Mouvement.** « Add motion purposefully, supporting the experience without overshadowing it. » ;
  « Aim for brevity and precision in feedback animations. » ; « Make motion optional » ; ne pas faire
  passer une information importante par le seul mouvement ; 30 à 60 images par seconde. [P]
  https://developer.apple.com/design/human-interface-guidelines/motion
- **Durées.** Material (version 1) : entrée d'un élément 225 ms, sortie 195 ms, grande transition
  plein écran jusqu'à 375 ms ; au-delà de 400 ms cela paraît lent. [E]
  https://m1.material.io/motion/duration-easing.html — l'échelle Material 3 (de 50 ms à 1 000 ms)
  n'est connue que par des tiers.
- **Réduire les animations.** Répondre au réglage système : moins d'animations automatiques et
  répétées, remplacer les déplacements par des fondus. [P]
  https://developer.apple.com/design/human-interface-guidelines/accessibility
- **Son.** Un son confirme le toucher (Sesame, §1.2) ; il doit respecter le mode silencieux (BBC,
  §1.7) ; les réglages sont gardés d'une fois sur l'autre (Game Accessibility Guidelines, « Ensure
  that all settings are saved/remembered »). [E] https://gameaccessibilityguidelines.com/basic/
- **« Juice ».** Jonasson et Purho, « Juice it or lose it » (2012) : le même jeu, sans règle
  ajoutée, devient plus plaisant par couches de retour (sons, secousses, particules). [2]
  https://gamejuice.pages.dev/articles/juice-it-or-lose-it-lessons — Swink, « Game Feel » : le
  « polish » est un des six ingrédients. [2] https://en.wikipedia.org/wiki/Game_feel
- **Limite mesurée.** Hicks et al. (CHI PLAY 2019) : les embellissements visuels améliorent l'attrait
  de tous les jeux, mais le sentiment de compétence seulement dans certains cas. [E]
  https://doi.org/10.1145/3311350.3347171 ; un article plus récent rapporte, de seconde main, que ni
  « aucun » ni « extrême » ne convient (travaux de Kao, non lus). [2] https://arxiv.org/html/2512.13695
  → du relief, pas de surcharge.
- **Icônes cohérentes.** Un seul jeu d'icônes, forme et taille constantes (BBC, §1.7) ; ne pas
  coder par la couleur seule : « Offer visual indicators, like distinct shapes or icons, in addition
  to color ». [P] Apple accessibilité.
- **Texte net.** Pas de flou ni de pixellisation ; pas de mot coupé ni de retour à la ligne
  malheureux dans un bouton ; lignes de 45 à 75 caractères pour les blocs. [P] Android core quality.
- **Premier lancement.** Écran de lancement semblable au premier écran, pas de logo qui retarde ;
  un éventuel écran de marque « just long enough ». [P] Apple launching et onboarding.
- **États vides** (album sans autocollant, pas encore de record) : aucune norme propre aux jeux
  d'enfants trouvée ; la règle voisine est « Use communication children can understand » (D4CR) et
  les consignes courtes avec image (NN/g).

Ce qui distingue un menu fini, d'après ces sources : chaque toucher répond (vue et son), rien ne
bouge sans raison, les mêmes choses sont aux mêmes endroits, l'action principale saute aux yeux, et
l'attente est occupée.

---

## 6. Grille à appliquer à une capture de l'écran d'accueil

Oui ou non. Chaque critère vient d'une source ci-dessus.

**Action principale**

1. Le bouton pour jouer est-il l'élément le plus dominant de l'écran (taille, contraste, place) ? — WWDC17 [P]
2. Peut-on lancer une partie sans traverser plusieurs niveaux de menus ? — Game Accessibility Guidelines [E]
3. Au retour, ce bouton reprend-il là où l'enfant s'était arrêté ? — Apple launching [P] ; Android State_Preservation [P]
4. Au tout premier lancement, l'enfant joue-t-il sans avoir d'abord à régler ou à choisir ? — Apple designing-for-games [P] ; WWDC17 [P]

**Nombre de choix** 5. L'écran évite-t-il de demander des choix dont l'enfant ne connaît pas encore le sens ? — WWDC17 [P] 6. Les modes secondaires sont-ils regroupés ou ouverts avec le progrès, plutôt que tous au même rang ? — WWDC17 « progressive disclosure » [P] ; PvZ, Kingdom Rush [2] 7. L'écran est-il exempt d'actualités, de boutique et d'événements qui concurrencent « Jouer » ? — WWDC17 [P] 8. Tout tient-il sans défilement ? — NN/g [E]

**Lisibilité** 9. Chaque porte a-t-elle une image connue **et** un mot court (ni texte seul, ni icône abstraite seule) ? — Google Building for kids [E] ; NN/g cognition [E] 10. Les libellés sont-ils des mots, pas des phrases ni des paragraphes ? — NN/g [E] 11. Le plus petit texte utile atteint-il la taille recommandée (14 pt jeunes enfants ; jamais sous 11 pt) ? — NN/g [E] ; Apple accessibilité [P] 12. Le contraste est-il d'au moins 4,5:1 pour le petit texte et 3:1 pour le grand texte et les pictogrammes, sans mot coupé ni flou dans un bouton ? — Android core quality [P] ; Apple [P]

**Toucher** 13. Toute cible fait-elle au moins 48 dp (44 pt sur iOS) ? — Android [P] ; Apple [P] 14. Les actions principales sont-elles nettement plus grandes que ce plancher (repère : 2 cm pour un jeune enfant) ? — NN/g [E] 15. Les cibles voisines sont-elles écartées (8 dp au moins ; 12 à 24 pt chez Apple) ? — Playables [E] ; Apple [P] 16. Rien d'important ni de touchable ne se trouve-t-il dans l'encoche, hors zone sûre ou collé à un bord de geste système ? — Apple layout [P] ; Android cutout et gesturenav [P] 17. Tout se fait-il par simple toucher (ni double toucher, ni pincement, ni glisser fin) ? — Sesame [2] ; Google [E] ; NN/g [E]

**Progrès** 18. L'enfant voit-il où il en est sans lire un chiffre technique (étoiles, carte, niveau) ? — Gelman [2] ; BBC [E] ; Kingdom Rush [2] 19. Comprend-on où l'on est et comment revenir, avec retour et réglages toujours au même endroit que sur les autres écrans ? — XAG 114 [E] ; NN/g [E] ; WWDC17 [P]

**Zone parents** 20. La zone parents est-elle à part, discrète, hors du chemin de l'enfant ? — Google Building for kids [E] ; Pok Pok [2] 21. Liens sortants, export de sauvegarde et politique de confidentialité sont-ils derrière une tâche de niveau adulte ? — Apple Kids [P] ; règle 1.3 [E] 22. L'écran est-il exempt d'urgence, d'appât ou de personnage qui supplie ? — Radesky 2022 [E] ; ICO norme 13 [E]

**Retour et finition** 23. Chaque bouton a-t-il un état pressé visible, et un état inactif distinct quand la porte est fermée ? — WWDC17 [P] 24. Un toucher produit-il un retour immédiat, visible et sonore ? — Sesame [2] ; NN/g [E] 25. Les animations sont-elles brèves (environ 200 à 400 ms) et au service du sens ? — Apple motion [P] ; Material [E] 26. L'écran s'affiche-t-il vite, avec une barre de progression si le chargement dépasse deux secondes ? — Android App_Startup_Time [P] ; WWDC17 [P] 27. Le décor et le ton sont-ils ceux du jeu (pas un menu générique) ? — WWDC17 [P] ; Pears [2]

**Accessibilité** 28. Le son est-il réglable, le réglage est-il retenu, et le mode silencieux respecté ? — Game Accessibility Guidelines [E] ; BBC [E] 29. Aucune information ne passe-t-elle par la couleur seule, ni par le mouvement seul ? — Apple accessibilité et motion [P] 30. L'écran remplit-il la fenêtre et garde-t-il les mêmes fonctions en 780×360, 812×375 et 1280×800 ? — Android adaptive et core quality [P] ; Apple designing-for-games [P]

---

## Non vérifié

**Sources primaires non lues directement** (réseau fermé ; contenu connu par extraits) : les trois
articles NN/g et le rapport payant ; le PDF Sesame Workshop 2012 ; les pages Google (Teacher
Approved, Building for kids, Playables) ; Game Accessibility Guidelines ; Xbox Accessibility
Guidelines 101, 112, 114 ; WCAG 2.2 ; Material Design ; les documents BBC ; les règles HEIHEI ; les
articles universitaires (résumés seulement). À rouvrir avant de citer mot pour mot. Hôtes à
autoriser pour une passe de contrôle : www.nngroup.com, joanganzcooneycenter.org,
support.google.com, play.google.com, developers.google.com, gameaccessibilityguidelines.com,
learn.microsoft.com, m3.material.io, www.w3.org, www.gameuidatabase.com, github.com (dépôt public
bbc/childrens-games-starter-pack).

**Chiffres ou règles cherchés et non trouvés**

- Nombre idéal de choix sur un premier écran pour les 6–10 ans : aucune source.
- Taille de texte minimale propre à un écran de 360 px de haut : aucune source.
- Tailles de texte minimales Xbox (console, PC, mobile) et limite de profondeur des menus : non
  confirmées.
- Marges sûres exactes d'un iPhone en paysage, en points : non confirmées.
- Écart de 8 dp et « environ 9 mm » de Material pour une cible de 48 dp : non confirmés sur la page
  Material (l'écart de 8 dp vient du guide YouTube Playables).
- Efficacité mesurée des barrières parentales : aucune étude trouvée.
- Zones de pouce d'enfants en paysage : aucune étude trouvée.
- Texte des chapitres 6–8 et 8–10 de Gelman ; liste complète des 10 principes D4CR ; principes de
  l'OFT britannique sur les jeux (2014).
- Catégories exactes de Game UI Database.
- Nombre de touchers standard entre le lancement et le jeu : aucune source reconnue.
- Les résultats de Kao (2020) sur le « juice » : connus de seconde main seulement.

**Écrans de jeux non vérifiés** : disposition exacte de l'accueil de Kingdom Rush (boutons
d'améliorations, de héros, d'encyclopédie, emplacements de sauvegarde) et de ses suites Origins,
Vengeance, Alliance ; position des boutons de Bloons TD 6 ; pierre tombale de Plants vs. Zombies ;
carte de PvZ 2 ; barrière parentale de Toca Life World ; Sago Mini World ; LEGO DUPLO World ;
Pokémon Smile ; Super Mario Run et Mario Kart Tour (un résultat de recherche annonce la fermeture de
Mario Kart Tour le 30 septembre 2026, non contrôlée) ; jeux de stratégie « à la Clash ». Aucune
capture d'écran n'a été regardée : la bonne suite est de les regarder sur gameuidatabase.com ou sur
les fiches des boutiques.

**Non essayé** : rien de ce document n'a été confronté à l'écran actuel du jeu, à un vrai téléphone
ni aux enfants.
