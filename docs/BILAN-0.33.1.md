# Lot B — accueil et progression illustrée, v0.33.1

9 novembre 2026. Mandat autonome ; base3f53bba, implémentationf428763,
passe après conseil2a95623. Version0.33.1/code41, même identité Android.

## Fait et preuves

| Point                 | Résultat                                                                                                                                             | Preuve                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Direction de l'icône  | Icône512 existante, inchangée, entière dans le diorama et favicon ; fond exact#214C3B. Pas d'original2048 dans le runtime                            | [Accueil](captures-0.33.1/accueil-1280x800.png), [source/hash](../reports/suivi-0.33.1/journey.json) |
| Parcours six missions | Médaillons papier reliés, emblèmes SVG locaux et vrai numéro/vagues/objectif/étoiles ; ordre naturel conservé                                        | src/ui/missionJourneyView.ts/CSS, expeditions.ts                                                     |
| États lisibles        | Terminé, prochaine, ouvert, verrouillé ; symbole haut et texte, pas une couleur seule. disabled provient du vrai contrôleur                          | src/ui/missionJourney.ts, [4 096profils](../reports/suivi-0.33.1/progression-combinations.json)      |
| Navigation et rejeu   | Jouer et reprises avant carte repliable ; six réussites donnent Rejouer et son vrai nom de mission, aucune mission7. Classique explicitement12vagues | [Parcours16cas](../reports/suivi-0.33.1/journey.json)                                                |
| Promesses exactes     | Roi à trois têtes dans la grande aventure ; pas annoncé comme fin des six expéditions. Autres régions non promises                                   | index.html, mêmes missions et règles                                                                 |
| Chargement initial    | #app masqué dès HTML, puis affiché par view(false) existant au lancement/reprise ; plus de flash initial du plateau ou de ses images                 | index.html, main.ts inchangé ; mesure ci-dessous                                                     |
| Historique préservé   | Anciennes captures/résultats0.32.2 conservés ; recette interface écrit selon package.version                                                         | scripts/interface-0322-browser.mjs                                                                   |

## Conseil et correction

[Six personas](CONSEIL-0.33.1.md) : trois techniques n'ont relevé aucun blocage ;
les trois profils d'enfants simulés ont conduit à quatre clarifications ciblées.
La correction n'ajoute ni niveau, ni statistique, ni récompense. Quelques emblèmes
restent abstraits pour un enfant peu lecteur : compréhension réelle non démontrée.

## Vérifications

| Contrôle                     | Résultat                                                                                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| npm run verify               | **438/438**, types, format, build et budgets verts après correction                                                                             |
| npm run test:mission-journey | **16cas**, profils vide/partiel/complet/irrégulier, viewport et clavier/tactile ; zéro erreur                                                   |
| npm run test:browser         | Ordinateur et tactile verts                                                                                                                     |
| npm run test:missions        | Vert, après révélation des contrôles réels dans trois étapes de la recette historique                                                           |
| npm run test:departures      | Vert, anciens parcours de départ conservés                                                                                                      |
| npm run test:audit           | **13/13**                                                                                                                                       |
| npm run test:interface-audit | **24/24**, vraie image visible entière et hash source ; résultats versionnés                                                                    |
| Profils exhaustifs           | **4 096**, toutes les affectations0–3étoiles sur six missions, même contrôleur et aucune mutation. Ce ne sont pas des parties ni un équilibrage |
| Budgets finaux               | HTML31 299/32 768octets ; JSjeu191 833/200 000. Aucun budget relevé                                                                             |

Les tests de missions conservaient deux clics Ninja et une lecture de résultat
dans un catalogue désormais replié depuis0.32.2. Échecs reproduits puis trois
revealControl ajoutés, sans changer l'application ou retirer les assertions.
Le test du trait blanc de l'ancien sprite d'accueil a été remplacé par le
contrôle de l'illustration réellement utilisée, pas par un élément caché factice.

## Mesure réelle des images du premier écran

Chromium, contextes frais, avant0.33.0 et après0.33.1 :

| Mesure                            | Avant           | Après         |
| --------------------------------- | --------------- | ------------- |
| Images demandées                  | 6               | 2             |
| Corps des réponses image          | 2 618 518octets | 772 165octets |
| Transfert images, en-têtes inclus | 2 620 318octets | 772 765octets |

Soit environ70,5% de corps image en moins pour ce premier écran. Les deux images
restantes sont l'icône et interface-craft. **Ce n'est pas une mesure du réseau
total, du délai de lancement, de RAM ou de FPS Android.** Les assets utiles au
combat se chargent ensuite comme prévu.

## Fichiers modifiés et limites

- missionJourney.ts : présentation pure ; missionJourneyView.ts/CSS : images,
  badges et matière ; expeditions.ts : mise à jour des six boutons réels.
- menu.ts/index.html : nouvel accueil/favicon, mêmes commandes ; versions du
  package/lock et Android0.33.1/code41 ; aucun package final choisi.
- Tests Node et recette mission-journey ; adaptation des recettes missions et
  interface, captures et rapports de la nouvelle version seulement.
- Conseil, bilan et plan ; aucun fichier de règles, RNG, format de camp/code,
  dépendance ou PNG source modifié. Aucun service ou image payant ajouté.

Pas de nouveau terrain crue/marais, nouvelle région, extension de campagne,
mode Facile ou appel anticipé. Tous les sprites du plateau ne sont pas refaits.
Ni APK ni publication intermédiaire : le lotC termine les transitions et prépare
la livraison. Téléphone réel, lecteur d'écran et essais enfants restent distincts.

## Livraison ultérieure du même numéro de version

Le lot C a terminé les recettes, corrigé le portrait étroit, assemblé l’APK normal
et publié le site0.33.1. Consulter le [bilan de livraison](BILAN-LIVRAISON-0.33.1.md)
et le [conseil final](CONSEIL-LIVRAISON-0.33.1.md), qui complètent ce bilan du lot B.
