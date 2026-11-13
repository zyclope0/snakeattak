# Bilan 0.37.0 — Plateau net et marche des figurines, Android build55

Livraison du 13 novembre2026, version affichée **0.37.0**, Android **55**. Site familial : version Sites **30 publiée**.
Source figée des paquets : `07290c73ea6b4a5dad78b83585801607d922ab1f`, issue de main `4e27314` (PR30 de Claude).

## Fait

- Changements de Claude : plateau dessiné à la résolution de l’écran, jusqu’à 2200px de large ; figurines préparées à leur taille d’écran ; liseré allié/ennemi affiné ; marche et ondulation suivant la distance parcourue ; poses d’attaque prioritaires ; peau du combattant à massue assortie aux autres.
- Garde-fous de rendu conservés : mode Effets légers, réduction adaptative si nécessaire, cache du terrain limité aux capacités déclarées de la carte graphique. [Architecture](../ARCHITECTURE.md), [provenance des images](../../public/assets/illustrated/PROVENANCE-RESTYLE-2026-11.md).
- Codex ajoute le code Android, le suivi et remet deux anciennes recettes de rendu en accord avec les commandes et le chargement actuels, sans modifier l’application : aucune règle, valeur de caprice, annonce du fils, sauvegarde ou ancien code de départ changé depuis le build54. Aucune génération ou dépense supplémentaire par Codex.
- AAB release signé avec la clé d’envoi Play d’origine ; APK debug avec le certificat familial. Même package `com.conqueteserpents.famille`, code **55** supérieur aux précédents.

## Vérifié

- `npm run verify` : **584 tests**, aucun échec ; format, types, build et budgets verts. [CI du main source](https://github.com/zyclope0/snakeattak/actions/runs/43354283588) verte. Navigateur, audit **13/13**, menus **758**, présentation **14 scènes**, rendu et réglages de rendu verts. Les recettes anciennes attendaient des commandes masquées et un badge de médecin plein ; elles suivent maintenant l’interface réelle et attendent des ressources effectivement créées.
- Contrôle supplémentaire du vrai build à DPR1/2/3 et avec WebGL indisponible : **4 parcours**, 16 tailles/orientations, achats par les commandes visibles avant/après redimensionnement, aucune erreur JavaScript.
- Vraie victoire jouée à 780×360 EN avec marges simulées : nouvelles poses reçues, trois boutons de résultat visibles sans défiler, zéro erreur JavaScript, aucune injection de jeu ou d’horloge.
- AAB contrôlé par jarsigner et bundletool, non débogable ; **73 fichiers web** dont30MP3 identiques au build et à l’APK. Paysage, minSdk24 / targetSdk36, aucun serveur ou permission INTERNET/BILLING/AD_ID ajouté.
- Site public contrôlé sur quatre formats (1280×800 FR, 812×375 EN, 780×360 et915×412 FR avec marges simulées sur les deux derniers). Ses **73 fichiers** sont identiques aux paquets ; réglages audio et lecture continue vérifiés en ligne, zéro erreur média ou JavaScript.
- Deux démarrages du contenu du vrai APK hors ligne FR/EN et décodage des30MP3 verts.

Preuves hors Git : `artifacts/livraison-build55/` et `/workspace/serpents-build55-20261113/`. [Bilan précédent, build54](../archive/BILAN-0.37.0-build54.md).

## Livraison et limites

`conquete-serpents-v0.37.0-build55-play.aab` est prêt pour une nouvelle version du **même canal de test interne Play** ; aucun envoi Console par Codex. Mettre à jour une installation Play via Play : l’APK debug a une autre signature.
Aucun essai physique S24, mesure FPS/mémoire Android, écoute humaine ou test avec les enfants par Codex. DPR, rotation et absence de WebGL sont simulés en Chromium ; ils ne prouvent pas la fluidité du téléphone. Équilibrage et habillage des accessoires restent hors de cette livraison.
