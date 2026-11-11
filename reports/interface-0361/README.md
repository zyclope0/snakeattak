# Preuves de livraison 0.36.1

Candidate privée, sans fusion ni publication. Source de l’APK final : `4f3cabe` ;
version 0.36.1 / Android 47. Les empreintes et chemins locaux complets sont dans
[delivery.json](delivery.json), les commandes et comptes dans [commands.json](commands.json).

Les 17 commandes complètes distinctes passent sur la candidate avant le dernier
correctif M1. Il y a 18 exécutions dans cette vérification : l’échec
initial du témoin familial v2 est conservé, puis la correction limitée à la
fixture passe la recette complète. Les anciennes données restent comparées
exactement, avec version 4 et album par défaut explicites ; imports v1/v2/v3,
annulation, fichier invalide et stockage refusé restent contrôlés.

- `verify` : 506/506 tests natifs, format, types, build et budgets.
- Navigateur général ; interface 0.36.1 : 196/196, 117 captures ; caprices :
  281/281, 39 captures et une victoire réellement jouée par le moteur.
- Langues : 927 phrases inventoriées, 997 entrées anglaises, zéro manque ou
  paramètre ajouté ; 24 liaisons et 392 contrôles navigateur, 61 captures.
- Enfant/mobile : six formats, 14 contrôles ; missions et régressions ; hors
  ligne : dix contrôles, formats 1–7 ; interruptions : onze contrôles.
- Défilement : cinq cas/six contrôles ; dangers : cinq écrans/onze contrôles ;
  départs : douze contrôles et codec de 108 configurations ; famille complète.
- Présentation : 14 scénarios ; clarté tactique : trois tailles ; audit : 13/13.
- Après ces recettes : reconstruction portable, quatre contextes froids FR/EN,
  normal embarqué hors ligne et `file://`, polices prêtes et accueil→plateau.

L’APK normal conserve appID et certificat. Inspection compilée : code 47,
version 0.36.1, labels FR/EN, `sensorLandscape`, absence de permissions
INTERNET/BILLING/AD_ID et de configuration serveur/start-path. Les 34 fichiers
de `dist/` correspondent exactement aux assets embarqués ; manifeste par
fichier dans l’archive. La synchronisation a restauré immédiatement les réglages
Gradle, puis la compilation a utilisé le mode hors ligne.

Les huit sources gelées sont identiques. Les 6 600 fichiers historiques
surveillés sont identiques après les recettes et l’APK, dont
`reports/audit-2026-11-after-lot2.json`. Les sorties récentes ont été copiées
avant restauration dans le dossier de leur commande.

Documentation : 761 espaces ajoutés par vocabulaire borné sur 472 lignes de
84 documents historiques, plus un espace séparant deux phrases accolées.
Diff relu ; code, citations, URLs, chemins et identifiants protégés. Les 17
originaux d’audit, les anciennes ancres de titres et les rangées de noms/annonces
Caprices sont inchangés. Le nouveau titre/encart du plan actuel est une mise à
jour volontaire de livraison. Les ajustements d’alignement des tables par
Prettier ne changent pas leur contenu.

La mesure Git au commit source avant APK est de 670 337 761 octets / 6 642
fichiers, contre 670 253 713 / 6 631 à `9287e60`. Le
[plan d’hygiène](../../docs/archive/HYGIENE-DEPOT-0361.md) reste une proposition ; sa
politique conservatrice exclut l’aperçu artistique canonique et retient
479 717 142 octets / 442 fichiers potentiels à examiner, sans suppression.

Les preuves volumineuses, scripts de livraison, rapports JSON, captures,
rouges/verts des deux lots et données des 1 080 parties appariées restent hors
Git dans `artifacts/interface-0361/`. L’archive externe locale
`/workspace/conquete-serpents-v0.36.1-preuves.tar.gz` accompagne la livraison.
Elle est vérifiée par lecture complète et SHA-256 de chaque membre indexé ;
son empreinte est dans `delivery.json`. Ce chemin local n’est pas une URL GitHub.
Le manifeste d’archive exclut seulement sa propre empreinte pour éviter une
référence circulaire. Aucune ancienne preuve massive n’a été dupliquée dans Git.

Les [revues du lot 1](task-1-review.md), [du lot 2](task-2-review.md) et
[du lot 3](task-3-review.md) sont approuvées. La [revue finale fraîche](final-review.md)
ne relève aucun critique ou important. Son seul mineur, M1, est résolu :
[relecture ciblée approuvée](final-fix-review.md). Le conseil de six perspectives
simulées et les [arbitrages](coordination.md) sont terminés.
Les preuves automatisées distinguent les fixtures terminales et les données
familiales contrôlées des parties jouées. Aucun essai physique S24, TalkBack,
clavier Android ou enfant n’est revendiqué. L’équilibrage n’a pas changé ; les
cinq propositions et leur risque de compatibilité sont dans le
[bilan](../../docs/archive/BILAN-0.36.1.md). **STOP**, sans fusion ni publication.

## Dernier correctif et APK final

Le champ du carnet utilise maintenant son étiquette visible comme nom accessible
natif, FR/EN. Régression réelle : rouge 68/80 puis vert 80/80, dont 12 cas de nom
exact sur six formats × deux langues. Après le correctif `4f3cabe` : verify
506/506, navigateur général, quatre contextes froids normal/portable et nouvel
APK inspecté ; 34 fichiers web identiques. Seuls deux fichiers source/test
changent ; aucun dictionnaire, moteur, format ou paramètre modifié.

L’APK final fait 15 156 123 octets ; son SHA-256 et celui du complément sont
dans `delivery.json`. L’ancien APK source `72cc788` reste sous
`/workspace/conquete-serpents-v0.36.1-before-final-review-debug.apk`. L’archive
complète initiale de 313 357 893 octets conserve ses preuves avant M1, sans
aucun remplacement. Le complément final
`/workspace/conquete-serpents-v0.36.1-final-addendum.tar.gz` rassemble les preuves
du correctif, les revues et contrôles du coordinateur : 201 fichiers indexés,
202 membres réguliers, 27 010 446 octets, tous les SHA relus et vérifiés.
Le script de scellement est inclus ; le manifeste exclut sa propre empreinte.
Aucune URL GitHub d’archive n’est inventée et aucune archive n’est téléversée.
