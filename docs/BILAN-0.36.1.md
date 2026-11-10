# Bilan 0.36.1 — interface et livraison privée

Candidate `feat/caprices-interface`, version 0.36.1 / Android 47. Le catalogue,
les règles, les prix, les noms et annonces français, les codes et les formats
historiques restent gelés. Les huit empreintes de référence sont contrôlées.
Aucune fusion ni publication dans ce lot.

| Nº de l’audit                   | État                  | Cause et correction                                                                                                  | Preuve actuelle                                                                        |
| ------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1. Caprices trop bas            | Fait                  | Accès natif en haut de préparation, rangées avant les options parentales ; portes par étoiles conservées             | Recette 0361, préparation et rangées FR/EN, dont 568 avec marges                       |
| 2. Polices du plateau           | Fait                  | Fredoka et Nunito Sans locales partagées ; chargement avant les premières textures Phaser                            | Démarrages froids, normal/hors ligne/portable, captures plateau                        |
| 3. Double félicitation et pause | Fait, constat précisé | Un titre de résultat HTML accessible ; pause cachée et garde sur clic/Reprendre/Espace                               | Victoire/défaite de fixtures étiquetées, bornes du titre/étoiles et navigation clavier |
| 4. Dangers mal centré           | Fait                  | Alignement horizontal et vertical du contenu du bouton                                                               | Mesures à 780×360 et 812×375, FR/EN                                                    |
| 5. Champs du carnet             | Fait                  | Contrôles papier, label visible, hauteur minimale 48 px, espacement et saisie conservés                              | Formulaires réels carnet/préparation et contrôles clavier                              |
| 6. Règles techniques            | Fait                  | Une explication simple FR/EN dérivée de chaque règle ; noms et annonces français exacts                              | 36 défis, tests de présentation et recette caprices                                    |
| 7. Icônes identiques            | Fait                  | Motif local par type, réutilisé dans préparation, carnet et résultat                                                 | Groupement déterministe par flags du catalogue réel                                    |
| 8. Accueil incohérent           | Fait                  | Une entrée interactive par destination, style secondaire commun, prochaine mission et une mention de sauvegarde      | Navigation de production FR/EN et reprise classique/mission                            |
| 9. Cibles trop petites          | Fait                  | Cibles de l’accueil à 48 px minimum                                                                                  | Rectangles des boutons, grands et petits formats                                       |
| 10. Filtre et promesse d’alliés | Fait                  | Largeur réservée au filtre ; phrase conforme au stock réellement disponible                                          | Texte intégral Tous/All mesuré, catalogue et déblocages conservés                      |
| 11. Fichier familial brut       | Fait                  | Bouton du jeu ouvrant le sélecteur natif ; validation et import atomique conservés                                   | Événement filechooser réel, fichier invalide/vide, prévisualisation et annulation      |
| 12. Langue et portée            | Fait                  | Préférence fr/en prioritaire ; sinon langue principale française→fr, autre→en ; portée courte/moyenne/longue dérivée | de-CH/it-CH suivis de fr, priorités mémorisées, données de portée inchangées           |

La pause était déjà désactivée dans le bouton de la 0.36.0, mais restait
visible ; Espace contournait cette désactivation et certains handlers étaient
sans garde terminale. La correction traite ces trois chemins, sans modifier
`Game`. Le résultat conserve titre, étoiles et accès aux actions dans le clip
réel, y compris après la mise au point initiale du clavier.

Les preuves avant/après sont conservées séparément : rouges et vertes des
lots 1 et 2, puis vérification complète sur la version finale. La recette utilise
le vrai bootstrap et les contrôleurs de production ; les victoires/défaites
installées pour contrôler l’interface restent explicitement des fixtures.
La recette caprices conserve aussi une victoire réellement jouée par le moteur.

Documentation : correction bornée des espaces dans la prose, revue des
modifications, code/citations/liens/identifiants/versions protégés. Les titres
historiques et leurs ancres, les tables de noms/annonces et les originaux de
l’audit restent intacts. [Plan d’hygiène chiffré](HYGIENE-DEPOT-0361.md),
proposition seulement, sans retrait d’anciens fichiers.

Les résultats exacts, commandes, SHA, APK et archive locale sont publiés dans
l’[index de livraison](../reports/interface-0361/README.md).
La revue finale fraîche de toute la branche et le conseil de six perspectives
simulées sont encore à faire par le coordinateur après cette livraison.
Ce ne sont pas des avis de six personnes réelles.

## Annexe : mesures d’équilibrage distinctes

1 080 parties appariées, 108 par bras et par ligne, exécutées en lecture seule
sur le vrai moteur et le joueur moyen officiel. Aucune des propositions n’est
appliquée à la candidate d’interface.

| Caprice                                 | Victoires avant → après, sur 108 | Taux avant → après | Moyenne des minima de cristal avant → après |
| --------------------------------------- | -------------------------------: | -----------------: | ------------------------------------------: |
| Mission 6, Le roi et sa grande fringale |                          31 → 61 |  28,70 % → 56,48 % |                           13,95 % → 31,56 % |
| Mission 5, Serpents costauds            |                          42 → 55 |  38,89 % → 50,93 % |                           13,14 % → 19,59 % |
| Mission 1, Les carapaces                |                        108 → 107 |    100 % → 99,07 % |                             100 % → 53,99 % |
| Mission 2, Les carapaces                |                        108 → 108 |      100 % → 100 % |                             100 % → 85,75 % |
| Mission 3, Les carapaces                |                        108 → 108 |      100 % → 100 % |                           99,17 % → 83,17 % |

Les taux de départ des deux grands caprices diffèrent des 26 % et 42 % de
l’audit. Ses données brutes n’étaient pas fournies ; ce contrôle ciblé ne
reproduit pas ses 44 092 parties. La moyenne des minima n’est pas un plancher :
les pires minima après proposition sont respectivement 0, 0, 0, 46 et 46 %.
Aucun timeout dans ces bras. Les robots ne mesurent pas le plaisir d’un enfant.
La proposition de morsure ×1,5 de la mission 1 s’applique à tous les ennemis du
caprice dans le modèle actuel ; sa portée attend encore une décision critique.

Compatibilité : les anciens codes 3 et camps 8 résolvent le catalogue par
identité, sans enregistrer une révision complète des règles. Remplacer les
valeurs sous les mêmes identités modifierait silencieusement les reprises.
Un éventuel lot séparé doit préserver les anciennes règles avec un routage
versionné ; aucune migration ni modification de catalogue n’est réalisée ici.

Limites : Chromium tactile émulé, aucun essai physique S24, clavier Android,
TalkBack, performance ou compréhension d’enfant déduit de ces contrôles.
La relecture anglophone et l’essai du nouvel APK restent à faire. **STOP** après
revue et compte rendu, sans fusion ni publication.
