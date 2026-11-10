# Lisibilité — v0.29.0

## Réalisé

Jouer ouvre la préparation de la première mission non terminée et déjà ouverte.
Les étoiles du bandeau correspondent aux six missions ; la progression classique
garde son propre compteur. Reprendre ma mission reste directement accessible.
La grande aventure, la carte, les favoris, les fiches, l’aide et la sauvegarde
restent accessibles ; les chapitres et le code partagé ont des panneaux nommés.

Terrain, attaques et œufs ont chacun une icône et un libellé court. C’est parti
reste dans le pied fixe. Les codes et explications longues sont côté parents ;
l’avertissement de remplacement d’une mission reste visible pour tous.

Conseils et Actions du camp réduisent le texte initial, en gardant tous les outils.
Les cartes d’alliés ont un rôle court ; les fiches gardent les explications.
Le tutoiement des données historiques est adapté par childCopy dans l’interface,
sans réécrire Game, missions, vagues ou décodeur de sauvegarde.

## Vérification

371 tests unitaires, dont180 instantanés de l’ancien moteur, build et budgets.
Recette navigateur : afficher, recruter, reprendre après dépense, changer de
mission, utiliser les outils, copier/retrouver un code, pause/rotation/resize.
Audits, géométries et résultats dans `reports/verification-0.29.json`.
Captures de l’accueil et de la préparation : `docs/captures-0.29/`.

Mesure comparable à 1280×800 :94→57 mots effectivement visibles dans le DOM
avant vague 1 ; le canvas n’est pas compté. Les contrôles audités d’affichage
restent verts. Aucun test réel d’enfant ni performance Android déduite du cloud.

## Réservé

Le lot 2 est livré pour l’interface. Masquer des pouvoirs jusqu’aux missions 2–5
modifierait leur disponibilité : cette sous-partie attend un accord pédagogique.
Le lot 7 (voies ouvertes progressivement) est proposé séparément, sans code.
Le lot 4 est préparé techniquement ; les mesures sur téléphone restent à faire.
Aucun achat, publicité, nouvelle génération payante ou publication GooglePlay.

## Fichiers concernés

index.html, style.css, UI (menu, expeditions, controls, hud, coaching, notices,
favoris, fiches/famille, childCopy), textes du rendu, versions web/Android ;
scripts lisibilité/audit/affichage/codes, helper de lecture visible, scénarios
browser/missions/family et helper de disclosures ; test childCopy, documentation,
captures et rapports. La liste exacte est dans le commit de cette livraison.

## Paquet Android

APK debug 0.29.0, versionCode 30, signature vérifiée,27 fichiers web identiques
au dist testé. Démarrage local en diagnostic ; configuration normale restaurée
après compilation. Aucun test physique ni publication Play. Le test final a
révélé un relevé lu avant le premier RAF : l’identité de partie est désormais
vérifiée avant chaque export, et la régression est verte.
