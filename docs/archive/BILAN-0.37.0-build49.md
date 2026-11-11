# Bilan 0.37.0 — publiée sur le site familial

Travaux du 10 novembre ; publication du 11 novembre 2026. Android **0.37.0 / code 49**. Source produit et tests figée :
`b31933bf9f6dc56b9c7bf4d286068f52ff3bf28a`. La revue globale et sa relecture ciblée sont approuvées. La PR7 est fusionnée
après CI verte ; le site familial est publié en Sites24. Le
[reçu de publication](../../reports/deployment-0.37.0.json) apporte les références
Git/CI, la provenance du paquet et les contrôles sur le vrai site.

## Correction finale de revue globale

I1 : Précédents/Suivants, famille et Disponibles/À découvrir replacent le vrai
corps du catalogue en haut après affichage du résultat. Le défilement normal des
outils conserve sa position. M2 : une entrée explicite remet à zéro la destination
Parents/Classique et la carte des missions imbriquée avant le focus du titre.
M1 : la recette journey suit désormais les pages visibles, les quatre favoris du
dock et le catalogue ; elle conserve sauvegarde, huit favoris distincts, budget,
effectif, encouragement, reprise, étoiles, entraînement et remplacement de chapitre.

Source corrigée : `b31933bf9f6dc56b9c7bf4d286068f52ff3bf28a`. Recette fraîche : verify
(**549 tests**), régression navigation **9/9**, journey **4 largeurs**, gestes natifs
**5/5 cas positifs + ordinateur**, menus **519 contrôles**, navigateur normal.
L’APK normal et le portable HTML/ZIP sont régénérés depuis ce commit, avec quatre
démarrages froids FR/EN sans requête externe ni erreur JS, polices prêtes.
Les **34 fichiers** normaux correspondent à l’APK. Le reçu [final-fix](../../reports/interface-0370/final-fix.json)
distingue ces contrôles des 21 commandes antérieures de `9ca13bb`.

L’APK/HTML/ZIP, favicon et reçu précédents sont conservés avec leurs empreintes dans
`/workspace/serpents-interface-0370/pre-global-review/`. Les nouvelles preuves sont
dans `final-fix/`. Le snapshot `root-review-web` et sa partie authentique restent
explicitement en `9ca13bb` : l’HTML et les noms/contenus des modules UI changent comme
indiqué dans le nouveau manifeste, les règles et les autres assets restent identiques.
Le site public est en **0.37.0**. Les 34 fichiers publiés sont identiques au
build normal et à l’APK corrigé ; navigation visible contrôlée à 1280×800 FR,
812×375 EN et 780×360 FR, sans erreur JavaScript.

## Ce qui change

Les huit choix validés sont appliqués côté interface. L’accueil possède une
seule action jaune Jouer/Reprendre et des destinations courtes. La légende de
reprise décrit le mode actif ; les deux camps restent accessibles sur leurs
écrans. Le carnet montre une mission et six autocollants, avec le carnet choisi
visible et Ajouter/Renommer repliés. Les 36 identifiants, noms et annonces du
créateur restent français, y compris en anglais ; les deux « La tempête »
restent distinctes.

La préparation sépare Résumé, Caprices, Copains, Repérage et Options. Départ et
Retour restent accessibles. Le catalogue natif affiche au plus six alliés par
page, garde filtres/pages/fermeture hors du défilement et montre les pièces
utilisables. Le défi bancaire distingue la banque protégée du budget disponible.
Ouvrir fige le jeu ; sélectionner ne dépense rien ; le placement normal paie.
Pause manuelle, arrière-plan et sous-dialogues restent prioritaires. Les quatre
favoris et deux miels du dock gardent leur fonctionnement en temps réel.

La notice portrait utilise son nœud existant dans le dialogue réellement au-dessus
des autres, puis retrouve son parent en paysage. Les dialogues restent ouverts,
avec leur page, focus et pause. Ce contrôle inclut catalogue puis Fiches : le
z-index d’une simple div ne suffisait pas au-dessus du top layer natif.

## Mesures et garde-fous

| Contrôle                                       | Avant                                                                | Version 0.37.0                                                                                                     |
| ---------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Accueil à 780×360                              | document d’environ 630 px, commandes empilées                        | 360 px sans défilement du document, action principale ≥48 px                                                       |
| Carnet                                         | 36 cartes empilées                                                   | 6 par mission ; les 6 cartes entièrement visibles à 780×360 avec marges 24/32/16/0                                 |
| Petit carnet 568×320 avec marges               | texte initialement sous la zone visible                              | sortie/pages fixes ; défilement interne conservé pour lire toutes les cartes                                       |
| Missions sur téléphone                         | pictogrammes sous le premier écran dans la première recette intégrée | Retour et Jouer/Reprendre sur une rangée fixe ; premiers statuts de 44 px visibles et touchables dans le clip réel |
| Catalogue                                      | longue liste et prix étirés                                          | 6 cartes/page, prix compacts, budget visible, 20 alliés atteignables                                               |
| HTML normal                                    | 32 475 octets après le lot 2                                         | 32 475 / 32 768 octets ; budget inchangé                                                                           |
| Moteur, données, persistance et natif protégés | référence `2b5ae48`                                                  | 81 fichiers identiques par SHA-256 ; seule la version Gradle est changée séparément                                |

Aucune règle, valeur, RNG, identité Android, permission, dépendance ou structure
de sauvegarde n’a été modifiée. Les anciens départs/codes et les deux camps sont
vérifiés par les contrôleurs réels. Les styles utilisent les matières papier,
crème, vert et ocre existantes, sans nouveau filtre lourd ni animation ajoutée.

## Recette et artefacts

La passe historique sur `9ca13bb` comprend **21 commandes réussies**, après
`npm ci` : **549 tests unitaires, 519 contrôles de menus, 440 parcours de langue
et 24 bindings, 293 contrôles de caprices/39 captures, 13 contrôles d’audit,
16 parcours missions, 6 tailles mobiles, 5 tailles de gestes plus ordinateur,
14 scénarios de présentation**. Audit npm de production : zéro vulnérabilité.
Navigateur normal et `file://`, transfert familial et scénario de récompenses
réussis. Les quatre démarrages à froid FR/EN (bundle local et portable copié)
restent hors ligne, sans requête externe ni erreur JavaScript ; polices prêtes.

L’[index compact](../../reports/interface-0370/README.md) et le
[reçu de livraison](../../reports/interface-0370/delivery.json) donnent les commandes,
comptages, source SHA, empreinte de l’APK et certificat. Les preuves lourdes sont
hors Git dans `/workspace/serpents-interface-0370/task3/`. Les anciens rapports,
captures et APK 0.36.2 sont préservés ; les recettes sont exécutées en série.

Les objectifs historiques sont conservés avec la vraie navigation visible,
les sous-vues, les disclosures et les pages du catalogue. Le scénario de
récompenses ouvre Help pendant le dispatch d’un vrai clic visible pour éprouver
le rendu tardif et la conservation du focus ; il reste un stress synthétique.
Aucun clic sur une commande cachée ou inerte ne remplace le parcours testé.

La recette historique `9ca13bb` reprend le workflow localement : installation verrouillée,
format, 549 tests, types, build/budgets, audit npm, navigateur normal, audit UI,
préparation, gestes tactiles, mobile, interruptions, hors ligne, présentation,
clarté tactique, langue, caprices, parcours missions, menus, portable, transfert
familial et navigateur sur fichier. Les résultats exacts de cette passe sont dans
le reçu, sans additionner les exécutions historiques aux contrôles finaux.

L’APK debug utilise le même `com.conqueteserpents.famille` et le même certificat.
Le contrôle compare chaque fichier normal de `dist/` aux octets embarqués et
refuse `server`, `appStartPath`, INTERNET, BILLING et AD_ID. Le portable est fourni en HTML et en ZIP complet de cinq fichiers, avec favicon, prototype et licences. Les essais hors ligne sont des démarrages Chromium frais FR/EN,
avec transport local des fichiers embarqués et ouverture `file://` du portable.

## Partie indépendante du coordinateur

Sur une copie immuable des 34 fichiers du commit historique `9ca13bb`, le coordinateur a joué
Le refuge par les commandes visibles, avec seulement les marges 24/32/16/0
simulées. Il a recruté archer 150, médecin 130 et deux massues 55, puis gagné
les trois vagues avec le cristal à 100 % et 753 pièces. Le placement de l’archer a demandé deux reprises avant la position acceptée. Aucun Game, progrès,
budget, victoire ou horloge n’a été injecté. Zéro erreur JavaScript ; les 36 noms
français ont aussi été lus sur les six pages du carnet anglais, puis la notice
portrait contrôlée au-dessus du carnet. Une partie ne conclut rien sur l’équilibrage.

Le rapport est dans `/workspace/serpents-interface-0370/root-visual/` : 20 appels
de capture ont produit 18 noms de fichiers distincts, les trois essais d’archer
réutilisant un nom. Ces preuves restent distinctes des comptages automatisés.

## Limites et devis séparé

Aucun essai physique Galaxy S24, TalkBack, enfant ou relecture anglophone native
n’est revendiqué. Les petits écrans gardent des zones internes défilantes ; les
sorties et pages restent fixes. Les autres recettes historiques de développement
non incluses dans la passe sont distinctes des gates de livraison consignés.

Le [comparatif futur](../archive/interface-0370/DEVIS-COMPARATIF.md) reste au devis :
100 crédits Magnific et 1 crédit Higgsfield de base, en monnaies distinctes ;
référence finale Higgsfield à confirmer et prix Runway par appel indisponible.
Aucune génération ni dépense n’a été lancée. Les images actuelles restent en place.
