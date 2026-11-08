# La Conquête des Serpents

Jeu de défense familial imaginé à partir du jeu d'un enfant. Prépare un détachement
pour protéger le cristal sur **trois voies interconnectées**, puis observe les
alliés combattre et se soigner de façon autonome.

**Version jouable : 0.32.0 · Langue : français · Code propriétaire.**

[Jouer sur le site familial](https://conquete-serpents-famille.zyclope.chatgpt.site/)
· [Plan actuel](docs/PLAN-ACTUEL.md)
· [Guide Android](docs/ANDROID.md)

## Le jeu

- Six missions avec nouveau détachement, budget propre et 18 configurations possibles.
- Une aventure classique de douze vagues jusqu'au roi à trois têtes et sa garde.
- Massues, archers, ninjas, soigneurs, dinosaures et bébés dragons parmi les alliés.
- Serpents spécialisés, œufs qui éclosent et choix de chemins selon les défenses.
- Soins limités par les bandages, ravitaillement à la base et miel tactique.
- Préparation illustrée et portraits des dangers avant chaque vague.
- Refuge progressif : ennemis au centre, puis sur deux voies, puis sur les trois.

Les unités agissent seules ; il n'y a pas d'ordres manuels de déplacement. Le jeu
reste une application locale : aucun serveur de gameplay ou compte de joueur requis.

## Démarrer en développement

Prérequis : **Node.js 24** (voir [.nvmrc](.nvmrc)).

```sh
npm ci
npm run dev
```

Vite affiche l'adresse locale dans le terminal. Pour compiler le site :

```sh
npm run build
npm run preview
```

Le build web est dans `dist/`, avec code et images séparés. Le servir via HTTP(S).
Pour un fichier autonome utilisable par double-clic sur ordinateur :

```sh
npm run build:portable
```

Ouvrir ensuite `dist-portable/index.html`. Les distributions sont générées
localement ; le prototype historique reste conservé dans `public/prototype-v4.html`.

## Vérifier les changements

```sh
npm run verify
npx playwright install chromium
npm run test:browser
```

`verify` contrôle format, tests, types, compilation et budgets de taille. Le scénario
navigateur démarre sa prévisualisation locale. Des vérifications supplémentaires
existent pour le rendu, le tutoriel, l'interface mobile, les sauvegardes et l'équilibrage :
voir les scripts de [package.json](package.json).

Le workflow [.github/workflows/check.yml](.github/workflows/check.yml) reprend les
principaux contrôles. La présence du workflow ne prouve pas qu'un run distant est vert.

## Android

L'enveloppe Capacitor embarque le build web. Prérequis de compilation : JDK 21 et
SDK Android 36 configurés. Le jeu est prévu en paysage.

```sh
npm run android:sync
npm run android:open
```

Le script `npm run android:apk:debug` produit un APK **de diagnostic**, avec compteur
local de performances. Le protocole et les différences avec l'APK familial sont
détaillés dans [docs/ANDROID.md](docs/ANDROID.md). Les essais sur appareil restent
à distinguer des tests de navigateur et des mesures du cloud.

## Sauvegardes

Le dernier camp préparé est sauvegardé entre les vagues. Un combat interrompu
reprend depuis ce camp. Les données restent liées à l'appareil et, sur le web,
à l'origine du site et au profil du navigateur.

Le menu **Sauvegarde familiale** permet d'exporter/importer volontairement un
fichier entre appareils. Ce transfert n'est pas une synchronisation cloud.
Les anciens formats restent pris en charge.

## Préparation Google Play

Modèle validé : jeu gratuit, publicité rare entre missions, suppression des pubs
et cosmétiques payants sans avantage de combat. **La version actuelle ne contient
pas de SDK publicitaire ou d'achat intégré.**

Le [dossier de publication](docs/publication/README.md) contient les captures,
les textes en brouillon et les vérifications restantes :

```sh
npm run store:check -- --draft
npm run store:dossier
```

Le contrôle strict `npm run store:check` reste bloquant tant que comptes,
SDK, transactions de test, prix et validations de publication ne sont pas prêts.
Les fiches du store ont des brouillons en quatre langues ; le jeu lui-même reste
actuellement en français. [Bilan de préparation](docs/BILAN-PREPARATION-STORE-2026-11.md).

## Architecture et règles de contribution

| Dossier                                         | Rôle                                                    |
| ----------------------------------------------- | ------------------------------------------------------- |
| `src/game.ts`, `src/ai.ts`, `src/navigation.ts` | Règles, IA et navigation indépendantes du navigateur    |
| `src/session.ts`                                | Session et horloge de simulation                        |
| `src/render/`                                   | Rendu Phaser, terrain et personnages                    |
| `src/ui/`                                       | Interface HTML et contrôles                             |
| `deploy/`                                       | Politique HTTP et outils de préparation de publication  |
| `tests/`, `scripts/`                            | Tests, captures, simulations et outils de développement |
| `android/`                                      | Enveloppe native Capacitor                              |
| `docs/`                                         | Conception, décisions, protocoles et bilans             |

Préserver la séparation règles/rendu, le RNG déterministe et la compatibilité des
sauvegardes. Aucun `Math.random` dans les règles. Lire [AGENTS.md](AGENTS.md),
[GAME_DESIGN.md](GAME_DESIGN.md) et [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
avant de modifier le gameplay imaginé par l'enfant.

## Licence et historique

Les éléments originaux du projet sont sous **licence propriétaire, tous droits
réservés** : voir [LICENSE](LICENSE). Le dépôt n'accorde pas de licence open source.
Les composants tiers conservent leurs licences : [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Les notes des étapes précédentes sont conservées dans [HISTORY.md](HISTORY.md).
