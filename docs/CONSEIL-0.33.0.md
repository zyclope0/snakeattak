# Conseil après le lot A — outils compréhensibles

9 novembre 2026. Six perspectives indépendantes, **avis simulés de conception**.
Aucun enfant réel, téléphone S24 physique ou lecteur d'écran réel n'a participé
à cette revue. Lot inspecté790b804→8528a6b ; captures et recettes du build0.33.0.

| Persona                                     | Constats fondés                                                                                                                                                                                                                           | Décision                                                                                             |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Technique — architecture/moteur/sauvegardes | Modèle de présentation pur ; mêmes conditions que les commandes, aucun changement RNG/règles/formats. Le relecteur a également comparé les prédicats aux vraies commandes sur des combinaisons d'états en mémoire, pas des parties enfant | Pas de correction moteur ; conserver séparation modèle/binder                                        |
| Technique — Android/mobile/performance      | Trois voies et dimensions conservées ; ? remplace X ; portrait révèle Tourne. Ouvrir les quatre sujets ne demande aucune image supplémentaire dans le contrôle ciblé du relecteur                                                         | Garder les assets existants et la case unique du dock ; S24 réel reste à essayer                     |
| Technique — qualité/accessibilité           | Entrée, Tab, Échap et retour au vrai bouton d'ouverture fonctionnent ; catalogue conservé derrière l'aide ; interruptions et pause utilisateur restent acquises                                                                           | Aucun blocage technique relevé. Cela ne certifie ni lecteur d'écran ni toutes les situations natives |
| Cible simulée — 6 ans peu lecteur           | Images et fermeture repérables, mais l'aide dépend encore de phrases ; gratuit/80/90 se perdent dans le texte, ? seul n'explique pas les quatre outils                                                                                    | Ajouter un repère de coût constant et visible ; ne pas annoncer le jeu autonome sans lecture         |
| Cible simulée — 9 ans habitué               | Quand/Geste/Résultat et absence de fenêtre imposée utiles ; trouver Actions du camp reste un détour                                                                                                                                       | Ajouter le chemin court Tous les alliés → Actions du camp → commande, sans nouvelle disponibilité    |
| Cible simulée — 12 ans tacticien            | Coûts et effets conformes ; l'aide ne donne pas de récompense. Après entraînement puis mort, le statut peut encore laisser croire le bonus utile ; réparer ne doit pas suggérer une récupération rétroactive des étoiles                  | Priorité au statut héros tombé ; préciser l'effet non rétroactif de la réparation en expédition      |

## Arbitrage retenu

Une seule passe de correction après ce conseil : badge Gratuit/80/90, chemin
d'accès, statut du héros tombé et précision sur les étoiles. Aucun pouvoir,
coût, seuil de mission, récompense ou dialogue obligatoire ajouté. Le nouveau
cas héros entraîné puis mort doit être reproduit par un test avant correction.
Les ajustements graphiques et textuels simples sont contrôlés en navigateur,
sans tests qui recopient seulement le balisage.

Le `?` reste une aide courte à la demande. Une démonstration gestuelle ou un
accompagnement vocal serait un autre travail ; aucune synthèse payante ni
promesse de compréhension n'est ajoutée. L'essai avec les enfants demeure utile.

## Preuves

- [Recette dédiée](../reports/child-tools-0330.json),
  [formats tactiles](../reports/child-mobile-0.33.json).
- Captures dans artifacts/child-tools-0330, dont after-780x360-honey.png,
  encourage.png, repair.png, hero.png et after-375x812-help.png.
- Source : src/ui/campToolModel.ts, campToolHelp.ts, battleDock.ts,
  dialogs.ts, reinforcementsDrawer.ts et tests/camp-tool-help-033.test.ts.
- Réponses originales des six agents disponibles dans le fil ; aucun avis
  présenté comme un témoignage utilisateur.

Passe retenue intégrée dans d11a090 et vérifiée (434 tests, navigateur, audit et
recette dédiée). Pas de seconde série d’avis présentée comme un essai enfant.
Correctifs et résultat final de ce lot : [bilan0.33.0](BILAN-0.33.0.md).
