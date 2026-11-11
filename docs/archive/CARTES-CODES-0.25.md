# Cartes et codes — 0.25

Le décor lisible ne se limite plus à « Les trois ponts ». L’aventure classique
et toutes les expéditions emploient les ponts horizontaux, les berges basses,
les ombres et les bâtiments cadrés. Les trois chapitres gardent des ambiances
propres : clairière verte, bosquet ambré, jardin de pierres céladon. Aucun tracé
de navigation, obstacle ou prix n’est changé. Les règles du fils sont conservées.

## Retrouver un départ

À l’accueil, saisir un code dans « Un code d’aventure ? », puis « Retrouver ».
Un aperçu précède le lancement. Un code d’expédition verrouillée ne débloque
pas la mission. Un départ classique en cours bénéficie de la confirmation
habituelle avant remplacement. Une expédition repart avec son budget et son
nouveau héros et deux combattants à massue, sans importer une armée.

Exemples valides :

- AVENTURE-1-0000-7X80-CQ : aventure classique, graine 2026.
- PONTS-1-0000-7X8R-A1 : une configuration de « Les trois ponts », graine 2026.

Le code se consulte et se copie avant de lancer une expédition et dans le
panneau de partage en partie. Si le presse-papiers est refusé, le texte reste
sélectionnable avec une indication pour le copier manuellement.

Même code signifie même type de départ, configuration et graine initiale.
Les choix de renforts, leur placement et le déroulement du combat déterminent
le résultat. Le code n’est pas une sauvegarde de bataille ni une garantie de
victoire. Les futures règles incompatibles devront changer sa version.

## Compatibilité et validation

Le codec est indépendant du navigateur. Il inclut les 108 configurations
(6 missions ×3 terrains ×3 attaques ×2 répartitions d’œufs), pas seulement une
graine qui recalculerait un autre résultat après une relance. Champs courts en
base32, version de protocole et contrôle de saisie; bornes de longueur et de
valeurs vérifiées. Minuscules et accents du nom sont acceptés, ainsi que les
confusions O/0 et I/L/1 dans les chiffres du code. Ce contrôle n’est pas un
mécanisme de sécurité : les contraintes du jeu sont toujours vérifiées.

Les camps restent en version 6 avec une métadonnée initialSeed optionnelle.
Les anciennes versions 1–6 se chargent. Une ancienne expédition retrouve sa
graine dans sa configuration; un ancien camp classique sans graine initiale
reste jouable mais n’affiche pas de faux code. Les stocks et délais médicaux
sont conservés. Les exports LEGACY v4/v5 et le digest historique du moteur
restent inchangés : la métadonnée n’entre pas dans l’état JSON du combat.

## Présentation et architecture

TerrainLayer ne contient plus le vieux rendu à aplat rectangulaire. Un cache
par terrain/graine et un premier plan borné lisent les données du moteur.
Les titres restent dans l’interface, les trois voies ont des repères discrets.
Le numéro v0.25.0 est visible à l’accueil et en partie, injecté depuis
package.json au build (y compris l’export autonome).

Deux fonds Magnific générés et inspectés : 130 crédits. Origines et prompts
conservés dans art-assets-0.25.json et les originaux dans art-sources-0.25/.
Les images, polices et Phaser restent séparés du HTML web normal. L’export
portable reste un format distinct. Aucun service en ligne nécessaire au jeu.

Les rapports de tests et publication sont dans reports/verification-0.25.json
et reports/deployment-0.25.json. Captures des trois régions dans artifacts/stage-023/
et des codes dans artifacts/departures-025/. Le test tactile est émulé : aucun
téléphone réel ni APK/AAB compilé n’est revendiqué, et le plancher 30 FPS sur
Android reste à mesurer sur appareil.
