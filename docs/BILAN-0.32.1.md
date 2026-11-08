# Correctif tactile des renforts — 0.32.1

Signalement du parent sur l'APK S24 : « Ça bouge pas » lors du balayage dans le
catalogue des renforts. Reproduit dans Chromium avec de vrais événements
Input.dispatchTouchEvent, sans déplacer scrollTop pour l'action vérifiée.

## Cause et correction

En paysage compact, le panneau extérieur pouvait défiler, mais la grille #shop
conservait overflow:auto et overscroll-behavior:contain. Avec une hauteur égale
à son contenu, cette grille n'avait rien à faire défiler et bloquait le relais
du geste vers son parent. Le même balayage passait de 0 à 117 px de déplacement
après suppression de ce piège dans le diagnostic.

Deux propriétés CSS dans la media query compacte : la grille reste visible et
laisse son parent gérer le défilement. #reinforcements conserve sa hauteur
bornée et son confinement pour que la page ne bouge pas à la fin de la liste.
Le catalogue de grand écran garde son défilement propre. Aucun gestionnaire
JavaScript de glissement, changement de moteur, prix, RNG ou sauvegardes.

## Recette

Régression RED sur la 0.32.0, puis GREEN : cinq configurations paysage/marges,
balayages sur cartes disponibles et verrouillées, montée et descente, absence
de sélection/achat/fermeture involontaire, sélection préalable conservée,
sélection par tap encore fonctionnelle et grand écran1280×800.
Le programme prépare parfois un cas en remettant le panneau en haut ; tous les
contrôles de glissement utilisent ensuite de vrais gestes natifs Chromium.
Ce n'est pas un test physique du S24 ni de ses gestes système.

La nouvelle recette passe sur cinq configurations compactes et sur grand écran,
y compris après une sélection préalable d'allié. Les 423 tests, les types, le
build et les budgets passent. Les recettes générales, mobiles (six configurations et quatre catalogues
étroits), interruptions (11 scénarios) et hors ligne (formats 1 à 7 et trois
fonds embarqués) passent aussi. Portable : build et navigateur passent. APK 0.32.1/code 36 compilé hors ligne,
démarrage normal, même certificat et identifiant. Ses 27 fichiers web sont
identiques au build testé. Publication en finalisation.
Rapport : `reports/reinforcements-scroll-0.32.1.json`.

## Périmètre

Version patch 0.32.1, identifiant Android conservé et certificat debug précédent.
Conçu pour une mise à jour par-dessus l'application existante. Six missions et
règles inchangées. Le parent doit encore confirmer le confort sur son appareil.

## Relecture et choix de réalisation

Relecture indépendante du correctif : aucun point critique, important ou mineur.
Les observations réelles sur S24, la signature Android et la livraison distante
restent à vérifier par leur responsable ; la revue ne les remplace pas.

Le worktree hôte isolé est conservé. Choix d'un correctif CSS natif limité à la
vue compacte, sans gestionnaire de gestes supplémentaire. La zone extérieure
retient toujours le défilement aux bords, et la vue de grand écran conserve sa
propre grille défilante. La livraison utilise le mandat autonome existant pour
le Git privé et le même site public ; aucune publication Play.
