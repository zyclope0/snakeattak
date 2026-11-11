# Préparation Google Play — lots 8 et 9

Le parent valide le jeu gratuit, les pubs rares entre missions, l'achat de
suppression des pubs et les cosmétiques sans avantage au combat. Cadence validée :
au plus une pub par dix minutes après deux missions terminées, jamais en vague.
Cette décision remplace la proposition de déblocage des missions de l'audit.

## Livré dans cette étape

- Contrat commercial et architecture de reçus indépendants du gameplay ; tarifs,
  produits, espace parents, SDK et services réels restent à définir/intégrer.
- Fiches FR/EN/DE/IT en brouillon, toutes explicites sur le jeu actuellement en français.
- Confidentialité de l'APK actuel séparée de celle de la future version avec SDK.
- Sources Google officielles datées ; compte, test fermé, IARC, données et achats
  préparés sans inventer de validation Play, de PEGI ou de collecte nulle pour les pubs.
- Sept images : trois combats téléphone 1920×1080, une préparation téléphone,
  deux vues tablette 2560×1600, bannière 1024×500. Camp initial légal et commandes
  publiques ; aucun résultat privé de combat modifié. JPEG RGB 8 bits, empreintes.
- Dossier consultable hors ligne dans publication/index.html et contrôle CLI
  draft/strict. Zéro erreur technique sur les fichiers produits, quinze actions
  commerciales/humaines restent à compléter. Le contrôle strict sort 2 attendu.

L'icône fournie est conservée et présentée comme référence 2048×2048. Ses coins
blancs restent à corriger avant export 512×512 et validation. Crue/marais HD
restent au lot 6. Aucune génération payante, création de compte, paiement, invitation
ou publication Play effectué.

## Recette et conseil

391 tests natifs passent, ainsi que types, format, build et budgets. Scénario
navigateur du jeu vert. Dossier contrôlé à 1280×800 et 390×844 : huit images
chargées, aucun débordement, erreur JS ou appel distant. Les 27 fichiers du runtime
restent identiques à la 0.30.1 publiée. Le jeu, ses règles et sauvegardes ne changent pas.

Une revue indépendante couvre architecture, enfants 5–7, joueurs 8–12, QA Android
et parent/store. Deux défauts importants : champs de dimensions non échappés dans
le HTML, et erreurs techniques absentes du dossier. Un troisième défaut signalé
mineur (manifestes mal formés laissant un ancien rapport) est reclassé important
car il pouvait masquer l'état réel de préparation.

Corrections couvertes RED→GREEN : rendu pur avec dimensions validées et tous les
textes échappés ; erreurs, réserves et état visibles ; entrées recalculées à chaque
génération plutôt qu'un ancien rapport ; échecs JSON remplacent le rapport avec
un résultat explicitement bloqué. Cas d'injection aussi vérifié dans Chromium.
La suite entière est verte après cette passe, sans seconde revue.

Les essais physiques, la fréquence réelle des pubs, le traitement enfant du SDK,
les achats/restaurations/remboursements, traductions natives, conformité juridique
et acceptation par Play restent des preuves à obtenir. Les documents n'en tiennent
pas lieu. Aucun mineur séparé restant après correction du troisième constat.

## Choix pris dans le mandat autonome

- Préparer contrat et recette avant SDK, puisque les comptes n'existent pas.
  Coût : intégration réelle reportée au paramétrage des services, aucune pub/achat livré.
- Garder la version jouable0.30.1 pour cette livraison d'outils et documents.
  Coût : pas de nouvel APK ni de republication identique du site.
- Réutiliser la copie isolée et un ledger manuel, helpers cloud absents.
  Coût : suivi manuel et ancien nom de dossier de travail.
- Proposer dix minutes actives de grâce, deux victoires entre pubs, pas de pub en
  échec/réessai/classique. Coût : moins d'impressions que le seul plafond autorisé.
- Utiliser des captures de navigateur pour préparer les images.
  Coût : comparaison appareil réel encore nécessaire avant dépôt.
- Reclasser le manifeste mal formé avec les erreurs masquées comme important.
  Coût : petit module de lecture/validation partagé à maintenir ; il reste hors du jeu.

## Prochaine action du parent

Créer les comptes Play Console et publicité avec son identité réelle, puis choisir
l'identité/package, les tarifs et produits. Les instructions et l'invitation de
test non envoyée sont dans publication/PLAY-CONSOLE.md. L'intégration commencera
en mode de test, avec services et conditions enfant vérifiés, avant tout trafic réel.
