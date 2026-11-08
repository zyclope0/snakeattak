# Parcours enfant et mobile — 0.31.0

Suite autorisée du rapprochement d'audit. Cette version réalise des sous-parties
d'interface des lots 2 et 7 ; elle ne clôture pas ces deux lots ni le lot 8.

## Réalisé

- Quatre alliés restent accessibles dans un dock en paysage compact. Ils suivent
  les favoris actifs déverrouillés ; un complément déterministe du catalogue
  fournit quatre choix quand les favoris sont trop avancés. Les huit favoris
  enregistrés et les trois équipes restent inchangés. Le manque d'or grise un
  raccourci sans le remplacer, et le prix vient toujours de `recruitCost`.
- Deux pots permettent de choisir Attirer/Ralentir puis de toucher un chemin.
  Les chemins actifs sont surlignés ; une voie paisible, la pause ou un toucher
  entre les chemins ne consomment aucun pot. Les boutons Haut/Centre/Bas restent
  accessibles dans le catalogue pour le clavier.
- Le catalogue complet remplace le dock dans sa colonne, sans couvrir les voies
  ni mettre le combat en pause. Choisir un allié revient aux raccourcis et attend
  le placement réel avant achat.
- Annuler/Échap, retour accueil, nouvelle partie et fin de vague effacent les
  gestes temporaires appropriés. Choisir un allié annule le miel armé, et inversement.
- « Défendez » devient « défends » à l'affichage, sans réécrire le moteur ou ses
  données historiques. Aide, conseils et messages emploient « alliés ».

## Architecture et invariants

Session porte seulement l'intention de sélection et son petit retour d'erreur.
`ui/boardActions.ts` identifie le chemin depuis `lanePoint`, puis soumet la
commande existante `Game.offerFeast`. Les règles restent l'autorité. Le dock
HTML/CSS n'introduit ni nouveau recrutement, ni déplacement manuel, ni calcul
de prix concurrent. Les indices graphiques partagent les mêmes coordonnées.

Game, données, vagues, IA, statistiques, prix et codecs ne sont pas modifiés.
Pas de RNG supplémentaire, dépendance ou asset nouveau. Les atlas existants
fournissent les portraits et pots. Aucun achat, publicité ou génération payante.

## Vérifications

411 tests natifs, types, build et budgets ; mêmes états Game/RNG après commandes
identiques, sélections non sérialisées, formats existants conservés. La recette
du dock vérifie six tailles/marges, cibles de 48px, aucune intersection
avec la carte, aucun défilement du dock, vrais recrutements, deux miels au toucher,
refus, pause, annulation, favoris personnalisés conservés et alternative clavier.

Audit strict : 13/13. À 812×375 sans marges système, canvas 580×327 environ,
soit 87% de hauteur et 71% de largeur. À marges 24/48/16/0, 509×287 environ :
86% de la hauteur **utile** et 67% de la largeur utile. Le ratio 1100:620
est conservé. Les scénarios mobiles antérieurs gardent six tailles/marges et
quatre catalogues étroits. Les recettes interruptions, fichiers embarqués
hors réseau et portable complètent ces vérifications.

Les comptes de mots concernent le DOM visible, pas le canvas ni la compréhension
d'un enfant. Les événements et gestes Chromium ne constituent pas un essai
physique S24. FPS/RAM, appels, verrouillage et confort réel restent à mesurer.

Rapports : `reports/child-mobile-0.31.json`, `reports/audit-0.31.json`,
`reports/mobile-0.31.0.json`, `reports/interruptions-0.31.0.json`,
`reports/offline-0.31.0.json` ; captures dans `docs/captures-0.31/`.

## Revue indépendante

Aucun point critique ; deux points importants corrigés avec régressions RED→GREEN.
Les milieux de voies courbes ne consomment plus de miel (2 604 positions testées).
Sur les paysages courts avec barres système, le dock conserve quatre cartes et
deux pots ; « Alliés » dans le HUD ouvre le catalogue, et toucher à nouveau le
pot ou utiliser Échap annule la sélection. Les cibles visibles restent de 48px.
Les cas 568×320 et 480×320 avec marges système sont maintenant couverts.
La coquille « de alliés » est corrigée dans le texte de préparation.

## Livraison et reste du plan

APK familial 0.31.0, Android code34, même certificat debug ; aucun compteur
au démarrage normal. Les 27 fichiers web correspondent au build testé.
Le dépôt privé reçoit les sources ; aucun AAB ou déploiement Play implicite.
Le site public est publié en 0.31.0 (version Sites 13), depuis le commit statique
`af956d28bc04cf9733090c66d2c9df3b91a50ff8` ; les fichiers sont ceux du build testé.
URL : https://conquete-serpents-famille.zyclope.chatgpt.site/.

Restent visibles dans le plan : prévision des ennemis aux antres ; préparation
et accueil plus illustrés ; disponibilité progressive des outils, Facile et
bonus anticipé à valider ; prolongement de campagne au Tank et au roi ; fonds
crue/marais et icône de l'application ; langues après stabilisation. Le prochain
point de gameplay devra proposer ses valeurs au parent et au fils.

## Choix du développeur

- Dock latéral plutôt qu'un bandeau inférieur pour conserver la hauteur des
  trois voies ; sur petit écran la carte prend moins de largeur.
- Quatre favoris disponibles plutôt que quatre figures imposées : les équipes
  existantes restent respectées ; les raccourcis peuvent différer de la maquette.
- Surface utile hors barres système pour les pourcentages, avec ratio conservé :
  pas de promesse impossible de largeur totale quand la hauteur est réduite.
- Retour d'erreur transitoire dans Session, pas dans la sauvegarde ou le moteur.
- Rapports de régression nommés selon la version courante pour préserver les
  preuves historiques 0.30.1/0.30.2.
- Worktree isolé existant et suivi manuel réutilisés ; aucun autre travail effacé.
