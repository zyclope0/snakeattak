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

## Ce qui reste à décider

- « Favoris » : il reste en petit sur l'accueil pour l'instant (un relecteur propose de le
  ranger ailleurs).
