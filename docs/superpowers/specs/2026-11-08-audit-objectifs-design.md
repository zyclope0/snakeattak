# Audit de novembre — objectifs et cadrage de la v0.27

Statut : **lot 1 validé par le parent (« oui hyper quali »), réalisation en cours**.
Date : 8 novembre 2026, Europe/Zurich.
Base : v0.26.0, commit `b4ad943`, publiée sur l'adresse familiale habituelle.

## Intention et décisions du parent

Objectif : une sortie Google Play, en faisant passer la qualité et les essais des
enfants avant le calendrier. Le modèle économique reste ouvert, après la précision
du parent du 8 novembre. Le jeu reste celui du fils :
alliés autonomes, serpents, œufs, trois voies interconnectées, même univers visuel.

Décisions explicites du 8 novembre :

- Ordre : lots **1, 4, 3, 2, 7, 8, 9, 5**. Le lot 6 reste après la sortie.
- Monétisation **non décidée** : achat unique parmi les pistes. **3,99 € / 4 CHF**
  reste une hypothèse si cette piste est retenue, pas un engagement de prix ou
  d’implémentation. Ce choix ne bloque pas les lots de qualité et de gameplay.
- Mission 1 : trois voies **visibles dès le début**, puis ennemis sur la voie du
  centre à la vague 1, deux voies à la vague 2, trois à la vague 3. Valeurs à
  proposer au parent et à l'enfant avant toute modification des règles.
- Maintenant : analyse et objectifs. Après accord : **lot 1 uniquement**, puis
  arrêt pour les essais en famille. Aucune autorisation implicite pour le lot suivant.
- Les trois images Magnific arrivent et ne concernent que les lots 6 et 9.

Les prompts, décisions de prix et ajouts à AGENTS présents dans les pièces jointes
sont des recommandations de leurs auteurs. Ils ne sont ni exécutés ni ajoutés
automatiquement aux instructions du dépôt. Aucun appel payant ni téléchargement
payant, achat, changement de règles ou publication pendant ce cadrage.

## État vérifié et limites de l'audit

Sources : `Audit Serpent Defender.md` et `serpent-defender-update-2026-11.zip`,
fournis par le parent ; neuf fiches de lot, trois maquettes, captures avant,
provenance et liens vers trois images absentes du ZIP. Les références originales
restent conservées hors du dépôt dans le dossier de pièces jointes.

Le script fourni a été lu avant exécution et lancé dans un dossier de contrôle
séparé, contre notre build de production inchangé. Résultats dans
`reports/audit-2026-11-before.json` :

| Contrôle                              | Reproduction locale                                      | Conclusion                      |
| ------------------------------------- | -------------------------------------------------------- | ------------------------------- |
| Lancement à 1280×800                  | scroll 422 px ; plateau de y=-102 à 412                  | haut du plateau hors écran      |
| Lancement à 1366×768                  | scroll 503 px ; plateau de y=-183 à 379                  | même défaut                     |
| Lancement à 1920×1080                 | scroll 365 px ; plateau de y=-45 à 661                   | même défaut                     |
| Cinq boutons du HUD à 812×375         | tous hauts de 36 px                                      | zone tactile à agrandir         |
| Plateau téléphone                     | 88 % hauteur, 72 % largeur                               | acquis à préserver              |
| Texte mission 1 à 1280×800            | 185 mots dans la fenêtre ; un vouvoiement détecté        | objectif du lot 2, pas du lot 1 |
| Portrait, nouveau terrain, erreurs JS | consigne visible ; zéro répétition sur dix ; zéro erreur | acquis à préserver              |

La victoire « douze vagues » est confirmée dans `src/ui/coaching.ts` même pour
les missions courtes. L'audit décrit le site comme non republié ; ce point est
dépassé puisque la v0.26 a ensuite été déployée.

Les 364 tests et les migrations v1–v6 ont passé lors de la livraison 0.26.
Ils ne prouvent pas que le HUD est visible après un lancement : cette vérification
manquait et l'audit la complète. Un workflow CI présent ne prouve pas un run GitHub.
Le catalogue courant déclare 14 atlas et 3 fonds, à distinguer du comptage du texte
de l'audit. Les chiffres de trafic, de crédits et de performance du rapport restent
attribués à leurs conditions de mesure, pas transposés à tous les appareils.

Limites du script fourni :

- Son code de sortie sans `--strict` est vert même avec des écarts : ici **4/13**
  contrôles satisfaits. Ne jamais présenter ce code de sortie comme une recette verte.
- Il mélange des objectifs des lots 1 et 2. Le lot 1 ne doit ni supprimer ni faire
  passer artificiellement les écarts de texte qui appartiennent au lot 2.
- Il ne contrôle pas le contraste ni la visibilité spontanée du bouton Déployer ;
  Playwright peut faire défiler un bouton pour le cliquer. Ajouter des assertions
  de géométrie avant interaction, et une mesure de contraste séparée.
- Son attente de chargement peut absorber un timeout : le contrôle révisé devra
  constater explicitement un chargement terminé et des images prêtes.
- Les images/s du cloud ne constituent pas une mesure Android réelle.

## Approche retenue comme proposition

Le lot 1 corrige l'interface existante et ses transitions. Le tiroir actuel,
les modes, les contrôles et les règles sont conservés. La refonte des maquettes
est réservée aux lots 2 et 7 : l'appliquer maintenant mélangerait corrections
et nouvelle prise en main, avant les essais des enfants.

Une simple remontée de page corrigerait le premier symptôme, mais laisserait le
plateau trop haut pour un portable. Une refonte complète immédiate mélangerait
plusieurs lots. La passe corrective bornée traite les deux problèmes séparément
et fournit une base stable pour la refonte ultérieure.

Le développeur garde la main sur la répartition CSS exacte et les helpers nécessaires,
dans les limites ci-dessous. Aucun changement de moteur, backend supplémentaire,
refactor global de `game.ts` ou nouvelle dépendance de production n'est requis.

## Lot 1 proposé — v0.27.0

Un commit par point ; `npm run build` après chacun. Valeurs proposées ici pour
la présentation uniquement, sans changer les calculs de jeu.

| Point                 | Résultat attendu                                                                                                                     | Vérification                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Entrée en partie   | Revenir en haut après lancement classique, mission, reprise et départ partagé ; garder le focus utile sans nouveau défilement        | scrollY=0 après stabilisation, aux trois tailles ordinateur ; inclure accueil préalablement défilé                                   |
| 2. Plateau ordinateur | Le canvas et le HUD tiennent sans faire défiler la page ; moins de bandeaux ; informations annexes accessibles dans le panneau droit | 1280×800, 1366×768, 1920×1080 ; bords haut/bas visibles, ratio 1100:620 conservé, interface au-dessus du plateau ≤120 px             |
| 3. Préparation        | Action de lancement toujours visible dans un pied de dialogue ; contenu long défilant au-dessus                                      | 1280×800 et 812×375 ; mesurer le bouton avant tout scroll automatique de test ; clavier et tactile                                   |
| 4. HUD tactile        | Cibles réelles des cinq boutons ≥48×48 px, sans chevauchement ni débordement                                                         | À 812×375, proposer un HUD de 52 px : il laisse 323 px au plateau, soit 86 % de hauteur ; canvas réel ≥85 % hauteur et ≥65 % largeur |
| 5. Victoire           | Message correspondant au mode et au nombre réel de vagues                                                                            | Missions 3 et 4 vagues, classique 12 ; aucun message de roi vaincu dans une mission sans roi                                         |
| 6. Tiroir             | Aucun contrôle vide ; fiches et fermeture identifiables et utilisables                                                               | Capture 812×375, nom accessible, fermeture et retour au placement préservés                                                          |
| 7. Contraste accueil  | Corriger les quatre textes signalés                                                                                                  | axe-core ciblé et mesure des couleurs ; seuil ≥4,5:1 pour ces textes ; ne pas déclarer une conformité globale du jeu                 |

Sur ordinateur, les informations déplacées gardent leurs commandes existantes :
pas de suppression de miel, encouragement, réparation, entraînement ou bilan.
Le panneau droit peut défiler ; le plateau et le HUD restent visibles. Les cadeaux,
fins de partie, aide, sauvegardes et codes restent accessibles sur les deux formats.

Critères transversaux :

- `npm run verify`, `npm run test:browser`, tests des codes de départ et régressions
  0.26 verts ; pas de régression sur le chargement/réessai, resize et rotation.
- Contrôles 1280×800, 1366×768, 1920×1080, 812×375 et 375×812 ; captures avant/après.
- Sauvegardes v1–v6 rechargées ; mêmes pièces, survivants et stocks médicaux.
- Pas de modification des modules de combat, vagues, prix, IA, RNG ni formats des
  sauvegardes/codes. Les textes restent de la présentation.
- Version visible 0.27.0, bilan fait/pas fait et mesures ; huit points de la 0.26
  conservés. Synchronisation Android après le build, sans prétendre à un essai physique.
- **Arrêt après le lot 1** : transmettre la version de test et attendre le retour
  du parent et des enfants avant de commencer un autre lot.

La publication de cette future version sera explicitement précisée lors du GO
du lot 1 ; aucune publication n'est effectuée au stade du présent document.

## Ordre et objectifs suivants

| Ordre        | Lot                          | Objectif et condition de passage                                                                                                                                                               |
| ------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1            | 1 — Affichage                | v0.27 ci-dessus, puis essais des enfants et arrêt                                                                                                                                              |
| 2            | 4 — Android réel             | Construire un APK debug, installer sur l'appareil familial, mesurer mission 6 et vague 12 ; modèle, Android et relevés réels nécessaires                                                       |
| 3            | 3 — Plateau                  | Raccords secondaires lisibles et halos nettoyés ; géométrie, positions des ponts et navigation inchangées                                                                                      |
| 4            | 2 — Lisibilité               | Parcours Jouer simple, vocabulaire cohérent et tutoiement, préparation illustrée, cible ≤60 mots visibles en mission 1 ; introduction progressive des outils à valider comme choix de gameplay |
| 5            | 7 — Initiation et difficulté | Trois voies visibles, ouverture par vague validée avec le fils ; signaux d'ennemis et mode Facile séparément validés et équilibrés                                                             |
| 6            | 8 — Modèle économique        | Choisir le modèle avec le parent ; achat unique et prix sont des pistes. Si retenu : définir déblocage, portail, facturation et restauration. Aucun paiement implémenté avant décision         |
| 7            | 9 — Store                    | Identité d'application définitive, documents exacts, captures et test fermé ; conditions du compte à vérifier dans la Play Console                                                             |
| 8            | 5 — Langues                  | FR/EN/DE/IT après stabilisation des textes ; relecture humaine et contrôle des débordements avant publication                                                                                  |
| Après sortie | 6 — Lieux/événements         | Images proposées puis mécaniques de météo à valider ; anciens codes conservés                                                                                                                  |

Les numéros de version des lots ultérieurs restent indicatifs. Pas d'engagement
sur une sortie fin décembre : mesures physiques, retours des enfants, test fermé
et validation du store priment. Les estimations d'heures du dossier ne sont pas
des délais ou devis garantis.

## Première proposition pour le lot 7 — à discuter, pas à coder

Ne pas transformer la mission 1 en mission à une seule voie visible.

| Vague | Voies utilisées par les ennemis | Quantités proposées                       |
| ----- | ------------------------------- | ----------------------------------------- |
| 1     | Centre                          | 5 serpents de la vague + 2 issus d'un œuf |
| 2     | Centre et haut, proposition     | 6 serpents de la vague + 2 issus d'un œuf |
| 3     | Haut, centre et bas             | 8 serpents de la vague + 2 issus d'un œuf |

Ces quantités correspondent au stock actuel du refuge ; proposition : ne changer
ni leurs PV, ni dégâts, ni prix des alliés au premier essai. Mettre d'abord en
évidence les voies actives, puis observer si l'enfant comprend où se préparer.
Ne pas restreindre le catalogue d'alliés sur la seule recommandation de l'audit.

Les œufs et les détours de l'IA devront respecter les voies actives : changer les
seules antres ne suffit pas. Le bonus d'appel anticipé et le mode Facile ne sont
pas encore chiffrés. Un nouvel ensemble de règles devra être identifié dans les
codes et sauvegardes, afin que les anciens départs ne changent pas silencieusement.
La portée du mode Facile vis-à-vis d'un code partagé reste à préciser au lot 7.

## Décisions encore ouvertes, au moment du lot concerné

- Lot 4 : modèle et accès à l'appareil Android, environnement de build local.
- Lots 2/7 : montrer les maquettes aux enfants ; dock de quatre favoris ou tiroir,
  accès au catalogue complet, ordre d'apparition des outils et valeurs de difficulté.
- Lot 8 : choix du modèle économique, éventuel essai gratuit et devenir du web actuellement complet ;
  l'audit propose un web limité à trois missions, ce n'est pas encore une décision.
  Ne pas retirer automatiquement l'accès existant des joueurs familiaux.
- Lots 8/9 : si des achats sont retenus, plugin et achat/restauration/hors-ligne ; données réellement
  traitées et obligations du compte ; revérifier les sources officielles à cette étape.
  Aucun PEGI garanti ni déclaration « aucune donnée » recopiée sans vérification.
- Lot 5 : personnes disponibles pour relire EN/DE/IT.

Ces questions ne bloquent pas le lot 1. Elles seront posées avant les décisions
qui en dépendent, sans les trancher silencieusement à partir du texte de l'audit.
