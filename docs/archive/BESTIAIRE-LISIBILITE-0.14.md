# Bestiaire et lisibilité — 0.14

## Règles issues de la famille

Les mutants, dinosaures et le bébé dragon sont des alliés. Quatre nouvelles espèces
(vélociraptor, tricératops, stégosaure, tyrannosaure) et deux mutants originaux
(roc, élastique) rejoignent les quinze unités/défenses conservées. Le catalogue
filtre par famille sans modifier les déblocages. Le ninja passe de 165 à 225 en vitesse.

Le serpent à sonnette apparaît à partir de la vague 4, un par vague. Il fait
hésiter pendant 0,8 seconde les alliés mobiles à moins de 112 unités. Recharge de
5 secondes ; immunité individuelle de 4 secondes dès le début de l'effet, même
contre plusieurs sonnettes. Pas de dégâts ni de tir ami. Les murs sont insensibles.
L'hésitation suspend déplacements, frappes et soins ; les armures et la protection
passive du bouclier restent actives. L'effet fonctionne aussi au débouché du pont,
sans condition de territoire au-delà de sa portée.
Les choix de durée/rayon/fréquence sont des réglages de cette version, pas des
chiffres imposés par l'enfant. Le premier essai avec deux sonnettes tardives
faisait perdre une campagne auparavant gagnante ; l'apparition a été limitée
plutôt que de masquer cet échec ou de retirer la vitesse demandée au ninja.

Le cobra royal (vague 8) déploie sa collerette et retire exactement **2 PV** à
celui qui le tue. Le mamba noir (vague 10) retire exactement **3 PV** à son tueur.
Ce sont des réactions uniques au coup fatal, sans réduction d'armure. Les coups
de zone et la seconde frappe des deux têtes conservent l'auteur réel. Un serpent
qui atteint le cristal ne réagit pas. Un attaquant fragile peut mourir de la
réaction : le serpent reste tué et sa récompense est attribuée normalement.

Les cracheurs infligent un seul impact par tir, sans poison périodique. Le Roi à
trois têtes reste le boss de la vague 12, avec ses œufs et ses statistiques
précédentes. Il est distinct du cobra royal ordinaire et n'hérite pas de sa réaction.

## Lisibilité

Recherches dans les documents des développeurs : [Riot, Clarity in League](https://www.leagueoflegends.com/en-us/news/dev/clarity-in-league/)
sur les silhouettes, l'orientation, la hiérarchie et le bruit visuel ; [Valve,
Illustrative Rendering in Team Fortress 2](https://cdn.steamstatic.com/apps/valve/2007/NPAR07_IllustrativeRenderingInTeamFortress2.pdf)
sur les détails simplifiés et la séparation des silhouettes par la lumière.
Ce sont des principes de lisibilité transférés à notre jeu 2D, pas une reprise
des personnages ni des méthodes de rendu 3D de ces jeux.

Comparaison directe avec un jeu de défense à voies : la [galerie officielle
Plants vs. Zombies d'EA](https://www.ea.com/es/games/plants-vs-zombies/plants-vs-zombies).
Sur la capture de jeu consultée, la pelouse présente de grandes zones unies,
les personnages ont un contour sombre et des silhouettes d'armes distinctes,
les projectiles contrastent fortement. Notre interprétation : réserver le détail
aux combattants et aux événements aide à lire les voies, même lorsque les
personnages utilisent des verts proches de ceux du sol. Nous reprenons ce
principe de séparation, avec nos propres images et notre style miniature.

La zone jouable masque davantage les petits détails de la peinture tout en
conservant la bordure illustrée. Les routes restent courbes et pavées, plus
calmes dans leur texture. Un fin double liseré crème/sombre détache les unités
sur les trois terrains, avec leur pose et orientation réelles. Les repères au
sol gardent des formes différentes pour alliés et ennemis. Une bulle « ? »
signale une vraie confusion du moteur.

Deux images d'atlas teintées par combattant produisent le liseré ; aucun filtre
GPU individuel. Le terrain reste composé une fois par carte dans un cache,
reconstruit après restauration WebGL. Le rendu ne décide d'aucune règle.

## Production des images

Trois planches Recraft V4 Pro via Magnific, référence de style existante, projet
Personal. Une reprise de la planche mutants après contrôle réel a supprimé une
bande d'ombre indésirable. **4 générations × 175 + 4 détourages × 3 + 3 formats
× 40 = 832 crédits.** Les trois exports WebP sans perte conservent la transparence,
en 1024². Le total des nouveaux exports est 1 671 362 octets.

Les dinosaures et serpents utilisent quatre cadres 512². Les deux mutants
utilisent des cadres de 512×600 dans la rangée supérieure : leur silhouette
étant plus haute que la moitié de la planche, ce découpage préserve leurs pieds.
Les deux icônes inférieures ne sont pas chargées comme personnages. Le style
des portraits prend en compte cette hauteur. Le boss montre réellement trois
têtes ; le cobra ordinaire en a une et conserve sa grande collerette.

Les PNG originaux sont conservés hors du projet ; aucune URL temporaire signée
ni clé de service n'est nécessaire dans le jeu. Voir `art-assets-0.14.json` et
`public/assets/illustrated/PROVENANCE.md` pour la traçabilité.

## Vérifications de livraison

- 141 tests natifs passent, dont réactions de mort exactes, dégâts de zone/seconde
  frappe, tueur fragile, fuite, pause, immunité et débouché de pont. Les dix variantes
  ennemies traversent les trois cartes et leurs trois voies dans les tests réels.
- Types, format et build web passent ; HTML de 13 426 octets, logique de jeu
  de 75 842 octets et Phaser séparé. Aucun grossissement du HTML web par les images.
- Essais Chromium du web et du fichier portable : catalogue, familles, fiches,
  achats, camps, reprise, tactile, aide et miels ; aucune erreur JavaScript.
- Treize scènes de présentation vérifiées, notamment trois cartes, 21 alliés,
  trois têtes, confusion réelle et synchronisation des contours à la pose.
- 200 campagnes sans limite de vie/or modifiée, 30 pas/s, cinq profils × vingt
  graines par série, limite de 240 secondes par vague : aucun dépassement.
  Série achats historiques + miel attirant : **83 victoires /100** ; série achats
  élargis aux six nouvelles recrues + alternance des miels : **70 /100**. Le profil
  spontané peut utiliser toutes les recrues dans les deux séries. Ces séries
  changent aussi la politique de miel : elles ne permettent pas d'attribuer
  l'écart aux nouveaux alliés seuls.
- Vague finale : médiane proche de 57–58 secondes, 90e percentile proche de
  77 secondes. Les armées à distance gagnent 20/20 dans les deux séries : avantage
  encore présent, aucun équilibre parfait prétendu. Ces bots ne remplacent pas
  les essais avec les enfants.

Rapports : `reports/final-0.14-lure/` et `reports/final-0.14-expanded/`. Empreinte
des modules TypeScript de simulation :
`3f862fa9ce0793eab57e2bc48abc22d7ffe15276d21c09d07dfef549b026155d`.
La relecture indépendante a fait retirer une restriction de confusion injustifiée
avant x612. Aucun autre problème critique/important identifié.

Contrôle de rendu isolé dans Chromium cloud avec 21 alliés et leurs contours :
33,3 ms médian, 50 ms au 95e percentile, clic 452 ms. Le test provoque une vraie
perte/restauration WebGL puis compare des échantillons du terrain, du fort et de
l'antre : mêmes pixels. Ces mesures de machine cloud ne garantissent pas celles
d'un iPad ou d'un téléphone ; aucun essai physique Safari/iOS n'est revendiqué.
