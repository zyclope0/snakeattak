# Interface Android — correctif 0.30.1

Retour réel du parent : Samsung Galaxy S24 Ultra SM-S928B/DS, One UI 9.0,
Android 17. Le paysage est voulu. La barre de jeu chevauche l'interface système ;
le tiroir des alliés masque trop le terrain. Les enfants valident le gameplay.

## Diagnostic

Capacitor 8.6 fournit les marges via SystemBars, notamment les variables
`--safe-area-inset-*`. Le viewport utilise `cover` mais notre CSS ignore toutes
ces marges. Les contrôles occupent donc les zones système sur une WebView récente.
Une ancienne WebView peut déjà recevoir un padding natif : ne pas le doubler.
Le tiroir est actuellement fixe, large de 340 px, avec fond sombre devant le
plateau. Il ne met pas le combat en pause : aucun changement de ce comportement.

## Choix de conception

Deux options : un bandeau d'alliés en bas (rapide, mais coûte une voie entière en
hauteur) ou un catalogue latéral compact (choisi par le développeur dans le mandat
autonome : les trois voies restent visibles). Le grand tiroir superposé est écarté.

- Respecter sur chaque côté le maximum des marges CSS natives et Capacitor ;
  pas de valeurs codées pour Samsung, ni de plugin supplémentaire.
- Catalogue temporaire de 232 px maximum, plafonné à 32 % de la largeur utile,
  dans la grille à côté du plateau. Aucun rideau sombre ni interception de la carte.
- Priorité visuelle au catalogue : portrait, nom, prix ; fiches et outils restent
  accessibles. Choisir un allié ferme le panneau, sans achat avant placement.
- Boutons tactiles de 48 px, fermeture et Échap ; pas de piège de tabulation dans
  ce panneau devenu non modal. Conserver pause explicite, prix, règles et sauvegardes.
- Fenêtres, récompenses et accueil respectent aussi les marges. Recalcul à la
  rotation, au retour d'arrière-plan et au changement des marges par Capacitor.

Coût du choix : le plateau peut rétrécir temporairement sur les écrans étroits ;
il revient à sa taille initiale à la fermeture. La hauteur minimale de 85 % est
évaluée sur la surface utile hors barres système, tiroir fermé.

## Références consultées le 8 novembre 2026

- Android : https://developer.android.com/develop/ui/views/layout/edge-to-edge
  Marges des barres, découpes et gestes, commandes tactiles hors zones système.
- Capacitor 8.6 installé : `plugin/SystemBars.java`, `declarations.d.ts`.
  Injection en CSS et padding natif sur anciennes WebViews ; pas de Java maison.
- Bloons TD 6 : https://store.steampowered.com/app/960090/Bloons_TD_6/
  Capture de gameplay officielle examinée : catalogue latéral à portraits et prix,
  terrain séparé. Référence d'organisation, pas une mesure sur téléphone réel.

## Vérification attendue

Navigateur : zéro marge et marges simulées, barres en haut/bas/gauche/droite,
changements à chaud, dialogue de mission, pause unique, carte sans recouvrement,
sélection/placement, absence de pause implicite, rotations et bureau inchangé.
APK compilé, signature et configuration vérifiées. Seul le téléphone du parent
permettra de confirmer la résolution réelle sous Android 17/One UI 9.0.
