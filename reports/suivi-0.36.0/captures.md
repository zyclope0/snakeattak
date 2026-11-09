# Captures retenues — 0.36.0

Toutes les captures proviennent de Chromium émulé ; aucune n’est une capture
physique Android ou une séance enfant. Les31captures du parcours caprice complet
ont leurs chemins d’origine dans caprices.json ;13sont retenues dans
`docs/captures-0.36.0/` pour la revue.

| Fichier | Provenance et observation |
| --- | --- |
| production-A-win.png | Jeu réellement joué via bootstrap et commandes natives :3vagues Refuge, graine42, trio initial,73% cristal,2étoiles ; progression familiale contrôlée au départ |
| preparation-1280x800-fr.png | Préparation contrôlée FR, rangées et choix de copains |
| preparation-1366x768-en.png | Préparation contrôlée EN ; noms et annonce canoniques français, explication anglaise |
| preparation-812x375-fr.png | Préparation contrôlée FR tactile paysage |
| preparation-780x360-en.png | Préparation contrôlée EN paysage compact |
| preparation-568x320-en.png | Préparation contrôlée EN après défilement ; commandes de pied mesurées à48px et accessibles |
| album-scrolled-568x320-en.png | Carnet contrôlé après défilement maximal ; titre et fermeture sticky accessibles |
| portrait-en.png | Consigne de rotation375×812 |
| controlled-bank-568x320.png | Fixture :500pièces au total,450protégées,50dépensables, commandes grises cohérentes |
| controlled-bank-812x375.png | Même fixture tirelire en paysage812 |
| controlled-shell-canvas.png | Vraie naissance du troisième serpent carapace puis avance figée pour comparaison du rendu Canvas |
| controlled-shell-webgl.png | Même observation du rendu WebGL, silhouette agrandie/coquille et contour ennemi conservés |
| r1-advice-full-en.png | Préparation contrôlée ; plan générique visible après sélection complète Ninja+Médecin, sans conseiller un Archer interdit |

Les états de résultats forcés, réserve, verrouillage, progression/carnets et
répétition sont des fixtures explicites. La victoire native ci-dessus est le
seul match caprice terminé revendiqué par cette livraison. Les contrôles de
conseil préservent le jeu retenu et le RNG ; aucun hook produit n’est introduit.


Quatre vues de régression générale sont aussi retenues : accueil-1280x800.png,
combat-780x360.png, evenement-780x360.png et evenement-vague2-780x360.png.
L’audit interface complet conserve24résultats dans interface.json ; ses neuf
captures redondantes restent en artifacts/delivery-036-interface/ dans le
workspace, sans modifier les anciennes captures.

Une dix-huitième vue, offline-caprice-en.png, provient du nouveau contrôle
hors ligne : enveloppe et étoiles contrôlées, puis lancement réel d’un code3
par le bootstrap de production ; aucun combat terminé supplémentaire revendiqué.
