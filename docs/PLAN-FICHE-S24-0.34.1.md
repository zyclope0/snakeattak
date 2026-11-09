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

- [ ] Reproduire la fiche actuelle avec marges système et mesurer hauteur/statistiques visibles.
- [ ] Recette rouge sur812×375 et780×360 : fiche compacte, données essentielles visibles, contrôles48px et contenus longs accessibles.
- [ ] Modifier seulement structure de la fiche et CSS dédié, version0.34.1/code43.
- [ ] Vérifier build/verify, navigateur, recette dédiée et six formats tactiles ; pause/Échap conservés.
- [ ] Conseil après le lot : architecture, mobile, accessibilité et cibles6/9/12ans simulées.
- [ ] APK normal inspecté, site et GitHub synchronisés ; bilan avec limites physiques.

Aucune règle, donnée d’unité, sauvegarde, RNG, sélection/reprise, image ou SDK
modifié. Les barres système existantes gardent leurs marges, sans double inset.
