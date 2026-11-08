# Update 2026-11 — consignes pour l'agent de code

Ce dossier découle de l'audit du 7 novembre 2026 sur la v0.26.0 (voir `AUDIT.md`).
Il découpe la suite en 9 lots. Un lot = une branche ou une suite de commits = une version.

## Règles (en plus de AGENTS.md)

- Lire `AGENTS.md`, `GAME_DESIGN.md` et `docs/ARCHITECTURE.md` avant chaque lot.
- Commencer par un état des lieux écrit et un plan ; attendre l'accord du parent avant de coder.
- Garder la séparation règles / rendu, aucun `Math.random` dans les règles, sauvegardes v1 à v6 lisibles.
- Un lot qui change une règle de jeu (lots 6 et 7) propose des valeurs et attend la validation
  du parent et de l'enfant, comme le prévoit `GAME_DESIGN.md`.
- Aucun service tiers, aucune collecte de données, aucune publicité : le jeu vise la politique
  Familles de Google Play (public 6–8 et 9–12 ans).
- Aucune génération d'image payante sans accord explicite.
- Les maquettes de `maquettes/` sont des cibles visuelles, pas des captures : adapter au code existant.

## Ordre

| Ordre               | Lot                                    | Fichier                       | Effort | Version |
| ------------------- | -------------------------------------- | ----------------------------- | ------ | ------- |
| 1                   | Affichage ordinateur et petits défauts | `lots/01-affichage.md`        | ≈ 6 h  | 0.27.0  |
| 2                   | Test sur un vrai téléphone Android     | `lots/04-android-reel.md`     | ≈ 5 h  | —       |
| 3                   | Plateau : raccords et halos            | `lots/03-plateau.md`          | ≈ 4 h  | 0.28.0  |
| 4                   | Lisible sans savoir bien lire          | `lots/02-lisibilite.md`       | ≈ 8 h  | 0.29.0  |
| 5                   | Première mission, signaux, mode Facile | `lots/07-premiere-mission.md` | ≈ 10 h | 0.30.0  |
| 6                   | Achat de déblocage et portail parental | `lots/08-deblocage.md`        | ≈ 6 h  | 0.31.0  |
| 7                   | Fiche du store et conformité           | `lots/09-store.md`            | ≈ 3 h  | —       |
| 8                   | Traduction FR, EN, DE, IT              | `lots/05-traduction.md`       | ≈ 14 h | 0.32.0  |
| 9 (après la sortie) | Nouveaux lieux et événements           | `lots/06-lieux-evenements.md` | ≈ 8 h  | 0.33.0  |

Les numéros de fichier suivent l'audit ; l'ordre ci-dessus suit la feuille de route
(test fermé Google Play de 14 jours à démarrer après le lot 9 « store »).

## Critères communs à chaque lot

- `npm run verify` vert, `npm run test:browser` vert.
- `npm run build && node scripts/audit-2026-11-browser.mjs` : aucun nouvel écart ;
  les écarts visés par le lot disparaissent (voir la section « Critères » du lot).
- Anciennes sauvegardes chargées ; codes de départ existants toujours lisibles.
- Bilan court dans `docs/BILAN-<version>.md` : fait, pas fait, mesures avant/après.

## Mesures de départ (v0.26.0, script d'audit)

| Contrôle                                              | Valeur v0.26.0                                                                  | Cible   |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- | ------- |
| Défilement après lancement d'une mission              | 422 px (1280×800), 503 (1366×768), 365 (1920×1080)                              | 0       |
| Plateau entier visible sur ordinateur                 | non aux 3 tailles                                                               | oui     |
| Mots visibles avant la 1re vague, mission 1, 1280×800 | 186 dans la fenêtre (310 sur tout l'écran de combat)                            | ≤ 60    |
| Vouvoiement visible                                   | 1 occurrence à l'écran (plus des textes dans `src/waves.ts`, `src/missions.ts`) | 0       |
| Cibles tactiles < 48 px en 812×375                    | 5 (Pause, Vitesse, Accueil, Renforts, Lancer : 36 px de haut)                   | 0       |
| Plateau en paysage téléphone                          | 88 % de la hauteur                                                              | ≥ 85 %  |
| Consigne de rotation en portrait                      | visible                                                                         | visible |
| Nouveau tirage, terrain répété                        | 0 sur 10                                                                        | 0       |
| Erreurs JavaScript                                    | 0                                                                               | 0       |
