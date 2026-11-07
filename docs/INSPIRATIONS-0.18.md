# Inspirations, menu et progression — 0.18

Analyse des jeux cités par le parent, consultés le3novembre2026. Les faits de jeu
et les adaptations ci-dessous sont distingués : les valeurs et choix de notre
version sont des décisions de développement, pas des règles copiées des sources.
La DA, les personnages des enfants et les combats autonomes sont conservés.

| Jeu / source                                                                                                             | Principe retenu                                                           | Réalisation dans notre contexte                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [BloonsTD6 — NinjaKiwi, fiche officielle](https://store.steampowered.com/app/960090/Bloons_TD_6/)                        | Choisir une spécialisation d'amélioration.                                | Après vague4, entraîner le héros pour90pièces : frappe×1,15 ou réduction de15% des coups/tirs reçus. Un seul choix par aventure, héros vivant ; ni déplacement manuel ni résurrection. |
| [KingdomRush — Ironhide, fiche officielle](https://store.steampowered.com/app/246420/Kingdom_Rush___Tower_Defense/)      | Une campagne qui donne envie de finir puis améliorer ses résultats.       | Carte des3chapitres existants, meilleurs scores1à3étoiles et véritables camps de reprise. Nos seuils60/90% portent sur le minimum du cristal durant chaque chapitre.                   |
| [ClashRoyale — Supercell, cartes et decks](https://support.clashroyale.com/hc/en-us/articles/49484924205595-Cards-Decks) | Préparer une sélection de cartes.                                         | Huit alliés favoris comme raccourcis de recrutement. Catalogue complet conservé, prix et arrivées inchangés ; aucun tirage de main ou duel imposé.                                     |
| [TowerConquest — fiche du développeur](https://play.google.com/store/apps/details?id=com.sgiggle.towerconquest&hl=fr_CH) | Sauvegarder plusieurs compositions d'escouade.                            | Trois équipes modifiables entre les combats : équilibrée, dinos et vive. La composition ne crée aucun soldat, elle personnalise les raccourcis.                                        |
| [Arknights — Yostar, fiche officielle](https://play.google.com/store/apps/details?id=com.YoStarEN.Arknights)             | Rendre les rôles des défenseurs lisibles au placement.                    | Cercle de portée initiale réelle, couleur et texte Contact/Tir/Soin. Les personnages se déplacent ensuite seuls ; nous ne reprenons pas la grille ni les contraintes d'orientation.    |
| [PlantsvsZombies2 — EA, fiche officielle](https://play.google.com/store/apps/details?id=com.ea.game.pvz2_row)            | Un coup de pouce temporaire au bon moment, inspiré des boosts de plantes. | Encourager les alliés une fois par vague :8s avec intervalle entre frappes réduit de15%. N'accélère ni les médecins ni les ennemis ; pause et fin de vague respectées.                 |
| [RushRoyale — MY.GAMES, mécanique de fusion](https://rushroyale.my.games/en/news/12/welcome-to-update-170)               | Fusion non retenue.                                                       | Elle ferait disparaître ou transformer des alliés nommés pour gérer leurs doublons. Cette logique ne sert pas notre petite armée de survivants ; nous gardons leurs identités.         |

Les liens officiels décrivent les principes des jeux ; leur adaptation en cercles,
raccourcis, scores et chiffres de combat est notre proposition. Aucune image,
personnage, musique ou interface de ces titres n'est réutilisé.

## Menu et progression réellement jouables

Accueil illustré à partir de nos assets, continuer la partie, nouvelle aventure,
fiches, règles et choix d'équipe. Retourner à l'accueil fige le combat courant ;
continuer reprend ce même état. Une nouvelle aventure ou une reprise de chapitre
remplace le camp après confirmation. Les étoiles et équipes sont conservées.

Les chapitres correspondent aux12vagues existantes : clairière1–4, bosquet5–8,
jardin9–12. Une victoire de chapitre vaut1étoile ; garder au moins60% du cristal
pendant tout le chapitre vaut2étoiles,90% vaut3. Réparer ne gomme pas un minimum
antérieur. Le profil retient le meilleur score par chapitre, jamais une monnaie
qui s'accumule à chaque rafraîchissement. Total maximum9étoiles.

Les entrées de chapitres2/3 utilisent les camps réellement capturés après4/8,
avec survivants, santé, pièces et offre de bonus. Aucun budget ou soldat n'est
inventé pour démarrer une carte avancée. Une ancienne partie en milieu de chapitre
peut continuer normalement ; elle ne reçoit pas un faux point de reprise passé.
Les anciens chapitres déjà franchis sont reconnus à1étoile lors de la migration.

## Architecture et sauvegardes

`campaignRules.ts` contient les données de campagne et de score, appliquées dans
Game. Le campv4 persiste l'entraînement et les résultats ; les formats1/2/3 sont
lus. Les effets temporaires suivent l'horloge du moteur et sont réinitialisés
comme les autres temporisations au chargement du camp préparé.

`progression.ts` garde séparément scores, équipes et points de reprise. Validation
des tailles, types,8favoris uniques et camps imbriqués. Le profil renvoie des
copies défensives ; ses erreurs de stockage ne remplacent pas la sauvegarde du
camp. Une reprise en mémoire reste possible pendant la session même si le
navigateur refuse son stockage. Recharger la page nécessite le stockage local.

`Session.screen` suspend l'horloge et le menu endort la scènePhaser. Revenir au
plateau réveille cette même scène et recalcule sa taille ainsi que ses coordonnées
d'entrée. Les unités perdues ne reviennent pas au cours d'un combat ; rejouer est
un nouveau départ explicite depuis le camp choisi, comme une reprise de sauvegarde.

## Validation

Le rapport de campagne et les preuves structurées sont dans reports/balance-0.18
et reports/verification-0.18.json. Les comparaisons utilisent les commandes publiques,
les90pièces réelles d'entraînement et16graines nouvelles. Le contrôle n'active
aucun nouveau pouvoir. Les héros morts ne sont pas entraînés artificiellement.
Les scénarios ne mesurent ni le plaisir d'un enfant ni une tablette physique.

L'analyse garde une mécanique par titre compatible et écarte RushRoyale. Elle
n'ajoute pas de PvP, rareté payante, énergie, coffres ou serveur. Les premières
étoiles ne sont pas une condition pour continuer à utiliser les alliés du catalogue.
