# Caprices — interface, conservation et carnets

Source obligatoire : `docs/CAPRICES.md`, section « Reste à faire », points1–8.
Branche de départ `claude/caprices`, commit `c886b82`. Le parent demande la
réalisation, puis STOP avec bilan sans fusion. Le mandat d'autonomie permet
les choix d'implémentation réversibles ; la seule clarification nécessaire a
été obtenue : **carnets séparés par enfant, campagne familiale partagée**.

## Contraintes

- `src/game.ts`, `src/caprices.ts`, `src/missions.ts`, leurs nombres, règles,
  noms et annonces restent inchangés. Aucun nouveau caprice, réglage ou RNG.
- Noms et annonces du fils restent **mot pour mot en français**, aussi en
  interface anglaise. La consigne directe prévaut sur le point6 historique
  demandant36noms/annonces anglais. Traduire les commandes et explications ;
  attribuer `lang="fr"` et une projection brute aux noms/annonces affichés.
- Conserver Phaser3/TS/Vite, frontières règles/rendu/UI, anciens camps1–7,
  codes1/2, enveloppes familiales1–3, prototypeV4 et source d'audit.
- Pas de serveur, compte en ligne, SDK, achat, pub, génération ni voix payante.
- Version de livraison0.36.0/code46, même AppID et certificat provisoires.
- Vérifier verify/browser, recettes caprices/mobile/compatibilité ; APK debug
  normal pour essai. Nouvelle branche/PR base claude/caprices ; pas de fusion
  et pas de publication du site pendant cette mission.

## Expérience

La carte garde son parcours actuel. Chaque mission ouvre sa préparation ;
après une victoire normale, deux rangées de trois défis apparaissent, titres
CAPRICE_SET_NAMES, d'abord serpents puis createur. Chaque case montre le niveau,
son état et les étoiles réellement demandées ; les cases fermées restent
compréhensibles. Choisir une case conserve terrain/attaque/couvée et affiche
le nom/annonce originaux, une icône et une explication courte dérivée des
règles réelles. Un choix « Mission normale » retire le caprice. Relancer un
tirage conserve le caprice sélectionné ; retrouver/rejouer garde exactement
le départ et le caprice. Un code ne contourne jamais mission/étoiles requises.

Pour les caprices `kinds>0`, choisir jusqu'à la limite parmi les sortes déjà
déverrouillées pour cette mission. Le héros est exclu ; les deux massues
initiales restent présentes comme le moteur le prévoit. Choix vide autorisé :
le moteur retient les premières sortes recrutées. Un choix partiel laisse
encore les autres sortes possibles jusqu’à la limite, selon capriceAllows.
Ne pas appeler chooseCapriceKinds pour un tableau vide. Appeler chooseCapriceKinds
sur le Game neuf avant son premier refresh/sauvegarde, sans toucher son moteur.
Le dock, le catalogue et les cartes rapides de favoris lisent capriceAllows, la bourse disponible et les
interdictions de miel ; une carte grisée explique la réserve si nécessaire.

L'annonce peut être lue par une voix française locale déjà disponible via
speechSynthesis, sur action explicite « Écouter ». Sans voix locale, le texte
reste lisible ; pas d'appel de service ou téléchargement. Annuler la lecture
à la fermeture/changement. Pas de narration automatique pendant le combat.

## Carnets et réussite

Un carnet local initial, possibilité d'ajouter/renommer/choisir un carnet avec
un petit nom local (pas d'information personnelle exigée). Aucune comparaison
entre enfants. La carte et les étoiles de campagne restent familiales.
La collection affiche36emplacements, deux rangées par mission, autocollant
original SVG/papier par défi réellement gagné ; pas de doublon, minuterie,
streak ou récompense économique. Une répétition montre que l'autocollant est
déjà dans le carnet. Le carnet choisi au lancement reste propriétaire de cette
partie après changement de carnet à l'accueil et après reprise/import.

La victoire d'un caprice n'améliore pas les étoiles de la mission normale :
réussite séparée dans le carnet. Réessai/camp actifs restent distingués par
l'identité complète du MissionRun, caprice compris. À la victoire : « Caprice
réussi ! », autocollant et accès au carnet ; à la défaite : règle rappelée en
une phrase. Aucun prochain niveau normal promis par le simple caprice gagné.

## Conservation et codes

Checkpoint8 pour une mission à caprice, avec capriceKindsChosen (tableau strict,
unique,0àla limite, héros/sortes inconnues ou indisponibles refusés). Rejouer
chooseCapriceKinds à la restauration. Les camps sans caprice conservent leur
format et leurs empreintes antérieures ; tous les anciens schémas restent lus.

Code3 uniquement si caprice. Format proposé `MOT-3-AAAA-BBBB-S1-CC`, S=serpents,
C=createur,1/2/3=niveau. Charge utile8base32 : seed*256 + configuration +128
si rules2 ; checksum couvre aussi le suffixe. Restituer mission/rules/seed/
layout/assault/nest/caprice exactement ; ancien code1/2 toujours sans caprice,
sans changement de ses octets. Aucun carnet, pseudo ou choix de copains dans
le code : ce sont les choix du joueur, pas les règles de départ.

Nouvelle enveloppe familiale4 si les carnets sont fournis, même clé de stockage
et une seule écriture atomique. Lecteurs1–3 inchangés. L'appelant ancien qui
omet le nouvel argument ne doit pas effacer les carnets déjà chargés.
Import invalide/stockage refusé : état et carnet courants conservés.

## Créateur et présentation

Afficher les pièces bancaires bloquées séparément du total, sans masquer la
bourse. La disponibilité des recrutements/réparation/entraînement utilise
`gold - caprice.reserve`, en lisant les coûts actuels. Le moteur reste l'arbitre.
Les serpents e.shell ont une silhouette un peu plus grande et une coquille
mate dessinée en code, lisible sous contour ennemi. Aucune modification de
position, collision, santé, blindage, vitesse ou taille logique.

## Approche retenue et validation

Étendre les contrôleurs, sérialiseurs et adaptateurs existants, modules courts
pour carnet/lecture caprice ; ne pas construire un second moteur ou une seconde
application. Cette approche est un choix technique de l'implémentation.
Les anciens chemins non caprices restent identiques. Une nouvelle version de
code/sauvegarde est nécessaire pour éviter la perte silencieuse de contexte.

Baseline :473tests et format verts. Tests ciblés rouge→vert pour sauvegarde,
codes, carnets, restrictions et UI. Recettes production1280×800,1366×768,
812×375,780×360,568×320 avec marges ; portrait375×812 garde sa consigne.
Anciennes sauvegardes/codes, deux langues, clavier/tactile, stockage refusé,
imports malformés, résultat/reprise/owner et absence de changement de Game.
Les états installés pour QA ne seront pas présentés comme des parties enfants.
Conseil final3techniques+3cibles simulées, bilan avec preuves/limites et STOP.
