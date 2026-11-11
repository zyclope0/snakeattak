# Conseils 0.37.0 — six perspectives simulées après chaque lot

Aucun essai réel avec des enfants, S24 ou lecteur d’écran. Chaque tableau est une
relecture simulée des preuves citées, avec trois regards techniques et les âges
6, 9 et 12 ans. La revue globale indépendante reste au coordinateur.

## Conseil du lot 1 — six perspectives simulées

Il ne s'agit pas de tests avec de vraies personnes. Entrées : rapport Task1,
234 contrôles ciblés, verify548, browser final, captures relues par le
coordinateur (accueil780, carnet780 et carnet568 avec insets24/32/16/0).

| Perspective           | Observation                                                                                                                               | Décision                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Architecture UI       | Navigation et délégation des commandes, aucun nouveau format de sauvegarde ; deux camps identiques après les reprises.                    | Direction acceptée, confirmer par revue indépendante.                                           |
| Ergonomie Android     | Accueil630→360px à780 ; bouton Jouer doré48px, retour/page fixes.                                                                         | Accepté ; garder la vérification des marges sur les prochains écrans.                           |
| Qualité/accessibilité | 234 contrôles, focus/retour/langue et noms bruts vérifiés ; aucun essai TalkBack réel.                                                    | Vérifier les autres parcours au lot3 ; ne pas revendiquer accessibilité certifiée.              |
| Enfant6ans            | Une seule action jaune et carnet en six images rendent le choix plus direct ; sur568safe les noms sont initialement sous la zone visible. | Valider la simplification ; chercher à gagner de la place au polissage sans réduire les cibles. |
| Enfant9ans            | Deux familles et mission par page, nom du carnet visible ; gestion administrative repliée.                                                | Accepté, conserver noms/annonces inventés.                                                      |
| Enfant12ans           | Modes et reprises encore disponibles sans encombrer l'accueil.                                                                            | Accepté ; catalogue et préparation restent à traiter au lot2.                                   |

Bilan : lot1 cohérent avec les choix validés, soumis au verdict indépendant.
Le défilement interne du très petit paysage reste explicite ; l'absence de
scroll du document ne signifie pas que toutes les cartes y tiennent entièrement.

Revue indépendante du lot1 : Approved, aucun finding. Lot1 clôturé.

## Conseil du lot 2 — six perspectives simulées

Aucun essai réel avec des enfants. Entrées : captures préparation/catalogue780
relues par le coordinateur, recettes ciblées442, locale440, verify549,
navigateur final sans erreur, caprices293/39captures avec victoire native.
Le verdict reste soumis à la revue indépendante du lot2.

| Perspective           | Observation                                                                                                                        | Décision                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Architecture UI       | Pause par baux existants, projection de disponibilité en UI, commandes Session/Game après fermeture, aucun fichier moteur modifié. | Accepté sous revue des transitions/nouvelles requêtes de pause.           |
| Ergonomie Android     | Cinq onglets courts, résumé/terrain visibles, départ/retour fixes ; six cartes catalogue en3×2 avec filtre/pages accessibles.      | Accepté ; recette finale safe areas et rotation au lot3.                  |
| Qualité/accessibilité | Fermeture/réouverture native immédiate, pause manuelle/arrière-plan, reset et focus testés ; fuite de bail corrigée.               | Accepté sous revue indépendante, garder tests de non-régression.          |
| Enfant6ans            | Choisir un allié sans que la bataille continue, puis toucher le camp ; petit résumé plus direct.                                   | Garder l'action de placement normale, pas d'achat à la seule sélection.   |
| Enfant9ans            | Caprices et copains ont un onglet visible ; le texte d'un choix restreint n'apparaît plus sur une mission normale.                 | Accepté ; noms et annonces inventés conservés.                            |
| Enfant12ans           | Pagination/filtrage atteignent tout le catalogue ; outils, entraînement et réserves restent utilisables selon leurs règles.        | Accepté ; anciens codes et réessais inchangés à confirmer en intégration. |

Le comparatif d'images n'est pas lancé. Les quatre raccourcis du dock restent
en temps réel. Les8cartes de favoris qui faisaient doublon sont retirées ;
le choix de composition et les8favoris restent sous les contrôleurs existants.

Revue indépendante : pagination initialement défilante corrigée en ee4e9bd.
476contrôles après correction ; relecture ciblée Approved, aucun finding résiduel.
Le coordinateur a relu la capture568safe au bas des outils : pages/fermeture visibles.
Lot2clôturé, direction acceptée avec cette correction.

## Conseil du lot 3 — finition et recette locale

Entrées : source `9ca13bb`, 519 contrôles ciblés, captures réellement relues du
carnet 780safe, du catalogue avec pièces, des missions et de la notice au-dessus
des Fiches. Les résultats complets et l’APK sont consignés dans le reçu final.

| Perspective           | Observation                                                                                                                                                     | Décision                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Architecture UI       | 81 fichiers protégés identiques ; lecture du budget existant ; rotation sans fermeture/réouverture des dialogues.                                               | Direction conservée ; revue globale des transitions et du paquet avant publication.                            |
| Ergonomie Android     | Cibles ≥48 px, six cartes lisibles à 780safe, sorties/pages fixes ; pictogrammes mission dans le clip réel ; pièces visibles dans le catalogue.                 | Accepté localement, conserver le défilement borné sur 568safe et demander les essais physiques au stade prévu. |
| Qualité/accessibilité | Hit-tests de top layer, rotation imbriquée, focus, anciens codes, reprise, langues et transfert familial ; recettes historiques suivent les commandes visibles. | Recette locale documentée ; aucun claim TalkBack ni CI distante.                                               |
| Enfant 6 ans          | Une action jaune et les pièces près des prix expliquent quoi faire et ce qui est achetable ; la bataille attend pendant le choix.                               | Garder sélection puis placement normal ; ne pas réintroduire l’achat sur la simple sélection.                  |
| Enfant 9 ans          | Carnet choisi et deux familles visibles ; les noms français inventés restent exacts même dans l’interface anglaise.                                             | Préserver les identifiants et les deux « La tempête » distinctes.                                              |
| Enfant 12 ans         | Missions/classique et anciennes reprises restent accessibles ; tous les alliés se parcourent par pages, sans perdre banque, outils ou favoris.                  | Conserver ces parcours ; le comparatif artistique reste séparé, sans génération payante.                       |

Direction du lot 3 acceptée comme candidate locale sous les gates du reçu et la
revue globale. Aucune décision de règle, valeur, sauvegarde ou nouvelle mécanique.
