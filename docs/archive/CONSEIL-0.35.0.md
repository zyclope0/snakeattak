# Conseil final — tactique, français/anglais et décor discret

9 novembre 2026. Six relectures indépendantes du commit `ac6a825`, après
le [conseil du premier lot](CONSEIL-0.35.0-lot1.md). Trois axes techniques
et trois cibles simulées ; aucun enfant réel, appareil S24 ou anglophone
n'a été présenté comme participant. Une seule passe de correction des
constats importants, avec reproduction et tests de non-régression.

| Persona                       | Axe examiné et conclusion retenue                                                                                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture                  | Langue aux frontières d'affichage, moteur canonique, anciens codes et sauvegardes conservés ; pas de compteur médical ou score parallèle. Les limites de taille restent appliquées à chaque fichier. |
| Mobile                        | Sélecteur et commandes principales accessibles aux formats testés, y compris pause et marges système. Les anciennes petites commandes secondaires et l'indice de défilement restent des suivis.      |
| Localisation et accessibilité | Relecture sémantique indispensable en plus de la couverture automatique. Les données brutes restent intactes ; leurs libellés accessibles doivent néanmoins être traduits.                           |
| Cible 6 ans simulée           | Geste de placement explicite et étoiles lisibles. L'aide détaillée reste longue avant ses premiers gestes ; compréhension réelle à vérifier avec les enfants.                                        |
| Cible 9 ans simulée           | Rôles et menaces décrits sans changer les règles. Les badges médicaux regroupés réduisent le bruit, mais leur nombre et leur délai maximal gagneraient à être expliqués.                             |
| Cible 12 ans simulée          | Même départ et même stratégie dans les deux langues. Les tireurs comprennent plusieurs familles d'alliés ; la traduction doit conserver ce sens.                                                     |

## Constats regroupés et traitement

- **Important : cobra royal.** La traduction du conseil de vague indiquait un
  gain de 2 PV au lieu de la perte réelle de 2 PV. Correction dans le catalogue
  anglais uniquement ; le test vérifie le conseil de la vague 8 contre
  « loses 2 HP » et exclut tout vocabulaire de soin.
- **Reclassé important pour la promesse bilingue : deux feuilles d'aide.**
  `et le` et `. Le mamba noir retire` échappaient à l'inventaire et à la
  détection heuristique. Traductions exactes ajoutées, extracteur et détection
  renforcés ; test des fragments découpés par le balisage.
- **Reclassé important pour les attributs accessibles : rapport brut.**
  L'exclusion des contenus `textarea/code/pre` excluait aussi leurs métadonnées.
  Le texte et la valeur restent bruts, tandis que le libellé linguistique peut
  se traduire. Test rouge puis vert sur `aria-label`, sans altérer le rapport.
- **Précision tactique, traitée dans la même passe :** « tireurs » devient
  « ranged allies », et non seulement « archers ». Portées et données inchangées.

Les premiers tests de revue ont reproduit les omissions. Le premier test du
cobra interrogeait par erreur la vague 7 : corrigé en vague 8 **avant** la
reproduction rouge valide et la correction produit. Ce faux échec de scénario
n'est pas une preuve contre le produit.

## Compléments du contrôle élargi

Après le conseil, l'audit interface a reproduit une régression : la consigne de
placement masquait l'éclosion. Correction minimale : événement prioritaire sur
la même ligne, retour de la consigne après disparition. La recette tactique
contrôle les deux états aux trois formats. L'ancienne attente d'une ligne vide
après événement est mise à jour pour vérifier ce retour, sans retirer le
contrôle d'éclosion. Le moteur reste inchangé.

## Mineurs conservés en suivi

Boutons secondaires de l'accueil parfois inférieurs à 48 px ; ordre et longueur
initiale de l'aide ; petits textes transitoires près du fort ; explication du
nombre/délai médical collectif ; amorce de défilement des actions secondaires.
La soucoupe a été revue visuellement ensuite par l'auteur : le conseil sur
`ac6a825` ne constituait pas encore une inspection de son image rendue.

Les tests linguistiques vérifient couverture, paramètres, états et invariants.
Ils ne certifient pas toutes les nuances d'anglais, le lecteur d'écran réel,
les polices système agrandies ou le confort des enfants. Une relecture humaine
anglophone et le nouvel APK sur le S24 restent utiles.
