# Conseil et journal — 0.19

Conseil demandé par le parent après chaque étape. Les cinq personas sont des
perspectives simulées ; aucune observation réelle d'enfant n'est inventée.

Plan : docs/superpowers/plans/2026-11-04-aventure-vivante.md.
Référence : /workspace/conquete-serpents-baseline-0.18, créée avant modifications.
Le dépôt initial n'a pas de Git ; le snapshot assure le retour arrière. Le dépôt
de déploiement sera séparé et versionnera uniquement la distribution statique.

## Décisions initiales

- Autonomie et conseil après étapes explicitement autorisés le 4 novembre.
- Aucun nouveau service payant ni asset généré nécessaire à cette passe.
- Sites conserve une audience privée ; un accès public n'est pas présumé.
- Les helpers Sites ne sont pas installés dans cet exécuteur ; appliquer leur
  contrat avec Git et une archive statique, identifiants retournés inchangés et
  credential en mémoire/stdin uniquement. Ne pas créer de serveur de jeu.
- La présentation et les données de vagues ont des fichiers distincts ; les
  validations et publications restent séquentielles sous contrôle du principal.

## Étape 1 — accès et parcours

Revue indépendante : council_access_019, lecture du build et de son archive.

| Regard               | Verdict et réserve                                                                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Game design          | Menu, chapitres et reprise donnent une entrée cohérente ; accepté.                                                                                          |
| Équilibrage          | Première publication strictement 0.18, aucune règle changée ; accepté dans ce périmètre.                                                                    |
| Interface/DA         | Titre tronqué à 320 px : défaut reproduit par mesure des glyphes, corrigé en autorisant la grille à rétrécir et en gardant la coupure de ligne du titre.    |
| Développement/mobile | Publication HTTPS native réussie et parcours aux quatre formats ; en-têtes réellement appliqués et connexion authentifiée hors périmètre des essais locaux. |
| Projection enfant    | Bouton principal et progression paraissent lisibles ; aucune observation réelle d'enfant revendiquée.                                                       |

Preuves : 224 tests de référence ; parcours 1440/390/320/844 sans erreur ni requête
externe ; défaut titre RED puis GREEN dans les logs /tmp/019-title-*.log.
Sites privé : appgprj_6aea6e76eaec81919255e945991a9837. Première publication native
succeeded : appgdep_6aea6ec486608191bf4c59f2cc15f818, commit e434b8a.
Les 26 fichiers archivés étaient identiques au build 0.18 contrôlé.

Décision : étape acceptée après correction du titre. L'URL reste identique pour
la livraison 0.19. Le stockage du ZIP ne migre pas automatiquement vers cette
origine HTTPS ; l'accès privé exige la connexion du propriétaire.

## Étape 2 — comprendre le combat

Revue indépendante : council_signals_019 ; dix tests ciblés relancés et captures
320/1440 inspectées, en complément des huit scénarios navigateur du développeur.

| Regard               | Verdict et réserve                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Game design          | Signaux d'événements réels ; le conseil d'encouragement attend une attaque observée.                               |
| Équilibrage          | Aucun changement de combat ou RNG dans les signaux ; comparaison stricte de 600 pas avec et sans observateur.      |
| Interface/DA         | Textes/formes/couleurs cohérents, voisins d'œufs séparés ; annonce de mort masquant une confusion courte détectée. |
| Développement/mobile | Neuf textes réutilisés et six œufs maximum ; pause, fin, reprise et mouvements réduits vérifiés.                   |
| Projection enfant    | Vocabulaire concret ; besoin du relais HTML quand le plateau est petit, compréhension humaine à confirmer.         |

Défaut important corrigé : une annonce de mort de 1,8 s masquait une hésitation de
0,8 s. La sélection HTML compare maintenant les priorités du signal et de
l'annonce. Le placement choisi reste toujours prioritaire. Reproduction et test
RED→GREEN dans tests/coaching-019.test.ts et /tmp/019-notice-*.log.

Le relais HTML explique également l'éclosion et le crachat imminents ; le canvas
conserve leur emplacement exact. La durée du courage vient de l'état réel du
moteur. Les indications de chapitre sont partagées entre menu et préparation.
Le titre mobile coupé de l'étape 1 est aussi couvert par le test de parcours.

Décision : corrections acceptées sur preuves ciblées ; validation globale web et
portable exigée avant livraison. Aucun enfant ni appareil physique n'a été testé.

## Relecture technique finale — corrections supplémentaires

Un relecteur frais a examiné le changement complet contre la copie 0.18.
Deux défauts importants ont été reproduits puis corrigés :

- Les anciennes règles mobiles cachaient les sous-titres du bandeau : elles sont
  retirées. Le test navigateur vérifie désormais la visibilité et le contenu de
  l'explication du crachat, aux quatre formats et dans les deux modes de mouvement.
- Le conseil « Encourager » alternait toutes les 33–67 ms avec le conseil normal.
  `createCoach` conserve l'observation d'un vrai coup pendant la vague, avec
  priorité aux urgences. Il ne modifie pas Game. Le test avance un vrai combat
  et vérifie la persistance entre les coups, l'utilisation et le redémarrage.
  Les effets de la vague précédente sont exclus : reproduction RED puis GREEN
  sur un dernier coup réel suivi immédiatement du départ de la vague suivante.

Le défaut mineur de briefing 9 dépassant sa plaque de 16,68 px est aussi corrigé :
retour automatique sur deux lignes, vérifié par mesure du vrai texte Phaser.
Le moteur et les scripts de simulation restent gelés pendant ces corrections UI.

Preuves ciblées : /tmp/019-mobile-tip-red.log, /tmp/019-final-signals-green.log,
/tmp/019-coach-contact-_.log, /tmp/019-contact-boundary-_.log et
/tmp/019-briefing-red.log. Une passe QA intermédiaire a été arrêtée pour rebâtir
les deux distributions avec ces correctifs ; les preuves finales porteront sur
les fichiers corrigés, sans réutiliser des contrôles de l'ancien build.

Le contrôle d'interface a ensuite reproduit un dépassement du plateau à 1024×600 :
sommet 207,14 px et hauteur 401,30 px, bas à 608,44 px. Les anciennes dimensions
réservaient la place d'un bandeau sans explication. Une mesure avec styles injectés
a confirmé le correctif avant écriture : plafonner le plateau des écrans bas et
réserver le bandeau complet en paysage téléphone. Les quatre formats sondés
gardent le canvas entier dans l'écran. Les règles de combat et d'entrée sont
inchangées ; le test d'interface doit ensuite confirmer le vrai placement tactile.

## Étape 3 — chapitres et décisions

Revue indépendante de council_access_019 sur les quatre lots et leurs empreintes.

| Regard            | Verdict et réserve                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Game design       | Escorte et ressorts groupés sont concrets ; variation volontairement limitée à deux vagues.                                                            |
| Équilibrage       | Découverte 61→59/64, dans le seuil prévu ; validation distincte 110→118/128, défaites avant vague 12 de 2→0. Pas de supériorité universelle démontrée. |
| Interface         | Les intentions et briefings décrivent les vrais ennemis ; les pouvoirs restent des choix, aucune promesse de victoire supplémentaire.                  |
| Développement     | 1 024 campagnes, zéro erreur/timeout, quatre empreintes de résultats recalculées et 19 modules moteur toujours identiques à la validation.             |
| Projection enfant | L'anticipation semble cohérente ; compréhension, fatigue et plaisir non observés.                                                                      |

Les six politiques font 118, 113, 115, 117, 116 et 113 victoires sur 128. Les cinq
comparaisons de pouvoirs sont exploratoires, avec intervalles recouvrant zéro.
Le profil mêlée passe de 15 à 14 victoires sur 16 ; les dinosaures restent les
moins gagnants, à 11/16. Les pertes moyennes du contrôle montent légèrement de
17,44 à 17,77. Ces réserves restent dans le bilan ; aucun rééquilibrage après coup.

Décision : passage à livraison accepté. La cohorte principale repose sur seize
graines et huit bots, et non 1 024 observations indépendantes d'enfants.

## Étape 4 — conseil de livraison

Le conseil indépendant accepte la livraison avec réserve, après les contrôles
finaux et la publication native. Design : périmètre cohérent ; équilibre : aucune
régression globale détectée ; interface : contrôles automatisés verts ;
développement : réserve sur le rechargement file ; projection enfant : essais
humains encore nécessaires. Ce verdict reste une revue simulée.

Les 13 contrôles finaux passent, dont 246 tests natifs, web et portable,
récompenses, interface, parcours, 14 scénarios de présentation, 8 de signaux et
restauration WebGL. Les empreintes moteur/laboratoire restent celles des campagnes.

Les deux passes QA ont chacune retrouvé un ancien camp de trois unités après
achat d'un quatrième dans le contrôle de récompense portable. Les échecs sont
conservés dans les rapports des tentatives 1 et 2.
Deux diagnostics instrumentés, dont un concurrent au parcours, puis le test
standard **non modifié** sont passés. Aucune cause ni écriture fautive n'a été
établie : ce cas n'est pas déclaré corrigé, aucun patch de production aveugle
n'est ajouté. L'accès HTTPS est privilégié et la reprise file garde cette réserve.

Publication native 0.19 : succeeded, appgdep_6aea75fff5dc819185d9605dc4c53198,
source 1531caa63fc69aa66fd8a647543d1955829d9e41. URL inchangée et audience
privée confirmée par la politique backend (propriétaire seul). La requête HTTP
automatique a reçu Cloudflare 1010 ; elle ne valide pas la connexion réelle.
Aucun téléphone physique, enfant ou parcours familial authentifié n'a été testé.

Décision finale : livrer le jeu web et l'export, avec ces limites explicites,
sans autre réglage de combat après validation.
