# Correctif interface téléphone — v0.30.1

Le paysage est conservé. Les commandes prennent en compte les barres système
et la caméra ; les renforts s'affichent à côté du plateau sans recouvrir les
trois voies. Une sélection referme le catalogue, l'achat attend le placement.
Le combat continue pendant la consultation ; Pause reste une action explicite.

Le parent a testé la 0.30.0 avec les enfants sur un Galaxy S24 Ultra SM-S928B/DS,
Android 17 / One UI 9.0 déclarés. Le gameplay plaît ; le retour porte sur le HUD
et le catalogue. Ce correctif conserve toutes les règles et tous les formats
de sauvegarde de la 0.30.0.

## Cause et solution

Capacitor 8.6 fournit déjà les marges système, mais notre CSS ne les consommait
pas. Le maximum entre les valeurs `env()` du navigateur et les variables de
Capacitor évite le chevauchement et le double padding des anciennes WebViews.
La barre de commandes passe de 52 à 48 px, avec des cibles de 48 px. À 812×375,
le plateau fermé dépasse 85 % de la hauteur utile hors barres système.

Le catalogue fixe de 340 px et son fond sombre sont remplacés par une colonne
temporaire dans la grille. Le ResizeObserver existant recalcule le canvas à
l'ouverture, la fermeture, la rotation et aux changements des marges. Le guide,
les filtres, les favoris, le miel et les autres actions restent accessibles.
Le panneau non modal ne piège plus la tabulation.

## Contrôles

- 378 tests natifs, types, format, build et budgets.
- Marges simulées sur plusieurs tailles, côtés échangés à chaud, portrait,
  fenêtre de mission, reprise, catalogue sans intersection avec le canvas.
- Horloge réelle dans la fixture : combat actif pendant les renforts ; une pause
  volontaire reste conservée à l'ouverture et à la fermeture.
- Régressions navigateur : recrutement tactile, soins/sauvegardes, tutoriel,
  quinze contrôles d'affichage, diagnostic de performances optionnel.
- Échanges de sauvegardes entre le dernier portable et le web, annulation,
  fichiers invalides, stockage refusé et rechargement.
- APK debug code 32, même certificat que le précédent et 27 fichiers web
  identiques au build testé. Démarrage familial sans compteur de performances.

Preuves : reports/mobile-0.30.1.json, reports/verification-0.30.1.json,
captures dans docs/captures-0.30.1/. Les vérifications de navigateur ne sont pas
des mesures Android physiques. Le correctif doit encore être retesté sur le S24.

## Choix du développeur et coûts

- Mandat autonome appliqué aux corrections réversibles d'interface et à la
  publication. Coût : disposition à confirmer par le parent sur l'appareil.
- Copie isolée existante et ledger manuel réutilisés, helpers cloud absents.
  Coût : suivi manuel et ancien nom de dossier de travail.
- Catalogue latéral plutôt que bandeau en bas, pour garder les trois voies.
  Coût : plateau temporairement plus petit sur les téléphones étroits.
- Barre de 48 px plutôt que 52, pour conserver 85 % de hauteur utile à 812×375.
  Coût : quatre pixels de marge décorative en moins.
- APK familial sans compteur ; script diagnostic volontaire inchangé.
  Coût : utiliser ce script séparé pour mesurer les FPS.

## Fichiers

CSS et HTML, ui/reinforcementsDrawer.ts, capacitor.config.ts ; versions npm et
Android ; scripts/mobile-031-browser.mjs et tests/mobile-031-harness.ts ; documents,
captures et rapports. Aucun fichier de règles, de codec de sauvegarde ou de
catalogue économique modifié. Aucune dépendance ni génération payante ajoutée.

## Revue indépendante et correction

Revue finale externe : aucun défaut critique, un défaut important du catalogue
étroit. Les onglets perdaient leur largeur tactile à 568 px ; à 480 px,
le bouton Fermer dépassait la zone utile, et le miel débordait à 667 px.
Les nouveaux tests reproduisent ces débordements avant correction.

Le catalogue a désormais un minimum de 208 px, même si cela dépasse 32 % de la
largeur utile sous 650 px. Favoris sur deux colonnes, miels empilés et cibles de
48 px dans les outils. Tous les outils sont vérifiés ouverts, sans simple masque
CSS du débordement. Coût : plateau temporairement plus petit sur écran étroit.

Le test renforcé révèle aussi une collision des statistiques du HUD sur les
écrans les plus étroits. Sous 700 px, statistiques et commandes prennent deux
lignes (76 px). Coût : moins de hauteur de carte sur ces seuls écrans ; le seuil
85 % est conservé à 812×375, sur la surface utile hors barres système.

Les cinq regards couvrent compatibilité du moteur, enfants 5–7 ans, joueurs
8–12 ans, QA mobile et parent. Il s'agit d'une revue de conception, pas d'un essai
d'enfants. Rendu Android 17/One UI 9, ancienne WebView physique et cycle de vie
réel restent à confirmer sur téléphone ; ils ne sont pas déduits du navigateur.
Aucun autre défaut mineur séparé n'a été signalé. Pas de seconde revue : corrections
couvertes par régressions RED→GREEN et suite complète avant livraison.
