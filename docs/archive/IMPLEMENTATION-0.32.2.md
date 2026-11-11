# Étape 1 — correctifs d'interface 0.32.2

GO explicite du parent après l'étape 0, 8 novembre 2026. Base : 36305b8.
Travail isolé : branche fix/audit-interface-0322.

## Périmètre et choix de réalisation

- Même dock, quatre favoris, deux miels et catalogue sur demande à toutes les
  tailles ; commandes, prix, placements et règles de recrutement inchangés.
- Dock latéral compact sur ordinateur, proportions 1100/620 conservées. Le gain
  vient de la largeur libérée. Comme exposé à l'étape 0, récupérer les 150 px
  entiers n'est pas garanti ; publier le gain effectif, sans étirer les voies.
- Une annonce HTML sur une ligne au bas du plateau ; supprimer la plaque
  Phaser transitoire, conserver les signaux tactiques et du boss.
- Masque CSS local au héros d'accueil : enlever seulement le fragment blanc
  situé à droite des pieds, sans retoucher les atlas ni générer d'image.
- Version 0.32.2/code 37 ; identifiant/certificat conservés. Aucun changement de
  règle, RNG, sauvegarde, ancien code de départ, monétisation ou autre lot.

## Exécution

1. Baseline native : 423/423. Causes reproduites et mesurées à l'étape 0.
2. Régressions avant correction : pixels blancs sur trois formats, dock absent
   sur ordinateur, annonce HTML absente. Rapport interface-red.json.
3. Corrections CSS, tiroir et présentation ; contrôles de navigateur réels.
4. verify, browser, audit, child-mobile et défilement tactile ; captures
   avant/après et mesures ; android:apk:debug, signature et fichiers embarqués.
5. Une relecture indépendante, correction des points importants et recette
   finale. STOP pour test physique du parent sur S24, aucun déploiement.

## Journal et arbitrages

- Le tiroir était limité aux formats compacts en CSS et JS. Il est maintenant
  disponible à toutes les tailles, sans changer les commandes du moteur.
- RED complémentaire : une annonce d'œuf disparaissait pendant le guide de
  placement. L'ancien flash Phaser était indépendant : garder ce comportement
  dans l'annonce HTML, avec test du vrai adaptateur dans un navigateur.
- Les parcours historiques conservent leurs assertions ; le helper de détails
  et le test de défilement ouvrent le catalogue avec le vrai bouton.
- child-mobile attendait le dock masqué après rotation vers l'ordinateur :
  cette attente contredit désormais la demande. Elle devient dock visible,
  quatre favoris visibles, catalogue fermé ; tous les gestes sont conservés.
- Une fixture de test d'annonce manquait de charset UTF-8 ; correction de la
  fixture uniquement, sans changement des textes sources du jeu.
- Relecture indépendante : deux P2 (hauteur fondée sur un HUD supposé de 88 px
  aux tailles intermédiaires ; catalogue restant ouvert après Accueil desktop).
  Régression RED puis une passe de correction : grille CSS bornée par ses
  vraies lignes et fermeture depuis tous les accès Accueil.
- Le retour de focus sur un bouton caché au redimensionnement est également
  traité dans cette passe du tiroir, pour conserver l'accès clavier ; aucun
  chantier général de lecteur d'écran n'est prétendu réalisé.
- L'annonce reste indépendante du guide et garde sa même horloge de pause.
  Aucun second passage de revue ; les régressions contrôlent les corrections.

- Recette finale : 423/423 natifs, 24/24 interface, 13/13 audit, six formats
  child-mobile, cinq formats tactiles et ordinateur, dix contrôles hors ligne
  (camps 1 à 7), onze interruptions ; zéro erreur. APK/code37, certificat identique,
  27 fichiers web identiques. Le script APK active le diagnostic puis remet la
  configuration normale : second assembleDebug --offline pour livrer le démarrage
  normal, sans surcouche FPS. Chemin Gradle produit par le lien de dépendances
  restauré au chemin relatif portable d'origine (même dépendance physique).
- Étape 1 terminée. STOP explicite pour essai physique du S24 par le parent.
