# Task 3 — revue indépendante spécification et qualité

**Spécification : Needs fixes. Qualité : Needs fixes.**

Périmètre relu : BASE `42e8152` → HEAD `37c2e2d`, source produit/tests
`9ca13bb55a55f7a571c6fbc027e31c466c638e3c`. Brief et cadrage validé lus ; diff
fourni relu, sans reconstruire le diff Git. Les paragraphes initiaux du rapport
Task 3 sont traités comme historique et son appendice comme livraison finale.
Cette revue ne rouvre pas les lots 1/2 déjà approuvés et ne constitue pas la
revue globale de branche. Aucun test relancé, appel distant, changement produit,
index ou branche ; seul ce rapport est écrit.

## Points solides

- Les changements runtime restent de présentation : matière CSS, notice
  portrait, légende contextuelle, budget du catalogue et disposition missions.
  Aucun fichier moteur, données ou persistance ne figure dans le diff ; les
  changements de version package/lock/Gradle sont cohérents en 0.37.0/code 49,
  sans dépendance ou identité Android changée.
- La notice réutilise le même nœud dans le dernier dialogue modal, sans
  fermeture/réouverture ni opération de pause. Les nouveaux contrôles vérifient
  réellement le top layer, le focus, le parent retrouvé et les dialogues imbriqués.
  Le budget lit `availableGold` existant et utilise les bindings de traduction ;
  les cas banque protégée et sélection sans dépense sont conservés.
- Les captures finales consultées (`after-album-safe-780x360.png`,
  `after-catalogue-safe-568x320.png`, `portrait-nested-guide.png`) concordent avec
  les descriptions : six autocollants lisibles à 780safe, commandes fixes et
  corps borné à 568safe, notice opaque réellement au-dessus des Fiches.
- Les 21 entrées de `final-qa-results.json` pointent sur la même source et sur
  des journaux présents. Lecture des sorties finales : verify 549/549, menus
  519, caprices 293/39, locale 440 sans échec/clé inconnue, audit 13/13,
  missions 16, child 6, et autres commandes terminées avec les résultats annoncés.
  Les essais antérieurs ne sont pas additionnés à ces résultats.
- Contrôle indépendant effectué sur les fichiers livrés : les trois SHA-256
  APK/HTML/ZIP et leurs tailles correspondent au reçu ; les 34 fichiers du
  `dist/` normal sont byte-identiques à ceux de l'APK ; le ZIP contient cinq
  fichiers et son contrôle d'intégrité ne signale aucune erreur. Les sorties
  signature/permissions/config confirment le certificat et l'identité annoncés.
  La documentation distingue correctement candidate locale, site 0.36.2,
  transport Chromium et absence d'essai physique.

## Findings

### Critical

Aucun.

### Important

**I1 — La migration enlève l'objectif de défilement tactile positif.**
`scripts/reinforcements-scroll-037-browser.mjs:119` (et snapshot aux lignes
39–40). Tous les contrôles affirmant qu'un glissement natif déplace réellement
le contenu ont été retirés. Les gestes sont encore émis, mais les assertions
restantes ne vérifient que l'absence de dépense/sélection/fermeture et la
navigation par pages. Le snapshot lit toujours `#reinforcements` et `#shop`,
alors que la zone défilante est maintenant `.catalog-body`. `swipeDistance`
consigne la distance demandée au doigt, pas un déplacement constaté du contenu.

Ce n'est pas devenu un objectif obsolète avec les six cartes : les mesures
finales montrent encore `bodyScroll=198/bodyClient=170` à 780×360 et
`202/90` à 568safe ; les outils ouverts dépassent davantage. Le test pourrait
donc rester vert si le corps cessait de défiler au doigt et rendait sa partie
basse inaccessible. Les contrôles de pagination fixe déplacent le scroll par
script ; ils ne couvrent pas cette régression. Cela contrevient au brief Task 3
qui exige de migrer les recettes sans perdre leurs critères tactiles.

Correction attendue : mesurer le vrai corps, choisir au moins un cas avec une
plage de scroll constatée, affirmer un déplacement réel dans les deux sens avec
les événements tactiles natifs, puis un geste à la vraie limite sans défilement
du document. Garder les protections actuelles contre les achats/clics accidentels
et les 20 alliés atteignables. Les cas où tout tient peuvent accepter zéro
déplacement, sans remplacer les cas où le défilement est nécessaire.

### Minor

**M1 — La recette historique journey reste partiellement migrée.**
`tests/journey-browser.mjs:69` attend encore huit `[data-quick-kind]`, alors
qu'aucun producteur de ces nœuds ne reste dans `src/ui` ou `index.html` ; le
sélecteur de composition actuel ne les crée plus. À `tests/journey-browser.mjs:141`,
la recette demande aussi la boîte de `#home-new` avant de naviguer vers sa page
Classique (navigation seulement ensuite), donc la mesure cible un bouton caché.
La limitation « recettes annexes non exécutées individuellement » est bien
déclarée et aucun résultat vert n'est faussement revendiqué pour celle-ci ; cela
ne rend cependant pas cette migration complète. Adapter ces attentes au dock et
au catalogue actuels, et naviguer avant la mesure tactile, en gardant les
objectifs de composition, recrutement et reprise.

## Cannot verify / limites acceptées de cette revue

- Aucun Galaxy S24/WebView physique, TalkBack, enfant ou lecteur anglophone natif
  n'a été testé ici. Les quatre cold checks FR/EN décrivent Chromium avec
  transport local et portable, pas Android physique.
- Les recettes annexes listées dans le rapport ne sont pas certifiées par les
  gates finaux ; M1 donne un cas concret encore incompatible. Les autres ne
  sont ni déclarées vertes ni toutes réexécutées par cette revue.
- Les 81 fichiers protégés inchangés et les 9 044 fichiers historiques contrôlés
  sont corroborés par les reçus de conservation et l'absence d'éditions produit
  hors périmètre dans le diff ; cette revue n'a pas recalculé tout cet inventaire.
- Le parcours natif du coordinateur reste une seule partie sans injection d'état
  ou d'horloge, utile pour le parcours UI et sans conclusion d'équilibrage.
- Le comparatif six images reste au devis partiel ; aucun prix Runway par appel
  ni génération payante n'est établi. C'est une limite explicitement conservée,
  sans blocage ajouté à la livraison UI.

La correction I1 et son reçu ciblé sont nécessaires avant approbation de ce
gate. Aucun défaut fonctionnel produit ou d'identité du paquet n'a été établi
dans le périmètre relu.
