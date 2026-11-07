# Conseil — expéditions 0.21

Conseil simulé, sans observation d'enfant ou de téléphone physique. Le parent
choisit des nouveaux détachements et approuve six missions avant extension à 18.

| Regard                     | Décision                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Game design                | Six missions courtes, chacune avec une intention ; variantes annoncées et départs reproductibles.            |
| Équilibrage                | Budgets fixes, pas de puissance permanente ; simulations de politiques différentes et terrains sans blocage. |
| Interface familiale        | Carte, aperçu avant dépense, distinction reprendre / recommencer / autre configuration.                      |
| Architecture               | Contexte de mission optionnel, géométrie partagée, enveloppe versionnée, classique préservé.                 |
| Joueur enfant hypothétique | Garder dinos, dragons, mutants, ninjas alliés ; reconnaître les pouvoirs et raconter ses propres décisions.  |

## Après moteur et terrains

Les tests RED puis GREEN établissent les configurations réelles, leur validation,
le changement de tirage et la reproduction des œufs. Les données et les traces
classiques sont conservées ; les trois nouvelles géométries ont des identifiants
de cache distincts. Les routes et le rendu partagent les jonctions et obstacles.
Pas de nouvelle monnaie, résurrection, ordre manuel ou génération d'images payante.

## Après progression et interface

Les vraies victoires ouvrent la suivante. Le camp classique et le camp de mission
sont séparés ; l'import familial v2 conserve les deux et lit les formats anciens.
Le parcours navigateur vérifie achats, configuration, retry, rechargement,
changement de mode, export, victoire réelle et mission suivante. Les écrans
320/390/844 sont simulés, pas présentés comme essais physiques.

Le contrôle visuel a révélé un dialogue ouvert trop bas à cause du focus initial
sur le bouton de retour. La reproduction échoue avec scrollTop5 puis passe à0
après focus sur le titre, sans défilement forcé du document.

## Revue indépendante

Deux défauts importants reproduits : rafraîchissement incomplet de la carte
après import et reprise d'un objet perdu plutôt que de son camp préparé. Les
régressions sont isolées avant correction et intégrées au contrôle navigateur.
Le message de fin ne doit pas promettre une septième mission après Carrefour.
Les réserves Android/stockage local et l'absence d'observation d'enfant restent.

## Architecture Android

Le conseil conserve Phaser/TypeScript et prépare Capacitor8.6 avec des fichiers
locaux. Aucun serveur de combat ni réécriture sous Unity/Godot justifiée pour
ce périmètre. L'enveloppe native est synchronisable ; SDK, signature, icônes
finales, APK/AAB et essais physiques restent des étapes de sortie distinctes.

## Conseil produit final avant publication

Avis favorable conditionné aux vingt contrôles de livraison. Les cinq regards
confirment six vraies missions et dix-neuf vagues, pas encore la campagne de 18 missions.
Deux cohortes à graines disjointes totalisent 648 parties sans erreur ni blocage.
Le contrôle méthodique gagne 216/216 ; les achats spontanés 22/36 au Carrefour.
Les novices tardifs laissent beaucoup d'or inutilisé : budgets conservés plutôt
que d'ajouter une aide qui ne traite pas ce comportement. Les durées actives
observées sont 69–225 secondes, plus le temps de préparation choisi par le joueur.

Les deux défauts de revue ont chacun échoué dans leur scénario de régression
avant correction, puis le scénario combiné passe. La comparaison du classique
conserve 21 600 instantanés et 12 checkpoints identiques ; elle n'est pas exhaustive.
Le conseil ne peut conclure sur le plaisir des enfants, la stabilité d'un appareil
physique ou un APK jamais compilé dans cet environnement. Les autres régions,
les icônes natives finales et la signature restent des étapes distinctes.

## Validation finale

Les 289 tests natifs et les 20 contrôles finaux réussissent, dont web/portable,
interface, missions, régressions, cadeaux, transfert file↔HTTPS local, rendu,
synchronisation et diagnostic Capacitor. Les 26 fichiers embarqués Android sont
identiques au build web testé. Le moteur simulé reste à l'empreinte des 648 parties.
Le conseil accepte la livraison de cette première région. Les limites d'appareil
physique, de navigateur authentifié en production et d'APK non compilé restent.

Le service de publication confirme succeeded pour le commit
1001e8db1780920e91861fcc2703dd9d43aaf1ba, à la même adresse privée. Le build
publié correspond aux 26 fichiers testés. L'accès authentifié depuis le navigateur
du propriétaire n'a pas été essayé ; la confirmation porte sur le déploiement.
