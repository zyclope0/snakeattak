# Correctif tactile des renforts — 0.32.1

Signalement Android S24 : dans le catalogue, le doigt ne fait pas bouger la liste.
Reproduction Chromium tactile, 812×375 : panneau extérieur327px/scrollHeight812,
shop404px/scrollHeight404. Le shop possède overflow:auto + overscroll:contain :
il intercepte le geste sans défilement possible, et interdit sa transmission.
Même balayage CDP : scrollTop extérieur0 avant,117 après suppression du piège.

- [x] Recette RED avec vrais événements tactiles natifs (pas scrollTop comme action) :
      balayages sur portraits/cartes disponibles/verrouillées, plusieurs paysages
      et marges système, aucun achat/sélection/fermeture involontaire.
- [x] Dans la media query compacte existante, supprimer le défilement interne
      de #shop et autoriser le relais. #reinforcements reste l'unique zone de
      défilement ; son confinement à la page et les commandes actuelles restent.
- [x] GREEN : aller/retour, bords du catalogue, tap de recrutement toujours
      fonctionnel ; le défilement propre du shop reste présent sur grand écran.
- [x] Version0.32.1/code36 ; build/423 tests/navigateur général et mobile,
      APK même certificat et mêmes fichiers web, revue du correctif.
- [ ] Sources privées et site synchronisés, APK familial fourni. Aucun changement
      moteur, prix, RNG, unités, sauvegardes ou SDK. Test réel S24 à confirmer.
