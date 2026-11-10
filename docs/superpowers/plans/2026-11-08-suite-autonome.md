# Suite autonome après l’affichage

Plan historique des lots précédents ; le suivi actuel et les nouvelles décisions
commerciales sont dans [PLAN-ACTUEL.md](../../PLAN-ACTUEL.md).

Mandat du parent : enchaîner sans décision critique, council tous les deux lots.
Ordre retenu : 1 terminé, 4 préparation Android, 3 plateau, 2 lisibilité, puis
7 propositions chiffrées seulement. Règles à valider avec le fils et achat réservés.

## Lot 4 — préparation mesurable (0.27.1)

- Conserver le compteur existant, activer explicitement `?perf=1` en production.
- Ajouter un relevé local : FPS sur fenêtres d’une seconde, médiane/minimum des
  fenêtres complètes, durée active, plus longue image, dernier chargement et
  mémoire JS si disponible. Pauses/onglet masqué exclus. Aucun envoi distant.
- Mesure bornée à une heure de fenêtres ; le rapport précise sa méthode.
- APK debug avec option de démarrage perf ; build normal sans cette option.
- Installer JDK21/SDK36 dans un répertoire de travail, vérifier les archives,
  compiler et vérifier manifeste/version/assets/signature debug si possible.
- Tests purs des calculs et de l’opt-in ; test navigateur du build produit.
- Documenter Windows/USB, scénarios mission 6 et classique 12 ; modèle et mesures
  physiques restent nuls jusqu’au relevé réel. Ne pas déclarer le lot 4 achevé.
- Council après lots1 + préparation4 : interface enfant, moteur/mobile, QA.

## Lot 3 — plateau (0.28)

- Raccords secondaires à 60 % de leur largeur actuelle, sous les voies ; terre.
- Script Python déterministe de détourage par bordure, original conservé ;
  provenance et comparaison des alpha, aucune nouvelle génération.
- Avant/après deux tailles ; tests render/stage, build, zéro règle modifiée.

## Lot 2 — lisibilité (0.29)

- Accueil centré sur Jouer et la prochaine mission ; autres fonctions accessibles
  dans des sections repliables. Trois cartes illustrées de préparation ; code
  dans Pour les parents. Tutoiement et alliés comme vocabulaire des soldats.
- HUD/canvas conservés ; détails du camp repliables, aucun outil tactique supprimé
  ni conditionné au numéro de mission sans accord spécifique.
- Vérifier ≤60 mots effectivement visibles avant vague 1, navigation clavier et
  tactile, anciennes sauvegardes, codes, taille du plateau et pause unique.
- Council après 3 +2 : lisibilité, fidélité au concept, QA/progression.

## Livraison et réserves

Version publiée à l’adresse existante seulement après vérification, ZIP source
avec bilan fait/restant. Pas de facturation, Play Console, nouvelles images
payantes, valeur de combat ou profilage. Les 3 images attendues ne bloquent pas
ces lots. Éventuels blocages indépendants n’arrêtent pas les autres lots.

## État de livraison

- Lot 1 réalisé :87a77b6, sept commits d’affichage.
- Lot 4 préparé :d5df0a4, APK debug compilé ; validation physique en attente.
- Conseil 1+4 consigné, réserves techniques corrigées.
- Lot 3 réalisé :dfa8463, captures et reproduction du détourage conservées.
- Lot 2 interface réalisée en 0.29 ; disponibilité progressive des pouvoirs réservée.
- Conseil 3+2 consigné, reprise et focus protégés.
- Proposition chiffrée du lot 7 prête dans PROPOSITION-LOT-7.md ; aucun code de règles.

Arrêt au prochain choix critique réservé au parent et au fils. Les preuves
de publication et les empreintes du ZIP sont conservées avec les livrables
de cette session, après le commit de source.
