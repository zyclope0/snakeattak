# Lisibilité tactique, français/anglais et soucoupe discrète

Demande du parent : réaliser le lot 2 proposé, doubler toute l'application en
anglais avec le titre **Snake Attack TD**, et ajouter une petite référence
visuelle aux soucoupes de Mars Attacks à un seul endroit. Le mandat d'autonomie
et de conseil après chaque lot reste actif. Aucun changement de combat demandé.

## Résultat attendu

- Le choix d'un allié explique son placement et son vrai rayon d'action. Les
  indications reprennent les rôles, la portée et les voies ouvertes du moteur.
- Les textes médicaux ne s'empilent plus au fort ; les stocks et délais réels
  restent consultables. Les étoiles gagnées sont visibles ; la défaite donne
  une consigne cohérente avec les boutons disponibles.
- Français et anglais complets : menus, aides, catalogue, missions, dangers,
  progression, résultats, messages, attributs accessibles et textes Phaser.
  Un choix mémorisé et la préférence système déterminent la langue. Changer de
  langue ne redémarre pas la partie et n'ouvre pas un dialogue de progression.
- Titre français conservé ; titre anglais Snake Attack TD. Les ressources
  Android anglaises portent également ce nom ; AppID et certificat inchangés.
- Une soucoupe originale dessinée en code, matière mate/papier, à(1008,48) dans
  le seul terrain classique `ruins`. Aucune apparition dans les missions,
  collision, interaction, effet, ennemi, récompense, son ou tirage aléatoire.

## Approches et décision

Deux applications ou HTML séparés dupliqueraient contrôleurs et sauvegardes.
Traduire les données vivantes du moteur modifierait les états canoniques et
fragiliserait les anciens départs. Un observateur DOM qui remplace des mots
partout masquerait les oublis et toucherait du contenu technique.

Décision technique : **projection explicite aux frontières d'affichage**,
catalogues de phrases exactes et gabarits ancrés, français canonique conservé
dans les règles. Les écritures de texte/attributs/HTML de l'interface et de
Phaser passent par des adaptateurs dédiés. Le HTML créé en une fois est lié
par ses feuilles de texte/attributs ; un changement de langue conserve les
nœuds, handlers, identifiants et focus. Aucun MutationObserver linguistique.
Les catalogues anglais sont séparés ; aucun service de traduction distant.

Le moteur, le RNG, les identifiants d'unités/missions, les messages canoniques,
les formats de sauvegarde, les mots et sommes de contrôle des codes restent
inchangés. La langue est une préférence locale indépendante de la famille.
Les caches de textes canvas reçoivent eux aussi le changement de langue.

La soucoupe est un clin d'œil de genre original, pas un extrait de film ou une
copie de personnage/logo. Aucun appel de génération payant nécessaire.
Les documents internes et le prototypeV4 historique restent en français.

## Taille et lots

1. Lisibilité tactique, résultat et soins : modification de présentation bornée.
2. Infrastructure et couverture bilingue, puis détail décoratif : plus large,
   car les phrases sont actuellement réparties entre HTML, UI et rendu.

Version finale prévue0.35.0/code45. Un conseil3techniques+3 cibles simulées après
chaque lot ; jamais présenté comme une validation réelle des enfants.
Le titre anglais n'est pas un choix d'identifiant Android ou une publication Play.

## Validation

Mêmes graines/commandes donnent les mêmes états et anciens camps/codes lus dans
les deux langues. Changement en accueil, dialogue et pause ; aucun achat, audio,
récompense, reprise ou temps de combat déclenché par la langue. Stockage bloqué
et langue inconnue : repli lisible sans plantage. Tous les libellés anglais
inspectés dans les principaux états, y compris gardes/boss via fixtures.

Captures FR/EN1280×800,1366×768,812×375,780×360,568×320 et 375×812 tactile.
Portée réelle et cases ouvertes, stocks restants et étoiles réellement gagnées
testés. Soucoupe unique, hors voies/commandes, absente des missions. Budgets
HTML32KiB et chaque JS200000octets conservés ; tailles cumulées documentées.
Verify, navigateur, recettes de résultat/missions/codes/hors-ligne/interruption,
présentation et export portable ; APK normal inspecté, site exact publié.
Recette physique du nouvel APK et relecture par anglophone restent distinguées.
