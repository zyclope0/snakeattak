# Interface mobile courte — cadrage validé, v0.37.0

Le parent a validé les huit choix A successifs puis « tous ok », le 10 novembre 2026. Cette fiche consigne cette validation ; elle ne rouvre pas les arbitrages.
Source : audit visuel du 10 novembre, captures de notre jeu et choix du parent.

## But et périmètre

Rendre les menus Android lisibles sans longs écrans empilés. Phaser et les
règles restent séparés des vues HTML/CSS. Aucun nouveau contenu ni équilibrage.
L'icône Magnific existante fait foi : pâte à modeler/papier mâché, crème,
vert profond, ocre, touches bleues ; relief discret et texte net.

## Les choix validés

1. Accueil compact, écrans courts dédiés aux missions, carnet et favoris.
2. Carnet : une mission par page, six autocollants (deux familles × trois),
   36 au total. Navigation mission précédente/suivante, identifiants inchangés.
3. Carnet choisi et sélecteur visibles. Ajouter/Renommer sous « Gérer les
   carnets ». Les carnets restent séparés, la campagne reste familiale.
4. Un bouton principal contextuel Jouer/Reprendre. Le mode actif existant
   choisit la reprise ; sauvegarde mission et sauvegarde classique restent
   accessibles sur leurs écrans. Aucun format de sauvegarde supplémentaire.
5. Préparation : résumé court puis vues séparées pour modifier caprice et
   copains, consulter le repérage et les options de départ. Départ/retour fixes.
   Conserver les informations, restrictions et départs existants.
6. Tous les alliés : catalogue plein écran paginé, six alliés maximum par page.
   Les quatre favoris et deux miels du dock restent disponibles en bataille.
7. Ouvrir le catalogue fige le jeu ; fermer retrouve l'état précédent. Une
   pause manuelle ou d'arrière-plan reste une pause. Choisir ne dépense rien ;
   placer au retour utilise les règles de recrutement existantes. Le dock ne
   fige pas le jeu. Les sous-dialogues ne doivent pas libérer une autre pause.
8. Comparatif futur : un héros et un décor, chacun par Magnific, Higgsfield
   et Runway, six images. Devis concret avant premier appel payant ; aucune
   génération payante autorisée par ce cadrage. L'interface utilise les assets
   existants en attendant. Aucun résultat généré n'est promis avant devis.

## Garde-fous

- Noms et annonces des 36 défis en français, exacts ; les 18 noms du tableau
  du parent sont vérifiés. Les deux « La tempête » restent distinctes par ID.
  « Caprices des serpents » et « Le défi du créateur » sont deux familles.
- Révision d'équilibrage 2 actuelle et départs historiques inchangés.
- Aucun Math.random ajouté aux règles ; aucun changement moteur, RNG,
  formats de codes/camps/famille/carnets, identité Android, permissions ou SDK.
- Français et anglais pour toute nouvelle commande, hors textes protégés.
- Cibles tactiles au moins 48 px ; safe areas Android conservées.
- Écrans 780×360, 812×375, 1280×800 ; petit 568×320 et portrait de rotation
  contrôlés en complément. Les longs textes peuvent défiler dans une zone
  bornée ; pas de contenu coupé ou de contrôles de sortie hors écran.
- Réduction des mouvements respectée ; focus visible, Escape et retour
  cohérents. Pas de faux claim de test physique S24 ou de lecteurs d'écran.
- Preuves lourdes hors Git, anciens rapports et passation conservés.

## Livraison

Trois lots, conseil de six perspectives simulées après chacun (trois
techniques, enfants 6/9/12 ans). Tests et revue indépendante ; bilan précis,
APK debug et site actualisé après contrôles. Push/fusion/publication déjà
explicitement autorisés par le parent. Version 0.37.0, Android code 49.
Le comparatif payant reste un livrable séparé, arrêté au devis.
