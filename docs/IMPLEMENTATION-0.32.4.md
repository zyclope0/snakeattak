# Étape 3 — icône Android et propositions d'identifiant

GO explicite du parent ; base be874fb, branche fix/android-icon-0324 dans le
worktree isolé existant. Version cible 0.32.4/code39. STOP avant choix du parent.

## Périmètre

- Réutiliser strictement l'image Magnific retenue, icone-source.png, originale
  conservée et contrôlée par son SHA256. Aucun appel de génération ou API payante.
- Export local de ressources Android : premier plan des personnages existants,
  fond forestier uni, transparence des coins, cadrage adapté aux masques ; cinq
  densités legacy/adaptatives. Inspection visuelle des masques courants.
- Conserver appId, namespace, activité et certificat actuels. Proposer trois
  identifiants définitifs avec avantages/inconvénients, n'en appliquer aucun.
- Aucun changement de règle, rendu, UI, sauvegarde, code de départ ni SDK.
  Aucun renommage, publication Play ou mise en œuvre de monétisation.

## Vérifications et journal

- Baseline : 425 tests natifs verts ; icône actuelle Capacitor, fond #FFFFFF.
- Source vue : 2048×2048 RGB, coins blancs opaques ; les personnages sont déjà
  présents, aucune nouvelle illustration à produire. L'export enlève le fond
  photographique pour satisfaire le fond uni sans redessiner les personnages.
- Contrôler les ressources graphiques et leur empaquetage plutôt qu'ajouter des
  tests unitaires qui dupliqueraient les exports. Conserver les observations
  avant/après (couleur du fond, dimensions, alpha, provenance et empreintes).
- Installation d'un outil local d'export/segmentation dans un environnement
  Python isolé, sans ajouter de dépendance à l'application ou à son build web.
- APK normal signé comme le précédent ; aucun appareil ADB connecté. La preuve
  binaire et les aperçus ne seront pas présentés comme un test physique S24.

- Exports validés : 20 PNG, quatreXML, fond binaireARGB#FF214C3B ; une seconde
  exécution de l'outil reproduit les 20 PNG octet pour octet. Les personnages
  peuvent atteindre le bord inférieur des icônes legacy ; les coins ne sont
  pas une bordure blanche, et les couches adaptatives sont transparentes aux coins.
- Revue indépendante sans finding : aperçus cercle/carré arrondi/48dp, source,
  références, identifiants et absence de changement de logique contrôlés.
- 425/425, build/types/budgets et navigateur verts. APKnormal39 compilé, même
  certificat, 27 fichiers web identiques ; vingtPNG réellement décodés de l'APK
  comparés aux sorties, quatreXML compilés parsés. Chemin cap sync temporaire
  restauré au chemin relatif portable d'origine avant livraison.
- Trois propositions documentées ; conserver l'identifiant actuel est recommandé,
  mais aucune option nouvelle n'est appliquée. Pas de réservation Play prétendue.
- STOP pour choix du parent et confirmation visuelle du lanceur sur S24. Étape4
  non engagée ; aucune publication web/Play dans cette étape Android.
