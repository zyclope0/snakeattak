# Préparation de l’encart Web — consensus appliqué

Le parent approuve le16novembre2026 : « council applique le consensus et go », après
l’aperçu local et sa proposition. Il autorise une intégration désactivée ; pas une
diffusion réelle. Le site reste en examen Google au dernier état communiqué.

## Conseil : six perspectives simulées, trois lectures indépendantes

- Architecture : calcul de rectangles pur, adaptateur DOM distinct, aucun moteur importé.
- QA/accessibilité : conservation du plateau, coordonnées Phaser rafraîchies, transitions testées.
- Sécurité/confidentialité : arrêt réel par défaut, aucune bibliothèque Google ni stockage publicitaire.
- Parent : une annonce clairement identifiée, absente sur téléphone, sans contrepartie de jeu.
- Enfant6–8ans : ne pas imiter les cartes d’alliés, ne pas couvrir les voies ou les commandes.
- Enfant9–12ans : aucune réduction du plateau, aucun défilement et aucune attente imposée.

Le conseil accepte la faible couverture volontaire de l’emplacement. Il ne constitue
ni une étude avec de vrais enfants ni une certification Google/juridique.

## Choix d’architecture

Une compilation locale dédiée `ads-preview`, sortie `dist-ads-preview/`, charge un
faux encart bilingue, sans annonce. Le build Web normal, Android et le portable
n’incluent ni ce module, ni son CSS, ni son DOM, ni réservation de place. Aucun
paramètre d’URL, stockage ou option utilisateur ne peut activer ce mode.

Le chargeur Google n’est pas écrit dans ce lot. Les attributs prévus sont documentés
et figés dans un contrat de préparation : client `ca-pub-8498417364292905`, slot
`7092707633`, traitement enfant `1`, pleine largeur automatique `false`. Ce contrat
n’autorise pas à initialiser un SDK ou à pousser une demande d’annonce.

L’alternative consistant à mettre un chargeur dormant dans le build public est
écartée : elle ouvrirait un accès tiers au DOM et au stockage avant résolution des
consentements. Un simple signal enfant ne constitue pas une isolation technique.

## Placement

Fenêtre CSS d’au moins1920px. Préférer l’espace latéral libre ; sinon utiliser le
vide sous les renforts, avec formats de maquette200×200,180×150,234×60. Marge extérieure
20px. Déplacement horizontal réversible de l’app si nécessaire, sans changer sa
largeur ou la taille du plateau. Au moins150px entre la zone créative prévue et le
plateau, le cadre de bataille, les renforts et le HUD. Sans place sûre : aucun encart.
Ces dimensions ne garantissent pas le remplissage d’un futur inventaire AdSense.

Désactiver l’aperçu et restaurer la position à l’accueil, sur pointeur grossier,
pendant un dialogue, sur document caché, en vue agrandie, en fullscreen ou pendant
un zoom visuel. Recalculer après retour, resize, orientation et changement de langue.
Les dialogues ajoutés dynamiquement doivent aussi être pris en compte.

Le calcul utilise des rectangles débarrassés du décalage déjà appliqué : pas de
dérive au fil des mesures. Regrouper les lectures/écritures par requestAnimationFrame,
observer les seules dimensions/attributs utiles, nettoyer les écouteurs à destruction.
Le faux encart n’est ni cliquable ni focusable, sans aria-live, et porte une étiquette
FR/EN explicitement locale. Aucun lien, marque fictive ou création réelle.

## Coordonnées et règles

Après déplacement ou restauration, réutiliser un invalidateur de taille/position
qui appelle getParentBounds → refresh → updateBounds, avec garde contre un parent
caché. Garder la capture inputBounds existante avant chaque interaction. L’adaptateur
ne reçoit qu’un callback de rafraîchissement, aucun Game/Session/Phaser ni profil.
Aucune règle, valeur, RNG, sauvegarde, ancien code ou version ne change.

## Vérification et diffusion

Calcul pur : fixtures des huit fenêtres de la maquette, cas limites et rectangles
invalides ; distances, absence de réduction et pas de déplacement quand exclu.
Navigateur : même page grand→petit→grand, rotation, agrandir/réduire, accueil,
dialogue dynamique, langues FR/EN, dépense et coordonnées d’un recrutement après
transitions. Zéro requête externe, erreur JS, espace vide ou vol de focus.

Web normal/Android/portable : aucun runtime d’encart, CSS ou slot expédié. Conserver
la balise Meta AdSense et ads.txt déjà autorisés sur le Web seulement. CSP et
confidentialité approuvée inchangées. Budgets actuels maintenus. verify et
test:browser avant livraison, revue indépendante puis CI. Publication éventuelle
uniquement par le workflow existant ; elle n’active pas la diffusion.

Avant un futur chargement réel : approbation Google, réglages automatiques vérifiés
pour le site, choix de traitement/consentement documenté, textes FR/EN approuvés,
contrôle des requêtes réelles et accord de diffusion. Aucun faux témoin « conforme ».
