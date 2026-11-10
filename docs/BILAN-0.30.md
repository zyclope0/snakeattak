# Tutoriel progressif — v0.30.0

Le nouveau refuge commence au centre, ouvre ensuite le haut ou le bas selon la
graine, puis les trois voies. Elles restent visibles et les alliés peuvent être
placés partout. Les œufs, apparitions et décisions de jonction suivent le même
masque. Le miel sur une voie paisible est refusé sans consommer le pot et le
panneau explique cette restriction au tactile.

Budget : 450 pièces, deux massues et héros ; 5/6/8 serpents et un œuf donnant deux
petits par vague. Statistiques, cadence, récompenses et catalogue conservés.
Les autres missions et l’aventure classique gardent leurs règles.

## Compatibilité

- Ancien code REFUGE-1 : trois voies actives comme avant.
- Nouveau code REFUGE-2 : tutoriel progressif ; checksum tient compte de version.
- Nouveau camp v7 et fichier familial v3 quand les nouvelles règles sont présentes.
- Camps v1–v6 et familles v1–v2 continuent à se charger. Les anciens formats sans
  champ rules restent sans ce champ ; pas de conversion implicite de gameplay.
- Une ancienne application ne doit pas relire le nouveau fichier en perdant
  les règles : nouveaux formats explicitement distincts. Mettre les appareils
  à jour avant d’échanger ces nouveaux fichiers.

## Mesures

378 tests natifs, dont 180 instantanés historiques. Tests spécifiques : codecs,
bandages et cadence médicale du camp v7, exports familiaux3, 108 configurations
croisées avec les 3 vagues pour les spawns, œufs et jonctions ; lecture sans RNG.

648 parties descriptives : 108 par stratégie et version, 18 configurations et
6 graines réutilisées, 3 par côté de seconde voie. Les deux versions reçoivent
les mêmes graines/configurations ; commandes publiques uniquement, RNG des bots
séparé. Durées actives hors préparation ; préparation finie de 4 secondes pour le
bot méthodique et 1 seconde pour les deux autres. Aucun ajustement économique.
Données complètes et empreintes : reports/tutorial-0.30/cohort-648.json.

| Politique     | Victoires ancien/nouveau | Cristal moyen ancien→nouveau | Durée active ancienne→nouvelle | Pertes moyennes anciennes→nouvelles |
| ------------- | ------------------------ | ---------------------------- | ------------------------------ | ----------------------------------- |
| Méthodique    | 108/108 et 108/108       | 100→100                      | 76,8→70,7 s                    | 0,74→0,01                           |
| Occasionnelle | 108/108 et 108/108       | 99,83→99,92                  | 78,1→71,9 s                    | 0,20→0,08                           |
| Débutante     | 108/108 et 108/108       | 92,58→93,75                  | 87,2→82,1 s                    | 0,78→0,61                           |

Minimum débutant 55 % contre 64 % avant : certains cas peuvent perdre davantage de
cristal. Les bots ne démontrent ni le plaisir des enfants, ni une amélioration
du taux de victoire (déjà 100 %), ni l’équilibre de la campagne complète.

## Interface et contrôles

Trois indicateurs avec symbole/nom et texte accessible ; preview montre les
voies actives sans masquer les autres. 60 mots DOM visibles à 1280×800, plateau
573×323 à 812×375 (86% hauteur, 71 % largeur). Les captures sont dans
`docs/captures-0.30/`. 13 contrôles de l’audit et 15 contrôles d’affichage conservés.

Le témoin navigateur ancien v5 a été corrigé : il héritait par son générateur du
nouveau rules:2 avant d’être étiqueté v5. Il utilise maintenant un vrai run
historique sans ce champ. Le parseur n’a pas été assoupli pour accepter ce
fichier incohérent. Chargements v1–v6 vérifiés réellement dans le navigateur.

## Ressources fournies

Trois maquettes, bannière brouillon et trois créations Magnific récupérées en
HD, sans nouvelle génération. Empreintes et inspection dans
`docs/resources-2026-11/`. Réservées aux lots 6/9 ; marais et coins blancs de
l’icône à traiter avant leur activation. Aucun PNG HD ajouté au runtime.

## Choix techniques et limites

- Copie isolée existante réutilisée ; main conservée jusqu’à intégration finale.
- Helpers de suivi cloud indisponibles sur disque : ledger équivalent manuel.
- Champ rules:2 réservé au refuge, formats distincts pour éviter une perte
  silencieuse des règles. Coût : tests supplémentaires de migration.
- Parité de graine pour le second côté : déterministe sans consommation du RNG ;
  choix prévisible pour qui étudie les codes, sans enjeu de compétition.
- Le témoin interne tacticalRulesEnabled:false avec nouveau tutoriel n’est pas
  exporté ; combinaison hors UI, pour éviter une reprise avec un autre mode.
- Explication tactile rendue visible dans Actions, sans ajouter de texte au
  premier écran. Coût : quelques mots dans ce panneau ouvert.
- Pas d’essai réel enfant ou Android physique revendiqué. PNG HD réservés aux
  lots suivants ; monétisation toujours ouverte, aucun service payant de jeu.

Fichiers : règles pures tutorial/ai/tactics/missions/game ; codecs départs,
checkpoints, progression et sauvegarde familiale ; vues HUD/preview/miel,
HTML/CSS, tests/fixtures et scripts de simulation ; versions, documentation et
ressources. Aucun refactor général ni dépendance de production ajouté.

## Livraison technique

Rapport : reports/verification-0.30.json. APK debug 0.30.0 / code 31 compilé,
signature vérifiée, 27 fichiers web identiques au build testé ; configuration
normale rétablie après paquet de mesure. Aucun essai physique ou publication
Google Play revendiqué. Le premier test tactile vérifiait seulement isVisible ;
un test renforcé reproduit le clip de 1 px ancien et exige maintenant une vraie
zone de texte. Classe conditionnelle corrige ce point sans modifier les autres
modes. Les codes du tutoriel sont vérifiés sur 18 configurations × 4 bornes de
graine, face aux codes historiques des mêmes configurations.
