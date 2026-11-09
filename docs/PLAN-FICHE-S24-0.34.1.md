# Fiche compacte S24 — conception et plan0.34.1

9 novembre2026. Le parent confirme sur son appareil : la fiche défile, mais
prend trop de place. Les captures montrent le portrait100px, le titre, le
sélecteur et sa description empilés avant les statistiques. Ce n’est pas une
panne de défilement. Les autres captures sont des points de contrôle ; aucun
changement des règles ou des choix de reprise n’est demandé.

Choix réversible : fiche compacte en paysage bas, portrait48px et nom sur un
en-tête commun, choix/description à gauche et statistiques à droite. Fermeture
48px toujours accessible, corps défilant indépendant si la taille ou la police
l’exige. Fiches ordinateur et portrait conservent leur présentation.
Alternative écartée : réduire tous les textes/cibles ou cacher des statistiques.
Coût si ce choix plaît moins : ajustement local CSS/structure, aucune migration.

- [x] Reproduire la fiche actuelle avec marges système et mesurer hauteur/statistiques visibles.
- [x] Recette rouge sur812×375 et780×360 : fiche compacte, données essentielles visibles, contrôles48px et contenus longs accessibles.
- [x] Modifier seulement structure de la fiche et CSS dédié, version0.34.1/code43.
- [x] Vérifier build/verify, navigateur, recette dédiée et six formats tactiles ; pause/Échap conservés.
- [x] Conseil après le lot : architecture, mobile, accessibilité et cibles6/9/12ans simulées.
- [x] APK normal inspecté, site et GitHub synchronisés ; bilan avec limites physiques.

Aucune règle, donnée d’unité, sauvegarde, RNG, sélection/reprise, image ou SDK
modifié. Les barres système existantes gardent leurs marges, sans double inset.

## Exécution et conseil

Base65c4581 ; implémentation35f3b2d. Reproduction :812×375 avec marges24/32,
fiche319px, aucune statistique complète initialement. Après : Massue259px,
Médecin282px,8statistiques visibles ; X/sélecteur48px ; mêmes dimensions à1280.
Recette16cas, vrai geste tactile568, page immobile, X fixe et Échap4formats verts.

Conseil six personas terminé. Cinq avis sans blocage ; accessibilité a identifié
un défaut clavier du nouveau corps défilant. Reproduit dans l’application réelle
(Tab saute la zone), puis corrigé par tabindex0, région nommée et focus visible.
Tab/PageDown font désormais défiler les détails sans changer l’unité choisie.
441tests/build/format/types et recette finale16cas+6contrôles verts.

Mineurs différés : indice de défilement à568, pied secondaire sur très petit
paysage, reconnaissance du portrait48px et confort des textes13px à observer.
Pas de nouvelle réduction de taille des caractères. Simulation de marges,
pas validation physique de ce nouvel APK sur S24 ; la capture du parent porte
sur0.34.0. L’accueil et le comportement des reprises restent hors de ce correctif.

Clôture : site0.34.1/Sites20 vérifié en ligne, APK code43 inspecté, mêmes identité
et certificat ; HTML/JS/CSS exacts. GitHub/PR synchronisés sans fusion dansmain.
