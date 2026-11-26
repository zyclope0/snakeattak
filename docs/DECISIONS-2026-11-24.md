# Décisions du parent — 24 novembre 2026

Ce que le parent a décidé ce jour-là, dans l'ordre. Les mots entre guillemets sont les siens
ou ceux qu'il a validés.

## Moteur et images

- **Dessin limité à 60 images par seconde** : relevé sur son S24 avant (120 images par
  seconde, « pas chauffé, écran resté allumé ») et après (60). Fusionné et publié.
- **Images ré-encodées** : planches comparées par lui, « pas de différence » ; 7 Mo de moins.
- **Phaser** : « c'est ok pour le moment », pas d'allègement maintenant.

## Petits restes

- **« Réessaie » ne marchait pas** sur cinq boutons du site (voyage, Grande Expédition,
  confidentialité, index des serpents, missions) : mesuré dans Chromium le 24 novembre, un
  deuxième et un troisième appui ne redemandent jamais le fichier. Phrase d'abord validée :
  « Recharge la page. ». Une attaque indépendante a montré que, réseau toujours coupé,
  recharger mène à la page d'erreur du navigateur ; le parent a alors choisi
  **« Recharge la page quand la connexion revient. »** (anglais : « Reload the page when the
  connection is back. », de moi). La même fin de phrase remplace « Réessaie » pour la langue
  qui n'arrive pas (lue par un lecteur d'écran).
- **Bouton « retour » d'Android** : il quittait l'application depuis n'importe quel écran.
  Accord pour le module officiel `@capacitor/app` (sans permission). Comportement livré, à
  essayer par le parent sur l'APK de test : une fenêtre ouverte se ferme ; en partie, pause
  puis reprise ; partie finie, retour à l'accueil ; page de l'accueil, retour au premier
  écran ; premier écran, l'application passe en arrière-plan.

## Accueil

Le parent trouvait l'accueil « très IA » (bordures, mise en page) et mal hiérarchisé
(« lancer une aventure, elle est en bas à droite cachée »). Deux maquettes (A « écran-titre »,
B « la vallée ») ont été attaquées par trois relecteurs indépendants (usage par un enfant
avec mesures, direction artistique face à de vrais jeux, états du jeu et faisabilité) ; une
maquette de synthèse D « la clairière » en est sortie.

- **D est retenue** : « J'adore vraiment cette direction artistique et la mise en page
  globale, on garde exactement cet esprit diorama et cette disposition. »
- **Décor calmé, objets et pancartes détachés** (sa demande), **dose légère** : flou très
  léger, 16 % de couleur et 13 % de contraste en moins, bords assombris.
- **Quatre choses quittent le premier écran** : « Protège le cristal ! », le numéro de
  version, la ligne « Aventure familiale enregistrée sur cet appareil » et « Ajouter un
  joueur » sous le nom. Version et ligne de sauvegarde vont dans « Pour les parents » ;
  ajouter un joueur reste dans la fenêtre qui s'ouvre en touchant le portrait.
- **Crédits d'images** : oui, tout de suite, 1 500 crédits Magnific au plus, essais compris,
  pour le logo en lettres de pâte, le bouton « Jouer », l'engrenage et l'étoile. À montrer
  avant de garder. Dépensé : 537 crédits (sept images à 75, dont un logo anglais raté, et
  quatre détourages à 3). Le logo anglais « Snake Attack TD » est modelé aussi, pour que
  l'écran anglais ne garde pas un titre dessiné.

## En fin de journée

- **Les pièces modelées sont gardées.**
- **L'accueil peut être poussé sur une branche à part**, pour ne pas le perdre pendant que la
  branche de travail porte la PR des petits restes.
- **Publier** : le parent a donné son mot pour ce lot (« Et publie. »).

## Le soir, après la fusion du nouvel accueil

- **Jouer les recettes avant de pousser** : « on pourrait détecter ces problèmes avant la PR,
  ça ralentit d'environ 40 % la vitesse de développement pour zéro plus-value ». Écrit dans
  `CLAUDE.md` (Méthode) : la CI confirme, elle ne découvre pas.
- **Prochaine étape, avant toute nouvelle fonctionnalité : les autres menus.** « Revoir un peu
  tous les menus du jeu et l'interface pour coller un peu plus au premier menu sans tout
  revoir. […] dans l'aventure normale, l'affichage est moyen, on ne voit rien ce qu'il y a
  dans les images. […] pas forcément une refonte comme la page principale, mais coller un
  petit peu à la page principale. »
- **Proposition acceptée** (« ok pour la proposition, commence par l'habillage et Aventure
  classique ») : un habillage commun à toutes les pages (décor de la clairière assombri,
  plaque, roue, étoile et bouton modelés), puis page par page, « Aventure classique » en
  premier ; aucun bouton ne change de place, aucune règle ne change ; une nouvelle pièce
  modelée se demande avant de dépenser ([bilan du premier lot](BILAN-MENUS-2026-11-24.md)).
- **Publier le premier lot** : « publie, on regarde après si on fait une suite ou publication
  package apk ». Publication n° 51 (commit `3b9f8be`). Le paquet Android pour Google Play
  reste à décider avec lui : rien n'est envoyé à Google.
- **La suite choisie par le parent** : « Continuer les menus ». Deuxième lot : la page
  Missions ([bilan](BILAN-MENUS-LOT-2-2026-11-24.md)).
- **Publier les lots 2, 3 et 4 des menus** (25 novembre) : « publie », après mon message
  disant que les trois lots étaient fusionnés mais pas en ligne. Publication n° 52 (commit
  `bffd3d2` : Missions et en-tête, le voyage et La Grande Expédition, Favoris).
- **Publier les lots 5 et 6 des menus** (25 novembre) : « publie », après mon message disant
  que les deux lots attendaient son mot. Publication n° 53 (commit `87510b3` : « Pour les
  parents », les fenêtres).
- **Publier le lot 7 des menus** (25 novembre) : « publie et fusionne-le, fais le prochain
  lot », après mon message disant que le lot était fusionné mais pas en ligne. Publication
  n° 54 (commit `c968143` : le camp), contrôle en ligne vert.
- **Publier le lot 8 des menus** (25 novembre) : « Oui », après mon message disant que la CI
  complète de `main` était verte et que la publication attendait son mot. Publication n° 55
  (commit `51554be` : le catalogue des alliés, et la CI complète une seule fois, sur `main`).
- **Minutes de GitHub** (25 novembre, le parent montre la facture : snakeattak en fait
  environ 72 %, presque tout « Verify game », environ 53 minutes par passage, deux passages
  par lot). Choix du parent : regrouper 2 ou 3 lots par PR, et ne plus payer deux fois la CI
  complète. Ma première version (sauter la CI de `main` quand la PR l'a passée sur le même
  arbre) avait une faille trouvée par l'attaque indépendante : écartée. Retenu : une PR ne
  fait que la vérification rapide, la CI complète tourne une fois sur `main` (`docs/SITE.md`,
  « Publier » ; `docs/PLAN-ACTUEL.md`, règle de fusion). Écarté : fusionner les petites
  tâches de la CI. Rendre le dépôt public n'a pas été demandé.

- **Publier les lots 9 et 10 des menus** (26 novembre, au réveil) : « publie ». Publication
  n° 56 (commit `e2e62b0` : la fin d'une partie, la pause, petits restes), contrôle en ligne
  vert.
- **Trois questions de la nuit** (26 novembre, posées une à une) : la pâte miel pour l'action
  principale de la fin d'une partie et de la pause seulement quand le bouton est assez large
  pour ses lettres ; le bouton en tête de la fin d'une partie toujours en miel ; la sauvegarde
  familiale et le carnet de caprices chargés à la demande pour alléger le paquet principal
  (196 Ko sur 200).
- **Publier le lot 11** (26 novembre) : « Publie ». Publication n° 57 (commit `f0ddd06` :
  bouton en tête en miel, pâte miel quand le mot tient, sauvegarde familiale à la demande),
  contrôle en ligne vert.
- **Dessins du fils** (26 novembre, « Laisse caprice de côté, commence le reste ») : 1 500
  crédits d'images au plus ; King Snake « doit avoir trois têtes […] de Cobra » ; dessins B et
  B retenus, une question à la fois. Dépense : 612 crédits
  (`public/assets/illustrated/PROVENANCE-ROI-VOLANT-2026-11-26.md`).
- **Boss caché aux pommes** (26 novembre, une question à la fois) : un combat à part ; des
  pommes partout ; il grandit en mangeant ; 12 pommes. Plan : [BOSS-CACHE.md](BOSS-CACHE.md).
- **Boss caché, réglage** (26 novembre, après mesure du lot 2) : « Moyen » (version 1 :
  18 anneaux de 450, 1 200 pièces ; expert 92 %, moyen 59 %, apprenti 36 % sur 200 combats
  simulés). Le miel reste comme le fils l'a dit : il le ralentit, puis il le mange et grandit.
- **Boss caché, nom** (26 novembre, donné par le fils) : « Classic Snake », tel quel en
  français et en anglais, comme King Snake.
- **Boss caché, dessin** (26 novembre) : le dessin A (anneau rond comme un beignet), 153
  crédits (`public/assets/illustrated/PROVENANCE-CLASSIC-SNAKE-2026-11-26.md`).
- **Boss caché, bouton** (26 novembre) : dans l'antre des serpents du premier écran. Une petite
  pomme et son compte (« 3 / 12 ») dès la première pomme du joueur, rien avant ; à 12, le
  bouton « Classic Snake ». Un combat court, jamais gardé : quitter ou recharger ramène à
  l'accueil. Fait au lot 3 ([bilan](BILAN-BOSS-CACHE-LOT-3-2026-11-26.md)).

## Ce qui reste à décider

- « Favoris » : il reste en petit sur l'accueil pour l'instant (un relecteur propose de le
  ranger ailleurs).
