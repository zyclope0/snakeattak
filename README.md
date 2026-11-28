# La Conquête des Serpents · Snake Attack TD

Jeu de défense familial imaginé à partir du jeu d'un enfant. Prépare un détachement
pour protéger le cristal sur **trois voies interconnectées**, puis observe les
alliés combattre et se soigner de façon autonome.

**Version du projet 0.41.0 · Candidat Android build 65 · Français et anglais.**

[Jouer sur le site](https://snakeattacktd.com/)
· [Plan actuel](docs/PLAN-ACTUEL.md)
· [Guide Android](docs/ANDROID.md)
· [Bilan 0.41.0](docs/BILAN-0.41.0.md)

## Le jeu

- Six missions avec nouveau détachement, budget propre et 18 configurations possibles.
- Les caprices imaginés par le fils, avec leurs carnets, et la Grande Expédition à embranchements.
- Une aventure classique de douze vagues jusqu'au roi à trois têtes et sa garde.
- Une aventure sans fin, où les cadeaux et les rois se succèdent.
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

Les recettes navigateur de la [CI](.github/workflows/check.yml) sont à jouer localement
avant fusion selon la portée du changement. Le [plan actuel](docs/PLAN-ACTUEL.md)
donne le dernier commit vérifié.

## Android

Capacitor embarque le jeu local compilé dans `dist-android/`. Prérequis de compilation
natifs : JDK 21 et SDK Android 36. Le jeu se joue en paysage.

```sh
npm run android:sync
npm run android:open
```

`npm run android:apk:debug` construit « Serpents (test) », installable à côté de
l'application Play avec ses propres sauvegardes. `npm run android:package` produit
l'AAB signé avec la clé d'envoi d'origine et son APK dérivé pour la recette native.
Voir le [guide de construction](docs/ANDROID.md) et la [recette du build 65](docs/ANDROID-BUILD-65.md).

## Sauvegardes

Le dernier camp préparé est sauvegardé entre les vagues. Un combat interrompu
reprend depuis ce camp. Les données restent liées à l'appareil et, sur le web,
à l'origine du site et au profil du navigateur.

Le menu **Sauvegarde familiale** permet d'exporter/importer volontairement un
fichier du joueur actif entre appareils. Les anciens fichiers et codes de départ
de mission restent lisibles. Un voyage commencé reste jouable depuis sa sauvegarde.
Les anciens codes de Voyage `VOYAGE-…` ont été retirés le 21 novembre.

## Préparation Google Play

L'application est **gratuite, sans publicité ni achats intégrés**. Les pages
publiques, le lien de soutien et l'encart publicitaire préparé appartiennent au
site. L'encart est éteint.

Le [dossier de publication](docs/publication/README.md) contient les captures,
les textes en brouillon et les vérifications restantes :

```sh
npm run store:check -- --draft
npm run store:dossier
```

Le contrôle strict vérifie aussi les pièces et déclarations de publication
encore en attente. Les fiches sont en brouillon en FR, EN, DE et IT. Le jeu se
joue en français et en anglais.

## Architecture et règles de contribution

| Dossier                                         | Rôle                                                      |
| ----------------------------------------------- | --------------------------------------------------------- |
| `src/game.ts`, `src/ai.ts`, `src/navigation.ts` | Règles, IA et navigation indépendantes du navigateur      |
| `src/session.ts`                                | Session et horloge de simulation                          |
| `src/render/`                                   | Rendu Phaser, terrain et personnages                      |
| `src/ui/`                                       | Interface HTML et contrôles                               |
| `deploy/`                                       | Politique HTTP et outils de préparation de publication    |
| `tests/`, `scripts/`                            | Tests, captures, simulations et outils de développement   |
| `android/`                                      | Enveloppe native Capacitor                                |
| `docs/`                                         | Documents vivants ; l'historique est dans `docs/archive/` |

Préserver la séparation règles/rendu, le RNG déterministe et la compatibilité des
sauvegardes. Aucun `Math.random` dans les règles. Lire [AGENTS.md](AGENTS.md),
[GAME_DESIGN.md](GAME_DESIGN.md) et [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
avant de modifier le gameplay imaginé par l'enfant.

## Licence et historique

Les éléments originaux du projet sont sous **licence propriétaire, tous droits
réservés** : voir [LICENSE](LICENSE). Le dépôt n'accorde pas de licence open source.
Les composants tiers conservent leurs licences : [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Les notes des étapes précédentes sont conservées dans [HISTORY.md](docs/archive/HISTORY.md).
