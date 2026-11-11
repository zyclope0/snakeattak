# Interface de jeu — 0.15

Le parent demande une interface moderne, agréable pour les enfants, challengée
par les bonnes pratiques des tower defense, et un nouvel audit du moteur. Le
boss renforcé et ses protections sont des idées pour plus tard.

## Direction retenue

Le plateau est l'élément principal ; les portraits des alliés forment une réserve
facile à parcourir. Ressources et lancement sont fixes dans la hiérarchie ; les
informations détaillées se consultent à la demande. Conserver les miniatures,
terrains, règles et outils de tactique existants.

Une simple recoloration laisserait le long catalogue et les panneaux trop hauts.
Une interface entièrement superposée au terrain masquerait les unités sur les
petits écrans. Choix de conception autonome : barre compacte + plateau ouvert +
réserve latérale en grille ; réserve en dessous sur téléphone, plateau maintenu
visible pendant le choix. Pas de nouvelle dépendance applicative.

Palette : forêt #173e37, pin #24574c, jade #0c7468, ivoire #f7f4e7,
miel #f1bd57, alerte #b5423d. Fredoka pour les titres de jeu et Nunito Sans pour
les commandes, auto-hébergées avec leurs licences OFL. Les portraits apportent
la personnalité ; pas de texture derrière les textes, fausses pages ou numéros
de chapitre décoratifs. Alignement à gauche, nombres tabulaires, 44 px minimum
pour les actions tactiles. Une seule couleur d'action principale.

## Sources effectivement consultées

- Guide officiel frontend-design, récupéré car absent des skills installés :
  https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md
- Captures officielles diffusées par Ninja Kiwi :
  https://store.steampowered.com/app/960090/Bloons_TD_6/
- Captures officielles diffusées par Ironhide :
  https://store.steampowered.com/app/2849080/Kingdom_Rush_5_Alliance_TD/
- Accessibilité de jeu, tailles et espacement des contrôles :
  https://gameaccessibilityguidelines.com/ensure-interactive-elements-virtual-controls-are-large-and-well-spaced-particularly-on-small-or-touch-screens/
- https://developer.apple.com/design/human-interface-guidelines/designing-for-games

Observations personnelles des captures : ressources regroupées, grande priorité
au terrain, icônes de recrutement larges, action de vague distincte des réglages,
détails rangés dans une fiche. Ces principes sont adaptés à notre jeu, sans
copier les images ou interfaces des références.

## Plan et responsabilités

- [x] Audit moteur indépendant : entrées runtime, horloge, navigation, camps et
      cache ; reproduire puis corriger les vrais défauts avec tests rouge/vert. Pas
      de serveur ajouté ; conserver jeu hors réseau et format de camp v2.
- [x] Interface : `index.html`, `src/style.css`, `src/ui/controls.ts`, nouveaux
      modules `ui/dialogs.ts`, `ui/display.ts`, `ui/hud.ts`. Conserver les identifiants
      existants ; rendre grille, sélection, pause et disponibilité lisibles.
- [x] Confirmation d'une nouvelle partie quand elle effacerait une progression,
      restauration correcte de la pause des dialogues, mode agrandi réversible.
- [x] Tests navigateur ciblés d'abord rouges, puis verts : sélection/annulation,
      pause/aide/guide, redémarrage annulé/confirmé, grille et cibles tactiles,
      agrandissement, portrait et paysage tablette, téléphone, zoom200%.
- [x] Inspection de captures réelles sur ces formats ; contrôler qu'un enfant
      peut voir simultanément le plateau et les renforts en paysage.
- [x] Tests natifs, types, format, build, contrôles navigateur web et portable,
      présentation, rendu +restauration GPU ; comparaison déterministe du moteur
      pour les entrées valides, sans ajustement des statistiques ni des vagues.
- [x] Relecture indépendante finale.
- [x] Livraison de ZIP jouable/sources/aperçu
      par liens HTTPS retéléchargés et vérifiés.

Snapshot : `/workspace/conquete-serpents-baseline-0.14`. L'utilisateur poursuit
son autorisation de travail autonome ; pas de passage d'approbation ajouté.

## Choix vérifiés pendant l'implémentation

La grille garde de grands portraits et un prix distinct. Les cartes futures et
les unités trop chères indiquent la cause de leur indisponibilité. Le miel et
la réparation restent sous la réserve ; les textes détaillés passent dans des
fiches ou un panneau repliable. La vue agrandie donne de l'espace au plateau
sans dépendre de l'autorisation de plein écran du navigateur.

Le plateau reste visible lorsque le catalogue défile sur téléphone. En paysage
très bas, la réserve revient à droite et Phaser ajuste le terrain en conservant
son ratio : aucune partie de la carte n'est tronquée. Les commandes tactiles
restent d'au moins 44×44 pixels CSS, avec noms accessibles et état actif.

Un test tactile a reproduit un problème de coordonnées après déplacement du
canvas par son parent collant : Phaser utilisait encore ses anciennes bornes.
`render/inputBounds.ts` actualise ces bornes en capture des événements de souris
et de toucher, avant les écouteurs Phaser, ainsi qu'au défilement. Les écouteurs
sont retirés à la fermeture/destruction de la scène. Aucun calcul de coordonnées
ou règle de jeu n'est dupliqué dans le HTML.

`ui/hud.ts` crée les jauges de voies et les points de progression une seule fois.
Les valeurs sont actualisées dans les mêmes nœuds, sans reconstruire ces arbres
à chaque rafraîchissement. Les dialogues conservent la pause précédente, prennent
en compte un passage en arrière-plan et ne réappliquent pas la pause d'une ancienne
partie à une nouvelle instance. Espace garde son action native dans les boutons,
liens, sélecteurs et panneaux de détail. La confirmation de redémarrage protège
le camp ; l'annulation et Échap conservent la progression et rendent le focus.

Fredoka et Nunito Sans ajoutent 60 808 octets de WOFF2, auto-hébergés, sans requête
vers Google ni autre tiers pendant le jeu. Les licences OFL sont copiées dans
les deux distributions. Aucun nouvel abonnement, achat de stock ou crédit de
génération graphique pour cette passe.

L'audit moteur, ses corrections et les limites des camps artificiellement très
denses sont détaillés dans `AUDIT-MOTEUR-0.15.md`. La relecture indépendante ne
relève aucun problème critique/important. Son point mineur sur la couverture du
focus a été suivi par des contrôles Tab, Maj+Tab et restitution du focus dans le
vrai navigateur.

## Validation finale

153 tests natifs, TypeScript, format et build passent. Les tests navigateur
historiques passent sur le build web et le fichier portable, notamment l'achat
tactile réel, les camps, les miels et le redémarrage. Treize scènes de présentation
passent sans erreur JavaScript. La comparaison du moteur avec le snapshot 0.14
produit 119 instantanés JSON identiques sur neuf scénarios et les essais de
session, empreinte `25da4f1b6ff6c4d9f9c30a92d81630da263718da01b752a56a2ae9e39dd3a7d8`.
Les dix modules de statistiques, règles, vagues, cartes, routes et images
comparés restent identiques octet pour octet.

`test:interface` contrôle 1440×900,1024×768,1024×600,820×1180,390×844,
320×740 et 844×390 : débordement horizontal, cibles de 44 px, recrutement après
défilement, clavier et focus, annulation/confirmation, pause et agrandissement.
Un viewport de 720×450 vérifie aussi le reflow équivalent à 200 % de 1440×900 ; ce
test ne prétend pas piloter le zoom natif ou le lecteur d'écran du système.
Les requêtes réseau à des tiers restent nulles dans ce parcours.

Rendu Chromium cloud isolé, 21 alliés avec contours : médiane de 33,4 ms,
95e percentile à 50 ms, clic en 528 ms. La restauration WebGL est réellement provoquée ;
les échantillons du terrain, du fort et des antres sont identiques ensuite.
Ces mesures ne remplacent pas un essai sur appareil physique ou Safari/iOS.
Aucun nouvel équilibre parfait n'est revendiqué : les bots à distance avaient
encore un avantage en 0.14 et cette passe ne change pas leurs statistiques.

Livraison HTTPS vérifiée : les trois fichiers ont été retéléchargés sans authentification et comparés aux originaux. Manifestes et liens conservés dans /workspace/conquete-serpents-interface-0.15-{manifest,liens}.json.
