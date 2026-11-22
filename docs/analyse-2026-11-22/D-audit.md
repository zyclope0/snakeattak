# Audit D — what still repeats, and how solid the engine and the saves are

> Annexe de [ANALYSE-2026-11-22.md](../ANALYSE-2026-11-22.md). Rapport brut d'une recherche
> du 22 novembre 2026, gardé pour ses sources et ses mesures. Seul ce qui est repris dans
> l'analyse a été recoupé ; le reste est à vérifier avant d'être cité. Les chemins de travail
> cités (dossier « scratchpad ») n'existent plus.

Independent audit, 22 November 2026, commit `36e207b` (branch
`claude/trusting-brahmagupta-t7fmuy`, same tree as `main` after PR 123). Nothing in the
repository was changed: no edit, no commit, no dependency. Tools, caches and outputs are under
`scratchpad/analyse/D/` (scripts `*.cjs`, results in `out/`).

Severity: **bloquant / important / mineur / observation**. Effort: **S** ≤ half a day, **M** ≤ 2
days, **L** more.

## 0. How it was measured, and the limits

- Duplicates: `jscpd` 4 (exact tokens, thresholds 30 / 50 / 100 tokens, min 5 lines — 3 at 30),
  plus my own finder with identifiers and literals normalised (`neardup.cjs`, TypeScript scanner,
  imports skipped, thresholds 40 / 60 / 100 / 150 tokens) for "same code, other names".
- Unused code: `knip` 5 (two runs: every entry point; the game's entry point alone), `madge` 8
  for cycles, my own scripts for style selectors, text constants and assets.
- Shape: TypeScript AST (`shape.cjs`): lines per function, cyclomatic complexity with nested
  functions excluded.
- Tests: `node --experimental-strip-types --test --experimental-test-coverage` (lcov), then 20
  mutants, one at a time, **whole unit suite each time**, in a `git worktree` under the scratch
  folder (removed at the end).
- Probes on the real engine from scratch scripts (`probes/fullcamp.ts`).
- **Limits.** The machine has Node 22.23.4; the project pins Node 24 (`.nvmrc`,
  `package.json` engines): the 933 tests pass on 22, nothing was run on 24. No build, no
  `verify`, no browser recipe (forbidden here): everything about the screen, the real
  `localStorage`, the APK and the browser recipes is read, not run. `knip` wrote a cache in
  `node_modules/.cache/jiti` (ignored by Git); I removed it.

## 1. Verdict in ten lines

1. **Exact copy-paste in the game is almost gone**: 0.05 % of lines at 50 tokens, 0 at 100
   (`src/` without texts). There is no "big duplicate" left to find with a tool.
2. What still repeats is **the same idea written by hand in several shapes**: eleven stores
   each with their own read/write and four different behaviours on failure; five ways to say
   "this camp has been touched"; action conditions restated in the camp panel; six windows
   built by hand.
3. **Recipes and tests carry the bulk**: 33 files start their browser, 26 their server, the
   storage keys are retyped in 27 files, an in-memory storage is written 8 times. This is the
   never-done "lot 7".
4. **Dead code: nearly none.** 0 unused file, 6 unused exports, 0 unused text out of 1 256,
   1 style selector without element, 7 images never shipped (4.2 Mo, 6 already known), 1 unused
   dev dependency (`axe-core`).
5. **Rules and saves are well protected**: 933 tests, 55 s; rule modules 98.9 % lines / 96.3 %
   branches, engine 99.7 % / 97.1 %. 12 mutants of 20 killed.
6. **8 mutants survive** (one is equivalent). The real gaps: the camp key after a failed read,
   the "part of the file was kept" message, the career size bound, the check that a deleted
   player is really gone, two bounds never reached by a test, a tie-break never exercised.
7. **Two rule lines are executed by no unit test**: snakes growing stronger in La Grande
   Expédition (`src/game.ts:364`), and a one-time card taken in the endless adventure
   (`src/game.ts:465-474`).
8. **The weakest point is not a rule, it is what happens when something throws**: no global
   error handler; one exception in a frame stops Phaser's loop for good (frozen board, no
   message); a start-up exception leaves "Recharge la page" with no way to export the family
   file.
9. **A family file is all or nothing**: one damaged number in the camp refuses the stars, the
   missions and the albums with it; the text is put aside but nothing can read it back.
10. Nothing here is _bloquant_ for the build 64. Nothing was tried on a phone, in Firefox or
    Safari, or with the children.

---

# PART 1 — Repetition, measured

## 1.1 Per scope

Exact clones (`jscpd`; "lines" are duplicated lines over all lines of the scope):

| Scope                                          | Files |  Lines | @30 tokens         | @50 tokens        | @100 tokens      |
| ---------------------------------------------- | ----: | -----: | ------------------ | ----------------- | ---------------- |
| `src/` TypeScript (no `texts/`, no dictionary) |   243 | 27 617 | 27 clones, 0.47 %  | 2 clones, 0.05 %  | 0                |
| Styles (`src/**/*.css`, 40 files)              |    40 |  9 740 | 22 clones, 1.29 %  | 6 clones, 0.48 %  | 0                |
| `src/html/` + `index.html`                     |    11 |    813 | 1 clone, 0.98 %    | 0                 | 0                |
| `scripts/` (`.mjs`, `.ts`)                     |    83 | 16 086 | 185 clones, 6.35 % | 34 clones, 1.90 % | 2 clones, 0.13 % |
| `tests/` (no `fixtures/`)                      |   177 | 24 155 | 221 clones, 5.11 % | 41 clones, 1.64 % | 3 clones, 0.15 % |
| `deploy/`                                      |    16 |  2 342 | 2 clones, 0.30 %   | 0                 | 0                |

Same code with other names (identifiers and literals normalised; share of tokens):

| Scope      |  Tokens | @40     | @60    | @100   | @150   |
| ---------- | ------: | ------- | ------ | ------ | ------ |
| `src/`     | 143 761 | 8.25 %  | 4.25 % | 1.83 % | 1.44 % |
| `scripts/` |  55 418 | 14.38 % | 6.58 % | 1.87 % | 0      |
| `tests/`   | 127 733 | 15.49 % | 4.99 % | 1.01 % | 0      |
| `deploy/`  |  10 187 | 8.46 %  | 2.92 % | 0      | 0      |

Reading: in `src/` at 60 tokens, 4 235 of the 6 117 "duplicated" tokens are **tables of data
that look alike by nature** (`src/data.ts:3-267`, `src/enemies.ts:3-164`, `src/levels.ts`,
`src/art.ts`, `src/caprices.ts`, `src/missions.ts`, the three constant files): 14 of 25
families. Real repeated logic is about 1.3 % of `src/`. Field reference: tools such as
SonarQube raise a flag at 3 % of duplicated lines on new code; the game is at 0.05 %, the
recipes at 1.6 to 1.9 %. **By the field's standard the game code is clean; the recipes are
ordinary.**

## 1.2 The 15 clone families of `src/`

Judgement: (a) worth merging, (b) parallel by design — leave, (c) test helper, (d) not worth it.

| #   | What repeats, in the game's words                                                                         | Where                                                                                                                                                                                                                                                                                                                                                                      | Size                                     | Judgement                                                                   |
| --- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------- |
| S1  | Reading and writing one stored key: get, bounded JSON, validate, default; validate, `setItem`, true/false | `src/expeditionStorage.ts:50-76`, `src/voyageStorage.ts:60-79`, `src/players.ts:142-169`, `src/endlessRecords.ts:83-106`, `src/missionDone.ts:29-58`, `src/progression.ts:104-124,156-169`, `src/checkpoints.ts:411-449`, `src/familyPersistence.ts:67-131`, `src/ui/recruitmentReminder.ts:20-50`, `src/audio/soundSettings.ts:9-39`, `src/render/visualSettings.ts:6-29` | 11 stores, 11 reads, 12 writes, 23 `try` | **(a)** important, M — see 2.3: the copies do not behave alike              |
| S2  | The log of a player (record + the one under way)                                                          | `src/expeditionStorage.ts:13-25,60-76` ↔ `src/voyageStorage.ts:20-32,63-79`                                                                                                                                                                                                                                                                                                | 2 × 75 + 2 × 73 normalised tokens        | **(b)/(d)** the voyage is ending; already left on purpose (review, point 7) |
| S3  | Drawing the mission of a step from the seed (setup, fight seed, challenge, run)                           | `src/voyage.ts:116-132` ↔ `src/expedition.ts:231-251`                                                                                                                                                                                                                                                                                                                      | 70 + 50 tokens                           | **(b)** frozen draws of two versioned modes                                 |
| S4  | "Add coins to the camp, or to the purse when there is no camp yet"                                        | `src/expedition.ts:515-522` ↔ `src/expedition.ts:587-594`                                                                                                                                                                                                                                                                                                                  | 74 tokens                                | **(a)** mineur, S                                                           |
| S5  | Searching a landing place behind a line: shares 1, 0.75, 0.5 × lifts 0, −12, +12                          | `src/engine/damage.ts:79-87` ↔ `src/engine/leap.ts:31-38`                                                                                                                                                                                                                                                                                                                  | 63 normalised tokens                     | **(a)** mineur, S, behind the reference games                               |
| S6  | "A place one can stand on": not blocked, nor the centre of its cell                                       | `src/engine/field.ts:14-18` (`standable`), `src/placement.ts:22-27`, `src/campLayout.ts:18-24`                                                                                                                                                                                                                                                                             | 3 writings, 77 tokens                    | **(a)** mineur, S                                                           |
| S7  | One step along a path (direction, step, blocked?)                                                         | `src/engine/movement.ts:76-79` ↔ `src/engine/movement.ts:133-136`                                                                                                                                                                                                                                                                                                          | 91 tokens                                | **(d)** two walkers with different rules after the test                     |
| S8  | Lane geometry: the end of a road near the crystal                                                         | `src/routes.ts:28-34` ↔ `src/routes.ts:53-59`; `src/routes.ts:86-90` ↔ `105-109`                                                                                                                                                                                                                                                                                           | 113 + 71 tokens                          | **(d)** geometry of two map families, frozen by the reference games         |
| S9  | A window with a title, a "Fermer" button and a scrolling body                                             | `src/ui/snakeIndex/snakeIndex.ts:51-75` ↔ `src/ui/privacy/privacyWindow.ts:68-81` (52 + 48 exact tokens), and by hand again in `src/ui/voyage/voyageWindow.ts:9-23`, `src/ui/settingsDialog.ts:20-46`, `src/ui/helpBubble.ts:30-51`, `src/ui/playersDialog.ts:14-86`; their styles `src/ui/privacy/privacy.css:5-25` ↔ `src/ui/snakeIndex/snakeIndex.css:4-24`             | 6 windows, 10 `showModal` in 10 files    | **(a)** mineur, S–M: `voyageWindow` already has the right shape             |
| S10 | Texts that follow the language: a list of live elements re-written at each change                         | `src/i18n/dom.ts:80-89` ↔ `src/i18n/phaser.ts:15-24`                                                                                                                                                                                                                                                                                                                       | 94 tokens                                | **(a)** mineur, S                                                           |
| S11 | The ad box: finding its place and following the window                                                    | `src/ui/webAds/delivery.ts:41-63` ↔ `src/ui/webAds/preview.ts:35-61`; `delivery.css:6-14` ↔ `preview.css:6-14`                                                                                                                                                                                                                                                             | 73 + 81 normalised tokens                | **(d)** the preview is a test build; advertising is off                     |
| S12 | The path of a tableau drawn on a page                                                                     | `src/ui/voyage/voyagePath.ts:46-57` ↔ `src/ui/voyage/expedition/expeditionViews.ts:79-90`; `bonusChoice.ts:14-17` ↔ `expeditionViews.ts:409-412`; `voyage.css:119-150,268-278` ↔ `expedition.css:35-41,196-202,273-283`                                                                                                                                                    | 75 + 60 tokens, 5 style clones           | **(b)/(d)** voyage screens leave with the voyage                            |
| S13 | A prepared image kept in a cache (name, cached?, surface, draw, publish)                                  | `src/render/figurines.ts:190-199` ↔ `254-264` (and `217-220`)                                                                                                                                                                                                                                                                                                              | 77 + 70 tokens                           | **(d)** two caches, two keys; 10 lines                                      |
| S14 | Two tables of threat cards built the same way                                                             | `src/ui/threatPreview.ts:39-76` ↔ `77-115`                                                                                                                                                                                                                                                                                                                                 | 186 + 180 normalised tokens              | **(d)** data                                                                |
| S15 | The same import header at the top of the board's signal classes                                           | `src/render/bossSignals.ts:1-10`, `medicalSignals.ts:1-5`, `battleFeedback.ts:1-12`, `encounterReadout.ts:1-5`                                                                                                                                                                                                                                                             | 56–65 tokens                             | **(d)** imports                                                             |

## 1.3 The 15 clone families of `scripts/` + `tests/`

| #   | What repeats                                                                           | Where                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Size                                                 | Judgement                                                                                            |
| --- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| T1  | Starting the server of the game, waiting for it, stopping it                           | `scripts/journey-browser.mjs:1-32`, `medical-persistence-browser.mjs:1-32`, `missions-browser.mjs:1-29`, `rewards-browser.mjs:1-32`; `endless-browser.mjs:67-106` ↔ `expedition-browser.mjs:81-120`; `interruptions-033-browser.mjs:31-48`, `stage-023-browser.mjs:11-34`, `tests/locale-bindings-035-browser.mjs:16-23`                                                                                                                                                     | `spawn(` in **26 files**; 543 + 444 + 268 tokens     | **(c)** important for upkeep, M                                                                      |
| T2  | Starting a browser, catching page errors and outside requests                          | `chromium.launch(` in **33 files**, `on('pageerror')` in 35; `tests/journey-browser.mjs:27-35` ↔ `tests/rewards-browser.mjs:41-49`                                                                                                                                                                                                                                                                                                                                           | 33 launches                                          | **(c)** M — `scripts/hygiene/harness.mjs:33-149` already does it for 11 files                        |
| T3  | Screen sizes typed by hand                                                             | 780×360 in 15 files (46 lines), 812×375 in 27 (60), 1280×800 in 23 (40); device tables `scripts/child-mobile-035-browser.mjs:54-63` ↔ `reinforcements-scroll-037-browser.mjs:191-200`; Android bars `scripts/mobile-help-038-checks.mjs:4-17` ↔ `mobile-privacy-038-checks.mjs:3-16` (+ `players`, `replay`)                                                                                                                                                                 | 146 lines                                            | **(c)** S once T2 exists                                                                             |
| T4  | Storage keys retyped as text (`conquete-serpents:…`)                                   | **27 files, 98 lines**                                                                                                                                                                                                                                                                                                                                                                                                                                                       | —                                                    | **(c)** S: import `src/storageKeys.ts`; `tests/storage-keys.test.ts` must keep retyping, on purpose  |
| T5  | Teaching Node to load an image or a sound as a module                                  | `registerHooks(` in **18 files**: `tests/expedition.test.ts:1-12`, `family-extras.test.ts:1-12`, `expedition-screens.test.ts:1-13`, `expedition-draws.test.ts:1-14`, `carried-camp.test.ts:1-13`, `attack-pose.test.ts:1-17`, `balance-revision-5.test.ts:27-41`, `balance-revision-7.test.ts:29-43`, `endless.test.ts`, `scripts/balance-expedition.mjs:16-25`, `scripts/expedition-browser.mjs:13-22`…                                                                     | 118 exact tokens × 6, 437 normalised                 | **(c)** S: one `tests/assets-as-modules.ts`                                                          |
| T6  | A storage in memory                                                                    | `function memory()` in `tests/caprices-albums-036.test.ts:188`, `family-extras.test.ts:24`, `family-persistence-020.test.ts:10`, `family-sync-settled.test.ts:20`, `players.test.ts:42`, `progression-018.test.ts:12`, `sound-settings.test.ts:6`, `voyage-helpers.ts:5`; six more written inline (`checkpoints.test.ts:27`, `family-backup-020.test.ts:116`, `family-missions-021.test.ts:57,92`, `recruitment-reminder-0362.test.ts:106`, `visual-settings-024.test.ts:8`) | 8 + 6                                                | **(c)** S                                                                                            |
| T7  | A small page that assembles the game for one recipe (session, controls, Phaser, scene) | `tests/caprices-036-harness.ts:119-128`, `mobile-031-harness.ts:14-27`, `result-0342-harness.ts:66-83`, `stage-023-harness.ts:55-69`, `tactical-022-harness.ts:66-77`; `presentation-harness.ts:22-60,104-122`; `caprices-036-harness.ts:7-18,96-109` ↔ `replay-038-harness.ts:9-20,94-107`                                                                                                                                                                                  | 488 + 555 tokens; `new Phaser.Game(` in 7 test files | **(c)** M — and they still load 1 to 7 style sheets where the game loads 40 (open since 13 November) |
| T8  | The automatic player of the balance measures (which lane, how many allies)             | `scripts/balance-modes.mjs:80-98,109-113,133-143,309-321` ↔ `scripts/caprices-lab.mjs:58-76,98-108,188-200` ↔ `scripts/lab/players.ts:75-84,99-103`                                                                                                                                                                                                                                                                                                                          | 163 + 137 + 129 exact tokens                         | **(a)** important, S–M: balance decisions rest on these numbers; two copies of the player can drift  |
| T9  | A dense camp for a load measure                                                        | `scripts/hygiene/profile-charge.mjs:20-31` ↔ `scripts/hygiene/reference-charge.mjs:15-27`                                                                                                                                                                                                                                                                                                                                                                                    | 170 tokens                                           | **(c)** S                                                                                            |
| T10 | One wave played to its end with a rich camp, per revision                              | `tests/balance-revision-4.test.ts:112-125`, `balance-revision-5.test.ts:48-62`, `balance-revision-6.test.ts:46-62`                                                                                                                                                                                                                                                                                                                                                           | 203 + 179 tokens                                     | **(b)** one test file per frozen revision: leave                                                     |
| T11 | A fight set up by hand (one hero, one snake, no egg)                                   | `tests/bestiaire-014.test.ts:10-19` ↔ `boss-016.test.ts:59-69`; `ai-stability.test.ts:7-24,49-59`, `mechanical-enemies.test.ts:21-30`, `road-clarity.test.ts:7-13,68-74`                                                                                                                                                                                                                                                                                                     | 158 + 427 tokens                                     | **(c)** S, optional                                                                                  |
| T12 | Every departure of a mission (layout × assault × nest)                                 | `tests/caprices-persistence-036.test.ts:29-36`, `departures-025.test.ts:9-14`, `mission-reroll-026.test.ts:8-14`, `tutorial-codecs-030.test.ts:28-32`                                                                                                                                                                                                                                                                                                                        | 280 tokens                                           | **(c)** S                                                                                            |
| T13 | A departure code encoded by hand (alphabet, checksum)                                  | `tests/balance-revision-0362.test.ts:405-413` ↔ `tests/caprices-persistence-036.test.ts:211-219`                                                                                                                                                                                                                                                                                                                                                                             | 122 tokens                                           | **(b)** a test that retypes the format on purpose                                                    |
| T14 | The same steps repeated inside one long recipe                                         | `scripts/mobile-menus-037-browser.mjs:475-488` ↔ `501-514`, `82-93` ↔ `96-107`; `scripts/child-mobile-035-browser.mjs:160-172` ↔ `197-209`; `scripts/mobile-voyage-038-checks.mjs:1159-1172` ↔ `1227-1242`                                                                                                                                                                                                                                                                   | 141 + 140 tokens                                     | **(d)**                                                                                              |
| T15 | Walking an expedition to its end in a test                                             | `tests/expedition-screens.test.ts:35-42` ↔ `43-50`; `tests/caprice-presentation-0361.test.ts:24-40` ↔ `41-57`                                                                                                                                                                                                                                                                                                                                                                | 123 tokens                                           | **(d)**                                                                                              |

## 1.4 Near-duplicates a token tool does not see

### Storage and validators

- **R1 — Eleven stores, four behaviours** (important, M). See S1 and section 2.3. The value of
  merging is not the 23 `try` blocks: it is one written answer to "what if the read fails, what
  if the text cannot be read, what if the write fails".
- **R2 — "Give me `localStorage`, or nothing"**: `src/bootstrap.ts:218-224`,
  `src/ui/webAds/delivery.ts:16-22`, `src/audio/soundSettings.ts:41-46`,
  `src/render/visualSettings.ts:30-35`, `src/i18n/controls.ts:11-21`. Five writings (mineur, S).
- **R3 — Ten modules define their own storage port type** (`voyageStorage.ts:27-28`,
  `endlessRecords.ts:81`, `expeditionStorage.ts:20-21`, `soundSettings.ts:3`,
  `visualSettings.ts:3`, `familyExtras.ts:16-17`, `players.ts:63-64`, `missionDone.ts:3`,
  `checkpoints.ts:35`, `recruitmentReminder.ts:18`). Known and left; disappears with R1 (d).
- **R4 — Two readers still bypass `plainData.ts`**: `src/healing.ts:62-82` (`readMedical`, 21
  decisions) and `src/roster.ts:20-29` (`isRoster`). Noted on 13 November, still there
  (mineur, S). Otherwise the guards are really shared: 36 hand-written type tests remain in the
  73 rule modules.
- **R5 — The armour factor still has one writing outside `boons.ts`**:
  `src/engine/state.ts:165` (`1 + game.boonGain('armure')`). The review says "one writing
  instead of seven" (mineur, S).
- **R6 — `STAR_MAX` and `STARS_MAX`**, both 3, both exported: `src/gameConstants.ts:16` and
  `:43`. The texts use one (`src/texts/fr/page.ts:237`, `home.ts:21`…), the screens the other
  (`src/ui/gameParts.ts:8`, `src/render/resultCopy.ts:81`). Added by lot 4 beside the existing
  name: against "one name, one place" (mineur, S).
- **R7 — `freshSeed`** written twice: `src/session.ts:9`, `src/ui/missionWords.ts:7` (mineur, S).

### Rules restated in screens and rendering

The layering itself is clean: no rule module imports `ui/`, `render/`, `i18n/` or `audio/`, none
touches `document`, `window` or `localStorage`; only one import goes from rendering into
`engine/` and it is four durations (`src/render/effectTrails.ts:3`). What remains is rules
**recomputed** outside:

- **R8 — "This camp has been touched"**, five writings with five different conditions:
  `src/session.ts:47` (wave, kings, team size), `src/bootstrap.ts:97` (the same line, retyped),
  `src/ui/menu.ts:49-54` (wave, coins, team size, placed), `src/ui/controls.ts:106` (placed,
  wave, coins, crystal), `src/ui/voyage/voyageScreens.ts:118` (wave, placed). They decide
  whether a restart asks for confirmation and what the home offers (important for coherence, S).
- **R9 — May I repair, train, encourage, use honey?** Decided in `src/game.ts:379-389`
  (`trainHero`), `395-402` (`encourage`), `627-635` (`repair`), `495-507` (`offerFeast`), and
  again for the buttons in `src/ui/campToolModel.ts:20-36`, `:80`, `:100`, `:122`. The engine
  has `canRecruit` but no `canRepair` / `canTrain` / `canEncourage` (mineur, S–M).
- **R10 — Coins that may be spent** (purse minus the bank of a caprice): `src/game.ts:78-80`
  and `src/ui/capriceBudget.ts:3-6` (mineur, S).
- **R11 — "A clockwork snake loses its plate at half life"**: the rule
  `src/enemies.ts:168-170`, retyped in `src/render/actors.ts:96-98` and
  `src/render/presentation.ts:381-382` (mineur, S).
- **R12 — Words left in the code**, which the "no text in code" test lets through: `'offert'`
  (`src/ui/battleDock.ts:107`, `src/ui/recruitShop.ts:146`), `' et '`
  (`src/ui/tutorialLanes.ts:37`, `src/ui/missionPreview.ts:170`, `src/ui/feastControls.ts:168`),
  `'serpent' : 'serpents'` (`src/ui/missionPreview.ts:192`). A whole sentence sits in
  `src/i18n/controls.ts:8`, a folder the test leaves out on purpose
  (`tests/texts-catalogue.test.ts:46`). The spoken label of an ally card is also built twice
  (`battleDock.ts:104-108`, `recruitShop.ts:146`) (mineur, S). Not checked in the English
  interface.
- **R13 — `as Kind`, 35 times** (44 with `as Kind[]`), 29 of them `kinds[u.kind as Kind]` in rule
  modules: an ally is typed `Kind | 'snake'`. A typed accessor or two entity types would remove
  them (observation, M, touches the engine: behind the reference games).

### The three modes

Voyage, expedition and endless share the engine (`Game` takes a stage or endless rules). What is
parallel: the two logs (S2), the two step draws (S3), the two sets of screens and styles (S12),
`bindVoyageScreens` (131 lines) and `bindExpeditionScreens` (214 lines). **Leave**: the voyage
only exists to finish a voyage already begun; every merge would touch two saves to remove a
likeness that leaves by itself. The honest action is a date for removing the voyage.

### Styles

- 1 840 rules, 5 408 declarations. Identical declaration blocks (3 declarations or more): 11
  families, 44 redundant declarations, **0.8 %**. Nothing to merge there.
- **R14 — `48px`, the touch target, is typed 127 times** (69 `min-height: 48px`); the project
  rule is "48 px at least", and no custom property carries it (`--mobile-hud-height: 48px` at
  `src/styles/01-base.css:34` is something else) (mineur, S–M, no pixel changes).
- 420 distinct colours written 680 times outside the 20 custom properties; 96 distinct font
  sizes; 40 distinct radii. Already known ("387 couleurs"): a palette changes the picture, it is
  an art-direction job with the parent's eye — **not a cleaning job** (d).
- 95 `@media` blocks, 41 distinct conditions, 27 distinct pixel thresholds; the phone-landscape
  condition `(max-width: 1100px) and (max-height: 520px) and (orientation: landscape)` is
  written 14 times and holds 149 rules. CSS cannot name a media query without a build step:
  **leave**, but a test like `tests/screen-thresholds.test.ts` could hold this one too
  (observation, S).
- 77 selectors are written more than once in the same media context, 65 of them across two
  files: the cascade, not a copy. It is why the order of the sheets matters.

### HTML

813 lines, no clone at 50 tokens. The "code + copy button" block appears three times
(`src/html/battle.html:356-365`, `home.html:77-87`, `mission-dialog.html:47-57`). Ten windows
live in the page, six more are built in code (S9): two ways of making a window (observation).

### Texts

1 256 French constants, **0 unused** (checked by name against `src/`, the templates, `deploy/`,
tests and scripts). 62 identical French strings live under several names (80 redundant
constants, 6.4 %): « Fermer » ×8, « King Snake » ×5, « Reprendre », « Bravo ! », « C'est
parti ! » ×3… The English of the two I opened is identical everywhere. One `common` catalogue
would hold them (mineur, S); risk is low today, it is a translation that can drift tomorrow.

## 1.5 Unused things

| What                                 |      Count | Sample                                                                                                                                                                                                                                                                                          | How checked                                                                                                                                             |
| ------------------------------------ | ---------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unused source files                  |          0 | —                                                                                                                                                                                                                                                                                               | `knip`, game entry alone and with tests/scripts                                                                                                         |
| Unused exports (nobody imports them) |          6 | `FAMILY_CHARACTER_LIMIT` (`src/familyBackup.ts:72`), `TABLEAU_NAMES` and `missionInTableau` (`src/ui/voyage/expedition/expeditionWords.ts:33,62`), `settingsDialog` (`src/ui/settingsDialog.ts:20`), `AD_SCREEN` (`src/ui/webAds/delivery.ts:12`), `bindCopyButton` (`src/ui/departures.ts:23`) | `knip`; they are used inside their file: only the word `export` is extra                                                                                |
| Exports used by tests only           |          2 | `LASTING_BOONS` (`src/boons.ts:48`), `untranslatedCopy` (`src/i18n/copy.ts:135`)                                                                                                                                                                                                                | `knip`, game entry alone                                                                                                                                |
| Unused exported types                |         13 | `TableauTuning`, `Step`, `CarriedUnit`, `Camp`, `Pending` (`src/expedition.ts`), `SwimState`…                                                                                                                                                                                                   | `knip`                                                                                                                                                  |
| Style classes without element        |          1 | `.reinforcements-open` (`src/styles/16-dock.css:158`) — already known                                                                                                                                                                                                                           | every class of every selector searched as a whole word in `src/` and the templates                                                                      |
| Style ids without element            |          0 | 7 candidates, all built in code (`mission-${view}`, `${name}-record`)                                                                                                                                                                                                                           | same, then read                                                                                                                                         |
| Unused texts                         |  0 / 1 256 | —                                                                                                                                                                                                                                                                                               | `texts.cjs`                                                                                                                                             |
| Images never shipped                 | 7, 4.15 Mo | `src/assets/illustrated/ground-clearing.webp`, `ground-grove.webp`, `ground-ruins.webp`, `strongholds.original.webp` (774 Ko, named by a script only), `src/assets/roi-cobra.png`, `src/assets/serpent-vert-idle.png`, `public/assets/enemies/serpent-vert-idle.png`                            | base name searched in `src/`, `deploy/`, `index.html`, `vite.config.ts`; sounds and caprice pictures are loaded by `import.meta.glob` and were excluded |
| Unused dependency                    |          1 | `axe-core` (dev): named in `package.json:79`, imported nowhere                                                                                                                                                                                                                                  | `knip` + `grep`                                                                                                                                         |
| Import cycles at run time            |          1 | `src/ui/voyageDoor.ts` ↔ `src/ui/voyage/voyageScreens.ts`, through a lazy `import()`: harmless                                                                                                                                                                                                  | `madge`, type imports skipped (22 with them, all `import type`)                                                                                         |

Six of the seven images were already listed on 21 November and are still in the tree.

## 1.6 Size and shape

243 source files, 27 617 lines, 2 362 functions. 25 functions over 60 lines (the review said
25: unchanged), 77 over 40; 27 with more than 15 decisions of their own.

**The 20 largest files**: `src/expedition.ts` 817 · `src/game.ts` 683 ·
`src/ui/voyage/expedition/expeditionViews.ts` 543 · `src/render/presentation.ts` 537 ·
`src/bootstrap.ts` 499 · `src/render/actors.ts` 475 · `src/checkpoints.ts` 451 ·
`src/render/BattleScene.ts` 359 · `src/caprices.ts` 340 · `src/i18n/privacyPolicy.ts` 308 ·
`src/engine/allies.ts` 301 · `src/data.ts` 297 · `src/missions.ts` 292 · `src/render/juice.ts`
278 · `src/ui/voyage/expedition/expeditionScreens.ts` 274 ·
`src/ui/voyage/expedition/expeditionWords.ts` 272 · `src/render/figurines.ts` 267 ·
`src/players.ts` 265 · `src/render/battleFeedback.ts` 258 · `src/familyBackup.ts` 248.
Since the review: `expedition.ts` 792 → 817, `bootstrap.ts` 494 → 499, `game.ts` 688 → 683.

**The 20 longest functions** (lines; decisions of their own):

| Lines |                   Own decisions | Function                                                                    |
| ----: | ------------------------------: | --------------------------------------------------------------------------- |
|   214 | 1 (45 with its inner functions) | `bindExpeditionScreens`, `src/ui/voyage/expedition/expeditionScreens.ts:61` |
|   131 |                          1 (32) | `bindVoyageScreens`, `src/ui/voyage/voyageScreens.ts:46`                    |
|   120 |                          3 (17) | `bindWebAdPreview`, `src/ui/webAds/preview.ts:9`                            |
|   116 |                          1 (13) | `bindExpeditions`, `src/ui/expeditions.ts:25`                               |
|    99 |                              19 | `BossSignals.draw`, `src/render/bossSignals.ts:45`                          |
|    98 |                               7 | `drawEncounter`, `src/render/battleFeedback.ts:160`                         |
|    96 |                          1 (28) | `bindRewardControls`, `src/ui/rewardControls.ts:23`                         |
|    91 |                          1 (18) | `bindWebAds`, `src/ui/webAds/delivery.ts:30`                                |
|    86 |                              15 | `road`, `src/ui/voyage/expedition/expeditionViews.ts:126`                   |
|    85 |                               2 | `bindMenu`, `src/ui/menu.ts:150`                                            |
|    83 |                               3 | `bindRosterEditor`, `src/ui/rosterEditor.ts:36`                             |
|    79 |                               1 | `bindMissionDraft`, `src/ui/missionDraft.ts:78`                             |
|    78 |                               1 | `createPlayerList`, `src/ui/playerList.ts:46`                               |
|    77 |                          **47** | `readExpeditionState`, `src/expedition.ts:741`                              |
|    75 |                              18 | `announceTurns`, `src/render/presentation.ts:248`                           |
|    73 |                               1 | `createPlayersDialog`, `src/ui/playersDialog.ts:14`                         |
|    70 |                               1 | `bindBattleResult`, `src/ui/battleResult.ts:16`                             |
|    68 |                              15 | `BattleFeedback.draw`, `src/render/battleFeedback.ts:92`                    |
|    67 |                               1 | `bindControls`, `src/ui/controls.ts:33`                                     |
|    67 |                          1 (24) | `createRecruitmentReminder`, `src/ui/recruitmentReminder.ts:71`             |

The long `bind…` functions are lists of small closures: long but flat. The **hot spots by
decisions** are readers of saved data: `readExpeditionState` 47 (`src/expedition.ts:741`),
`decodeDeparture` 31 (`src/departures.ts:182`), `readFamilyData` 27 (`src/familyBackup.ts:107`),
`historicVariant` 27 (`src/waves.ts:107`), `readEndlessRewards` 25 (`src/rewards.ts:156`),
`readCheckpoint` 25 (`src/checkpoints.ts:381`), `Game` constructor 23 (`src/game.ts:176`),
`swimTurn` 22 (`src/engine/swim.ts:97`), `readMissionRun` 21, `readMedical` 21,
`applyFamily` 19 (`src/bootstrap.ts:461`). A reader made of forty `||` is the house style and
it is tested; `readExpeditionState` is the one worth cutting into named steps as
`decodeCheckpoint` was (mineur, S–M).

## 1.7 Rules decided outside the rule modules

None _decided_ outside; several _restated_ (R8 to R11 above). One more place holds real
coordination that is neither a rule module nor tested by a unit test: `src/bootstrap.ts`
(499 lines, loaded by no unit test) — which game is on the board (`:242-275`, `:325-411`), what
is written after a step (`:278-290`), the import of a family file (`:461-499`, 19 decisions),
the records of the endless adventure (`:263-270`). Only browser recipes cover it (important, M
to extract `applyFamily` and `recordGame` behind a module that Node can test).

---

# PART 2 — Solidity of the engine and the saves

## 2.1 Tests

- **933 tests in 151 files, all green; 55 s** wall clock (147 s of processor), 82 s with
  coverage. The five slowest are whole games replayed: 32.7 s, 16.3 s, 15.9 s, 13.4 s, 10.7 s.
  No test file without an assertion.
- Coverage by Node's built-in tool (lines / branches):

| Part                                  | Files loaded |      Lines |   Branches |
| ------------------------------------- | -----------: | ---------: | ---------: |
| Rule and storage modules (`src/*.ts`) |           60 | **98.9 %** | **96.3 %** |
| `src/engine/`                         |           13 | **99.7 %** | **97.1 %** |
| `src/audio/`                          |            5 |     99.7 % |     95.6 % |
| `src/i18n/`                           |            5 |     88.4 % |     86.8 % |
| `src/render/`                         |     27 of 48 |     83.7 % |     97.4 % |
| `src/ui/`                             |    48 of 104 |     74.4 % |     91.9 % |
| `deploy/`                             |           14 |     97.4 % |     81.4 % |

**85 of the 243 source files are loaded by no unit test** (only browser recipes reach them):
`src/bootstrap.ts`, `src/main.ts`, `src/render/BattleScene.ts`, 20 other render files, 56
interface files (most of the `bind…`), the lazy screens of the voyage and the expedition.

- **The 20 rule or storage files with the lowest coverage, and what is unprotected**:

| File                       |  Lines |   Branches | Not executed by any unit test                                                                                                                                     |
| -------------------------- | -----: | ---------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/unitRules.ts`         | 88.4 % |     84.8 % | `:53-58,67-68` the sentences describing the spinosaurus and the dragon/tank splash (display)                                                                      |
| `src/defenders.ts`         | 89.7 % |     98.7 % | `:72-83` `roleDescription` (display)                                                                                                                              |
| `src/rewards.ts`           | 90.8 % |     88.2 % | 6 branches of `readEndlessRewards` (`:156-195`): refusals of a damaged endless camp                                                                               |
| `src/tactics.ts`           | 92.2 % |      100 % | `:10-13` `feastPoint` (where the honey sits)                                                                                                                      |
| `src/expeditionLog.ts`     | 93.8 % |     91.7 % | `:30-31` storage that throws                                                                                                                                      |
| `src/expeditionStorage.ts` | 94.7 % | **78.3 %** | `:62-63`, `:74-75`: the two `catch` — a storage that refuses to read or to write the expedition                                                                   |
| `src/session.ts`           | 97.0 % |     97.7 % | `:35-37` `restartSame` (restart keeps the endless mode)                                                                                                           |
| `src/engine/movement.ts`   | 97.3 % |     97.7 % | `:137-141` an ally whose recovery step meets a rock                                                                                                               |
| `src/voyageStorage.ts`     | 97.5 % |     96.7 % | `:48-49`                                                                                                                                                          |
| `src/familyPersistence.ts` | 98.1 % |     95.5 % | `:119-120` no room for the copy of a version 6 file, `:149-150`                                                                                                   |
| `src/ai.ts`                | 98.1 % |     90.9 % | `:52` last fallback of the lane draw                                                                                                                              |
| `src/expedition.ts`        | 98.2 % | **87.3 %** | `:404-405`, `:514-523`, `:734`, `:815-816`; 34 branches of the reader and of the gifts                                                                            |
| `src/game.ts`              | 98.4 % |     96.8 % | **`:364` snakes made stronger by a stage of La Grande Expédition; `:465-474` a one-time card (coins, crystal ward, offered ally) taken in the endless adventure** |
| `src/players.ts`           | 98.5 % |     96.3 % | `:134-135`, `:214-215`                                                                                                                                            |
| `src/progression.ts`       | 98.6 % |     98.1 % | `:161-163` a career too long to be written                                                                                                                        |
| `src/capriceAlbums.ts`     | 98.9 % |     97.5 % | `:107-108`                                                                                                                                                        |
| `src/navigation.ts`        | 99.5 % |     97.8 % | `:140` no path found                                                                                                                                              |
| `src/engine/swim.ts`       |  100 % | **85.3 %** | 10 branches of the spinosaurus's swim                                                                                                                             |
| `src/engine/landing.ts`    |  100 % |     75.0 % | 1 branch of 4: a snake landing beyond the last stage                                                                                                              |
| `src/codeText.ts`          |  100 % |     90.0 % | 1 branch of 10 in the reading of a typed code                                                                                                                     |

The two lines of `src/game.ts` are the only uncovered lines that are **rules of a mode
children play**. (important, S: two tests.) Whether `npm run test:expedition` and
`test:endless` reach them in the browser was not run.

- Already in good shape: the reference games (`tests/engine-traces.test.ts`), the frozen device
  of a build-63 tester in CI, the readers refused on 1.5 million damaged saves (reported by the
  earlier work; not rerun here).
- **F1 — A sentence is part of the game's fingerprint** (important, M). The engine writes the
  French sentence shown to the child into `game.message` (13 assignments in rule modules; 25
  of the 73 rule modules import a French catalogue), and the reference games hash the whole state:
  `tests/fixtures/engine-traces.ts:3-6` says three fingerprints had to be recomputed when the
  king was renamed. Rewording a sentence therefore breaks the guard that says "a fingerprint
  that changes is a game that changes" — and a fingerprint regenerated for a sentence can hide a
  rule that moved. Field practice: the state carries an event (a code and its numbers), the
  screen writes the sentence; or, cheaper, the fingerprint leaves `message` out.

## 2.2 Mutation spot-checks

20 mutants, one at a time, the 933 tests each time, in the scratch worktree; the file restored
with `git checkout` and `git status --porcelain` checked empty after each. **12 killed, 8
survive.**

| #   | Mutant                                                                                                              | Verdict                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| M01 | `CAMP_CHARACTER_LIMIT` ×10 (`src/checkpoints.ts:33`)                                                                | killed (2 tests)                                                                                                                     |
| M02 | A camp whose **read failed** is written over all the same (`src/checkpoints.ts:437`, `disabled` ignored)            | **survives**                                                                                                                         |
| M03 | A family file whose read failed no longer blocks writes (`src/familyPersistence.ts:127`)                            | killed                                                                                                                               |
| M04 | An unreadable family file is no longer put aside (`src/familyPersistence.ts:105-109`)                               | killed (3 tests)                                                                                                                     |
| M05 | Records: the kings no longer break a tie (`src/endlessRecords.ts:30`)                                               | killed                                                                                                                               |
| M06 | A text of exactly the limit is refused (`src/plainData.ts:54`)                                                      | killed (3 tests)                                                                                                                     |
| M07 | Frame clamp after an absence 0.1 s → 10 s (`src/session.ts:89`)                                                     | killed (2 tests)                                                                                                                     |
| M08 | Nearest target, tie: the youngest instead of the oldest (`src/engine/state.ts:84`)                                  | **survives** — no reference game ever has two targets at exactly the same distance                                                   |
| M09 | Endless: coin floor 0.1 → 0.2 (`src/endless.ts:44`)                                                                 | **survives** — the floor only acts from the 22nd king                                                                                |
| M10 | Family import: a way back that the device also refused is reported as "nothing changed" (`src/familyExtras.ts:114`) | **survives** — the message « une partie seulement du fichier a été gardée » (`src/bootstrap.ts:466,478,481`) is held by no unit test |
| M11 | Expedition log: the record may be behind the expedition under way (`src/expeditionStorage.ts:33`)                   | killed                                                                                                                               |
| M12 | Player 2 writes on player 1's keys (`src/players.ts:173`)                                                           | killed (7 tests)                                                                                                                     |
| M13 | Longest simulated step 0.05 → 0.5 (`src/game.ts:72`)                                                                | killed                                                                                                                               |
| M14 | A career over its size limit is written all the same (`src/progression.ts:160`)                                     | **survives**                                                                                                                         |
| M15 | A version 1–3 family file with albums is accepted, albums dropped (`src/familyBackup.ts:110`)                       | killed                                                                                                                               |
| M16 | Carried camp: the next number is not raised above the carried ones (`src/game.ts:347`)                              | killed                                                                                                                               |
| M17 | Deleting a player: "some key is gone" instead of "every key is gone" (`src/players.ts:201`)                         | **survives**                                                                                                                         |
| M18 | Records: the early return when nothing changed is removed (`src/endlessRecords.ts:98`)                              | survives — **equivalent** (one more identical write, same answer)                                                                    |
| M19 | The wave reward ignores « la rente » (`src/engine/outcome.ts:63`)                                                   | killed                                                                                                                               |
| M20 | Save header: `nextId` unbounded (`src/checkpoints.ts:208`)                                                          | **survives** — the constant is retyped by a test, its use in the reader is not                                                       |

Seven real gaps, none in the main path of a save: M02, M10, M14, M17 are **error branches of
storage**; M08, M09, M20 are bounds or ties no test reaches. 60 % killed on mutants chosen to be
awkward is a good score for a hobby project; on the family file's main path (M03, M04, M06,
M15) everything was killed. (important as a group, S each: seven small tests.)

## 2.3 Storage

### Every access

All of them go through a port (`Pick<Storage, …>`) handed in by the caller, except the four
device-wide settings that take `localStorage` themselves. **No unguarded call was found.**

| Site                                                                                                 | Key                            | On failure                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/bootstrap.ts:218-224`                                                                           | `window.localStorage` itself   | `try` → `undefined`: the game runs in memory, statuses say « indisponible »                                                                                                                                                                                                  |
| `src/familyPersistence.ts:96` read                                                                   | family                         | throws → `disabled = true` for the session, nothing is written over it, status « Sauvegarde familiale indisponible »; **cannot be read** (damaged, unknown or future version) → text copied to `family-refused` (`:106`), new game, status « incompatible »                  |
| `src/familyPersistence.ts:80` write                                                                  | family                         | `catch` → false, status « indisponible », retried at the next change                                                                                                                                                                                                         |
| `src/familyPersistence.ts:106,117`                                                                   | family-refused                 | `catch` → no copy, the game goes on (the old file is then lost at the next save)                                                                                                                                                                                             |
| `src/checkpoints.ts:422` read, `:441` write                                                          | camp                           | read throws → disabled; unreadable → status, **overwritten at the next sync, no copy**; write refused → retried                                                                                                                                                              |
| `src/progression.ts:117` read, `:165` write                                                          | career                         | read throws → fresh career, **writes go on** (the stored career is replaced); write refused → status only                                                                                                                                                                    |
| `src/expeditionStorage.ts:52` read, `:71` write                                                      | expedition                     | read throws or unreadable → empty log (the record is salvaged if only the expedition is damaged, `:55-58`), **overwritten at the next save, no copy**; write → false, the screen says so                                                                                     |
| `src/voyageStorage.ts:62`, `:74`                                                                     | voyage                         | same, without salvage                                                                                                                                                                                                                                                        |
| `src/endlessRecords.ts:87` read, `:100` write                                                        | records                        | read throws or unreadable → `[]`, **the next record replaces the list**; write refused → silently not kept                                                                                                                                                                   |
| `src/expeditionLog.ts:17`                                                                            | expedition (home door)         | `try` → « none »                                                                                                                                                                                                                                                             |
| `src/missionDone.ts:32,45,53`                                                                        | mission-done                   | `try`; a lost mark only brings « Reprendre » back                                                                                                                                                                                                                            |
| `src/familyExtras.ts:49` read; `:108-109`, `:95-96` write and way back                               | expedition, voyage, records    | `try` per key; a refused write is undone; if the undo is refused too, `partial` (see M10)                                                                                                                                                                                    |
| `src/players.ts:144` read, `:164` write, `:183-188` per-player port, `:200-201` delete, `:210` stars | players and every player key   | read throws or unreadable → **one player « p1 »**; the keys of players 2–4 stay on the device but are out of reach; a new player then takes `p2` and finds the old `p2` adventure (`:219-220` assumes a freed number was cleaned). Write → false, the caller changes nothing |
| `src/ui/playerList.ts:27,34-35`                                                                      | `sessionStorage` player-chosen | `try` → the question is asked again                                                                                                                                                                                                                                          |
| `src/ui/recruitmentReminder.ts:23,45`                                                                | reminder                       | `try`; **the only read without a length bound** before `JSON.parse` (`:23-24`)                                                                                                                                                                                               |
| `src/audio/soundSettings.ts:13,33,43`, `src/render/visualSettings.ts:9,20,32`                        | sound, visual                  | `try`, memory                                                                                                                                                                                                                                                                |
| `src/i18n/controls.ts:15-16,86`                                                                      | language                       | `try`, memory                                                                                                                                                                                                                                                                |
| `src/ui/webAds/delivery.ts:18,107-108`, `src/ui/webAds/choice.ts:9`                                  | ads-off                        | `try`; no storage = advertising off                                                                                                                                                                                                                                          |

**What the child sees when storage fails**: nothing in the way. The only signs are one line in
the foot of the camp panel (`#save-status`, `src/html/battle.html:373`) and one on the home
(`#career-status`, `src/html/home.html:170`). A child who plays an hour with a full or blocked
storage loses that hour at closing, having been told by a status line. A window for the parent
at the first refused write would be the field's answer (important, S–M, new wording: parent's
agreement).

### Every key of `src/storageKeys.ts`

| Key                                                       | Reader                                                  | Bounded                                      | Versioned                           |
| --------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------- | ----------------------------------- |
| `family`                                                  | `readFamilyBackup` (`src/familyBackup.ts:154`)          | 500 000 characters and 1 000 000 bytes       | versions 1–6 + format name          |
| `family-refused`                                          | none (on purpose)                                       | **no**: the raw text                         | no                                  |
| `camp`                                                    | `decodeCheckpoint` (`src/checkpoints.ts:406`)           | 100 000                                      | versions 1–16                       |
| `progress`                                                | `readCareerState` (`src/progression.ts:77`)             | 250 000                                      | `version: 1`                        |
| `voyage`                                                  | `validateVoyageLog` (`src/voyageStorage.ts:44`)         | 2 000                                        | `version: 1` + voyage rules version |
| `recruitment-reminder`                                    | inline (`src/ui/recruitmentReminder.ts:20-34`)          | **no** (items ≤ 96, list ≤ 64 after parsing) | no (a list)                         |
| `mission-done`                                            | inline (`src/missionDone.ts:30-36`)                     | 32                                           | no (a mark)                         |
| `endless-records`                                         | `readRecords` (`src/endlessRecords.ts:48`)              | 2 000, 5 lines                               | `version: 1` + rules per line       |
| `expedition`                                              | `validateExpeditionLog` (`src/expeditionStorage.ts:28`) | 100 000                                      | `version: 1` + expedition version   |
| `players`                                                 | `validatePlayers` (`src/players.ts:130`)                | 2 000, 4 players                             | `version: 1`                        |
| `player-chosen`, `language`, `sound`, `visual`, `ads-off` | exact values                                            | yes                                          | the key's `:v1`                     |

Every reader that matters is bounded and versioned; anything unexpected is refused whole.
**This is well above the usual level** for a browser game.

### Atomicity and previous copy

- One save is one `setItem` of one text (`src/familyPersistence.ts:80`). A browser does not
  expose a half-written value: a crash during the write leaves the old text or the new one.
  What can be lost is the last write if Android kills the WebView before it reaches the disk
  (already listed as out of the code's reach).
- The text written is **read back before it is written** (`src/familyBackup.ts:217-229`): the
  game never stores a file its own reader refuses. Confirmed by probe: a purse of 10 000 001
  coins, 1 000 001 kills or 1 001 kings produce a camp that `encodeCheckpoint` writes and
  `decodeCheckpoint` refuses; `writeFamilyBackup` then returns nothing and the stored file
  stays as it was.
- **F2 — No previous copy** (important, S–M). There is one generation of the family file. A
  save that is valid but wrong (a bug that resets stars, a wrong import) replaces the good one
  for ever. Field practice for local saves is two slots: copy the last good text to a second
  key at start-up or before an import. The storage has room: a full camp of 220 allies is
  18 500 to 21 500 characters (probe), a whole family file a few tens of thousands; four
  players with two copies stay far under the usual 5 million characters.
- **F3 — All or nothing** (important, M). `readFamilyData` refuses the whole file when any part
  is refused (`src/familyBackup.ts:112-115`). Probe: a file with stars `[3, 2, 1]` whose camp
  has one wrong number reads as nothing — stars, missions and albums go with the camp. The
  text is put aside (`family-refused`) but the game never reads it and offers no way back
  (stated as a limit on 21 November). The expedition log already does better
  (`src/expeditionStorage.ts:55-58`: "an expedition that cannot be read is lost, its record is
  not"). The same for the family file — keep what reads, drop the camp — and a button for the
  parent to export the text put aside, would close the gap.
- **F4 — Unlike the family file, the other keys have no copy put aside** when they cannot be
  read: camp, career, expedition, voyage, records, players (table above). For the first two
  the family file is the authority; for the expedition, the records and the list of players
  nothing protects a text written by a later version or damaged (important with F3, S once R1
  exists). Probe (`probes/players.ts`): records stored as « version 2 » read as an empty list,
  and one new game leaves a single line in the key — the old text is gone.
- **F5 — Players** (mineur, S): after an unreadable list, a new player 2 inherits the old
  player 2's adventure (confirmed by the same probe: the new player reads the former
  player's records) (`src/players.ts:219-220`, `src/ui/playerList.ts:109-112` never clears
  the keys of a number before giving it).
- Two tabs of the same player: last writer wins on every key but the list of players (the only
  `storage` listener is `src/ui/players.ts:58`). Known, untested.
- The site on iPhone/iPad: Safari deletes script-written storage of a site not visited for
  seven days of use. Nothing in the code can prevent it; `navigator.storage.persist()` is not
  asked on other browsers either (0 occurrence). The family file is the only protection
  (observation; a line for the parents' page is a wording decision).

## 2.4 Determinism

- Randomness in the rules: one source, `nextRandom` (`src/engine/state.ts:95-98`) over
  `src/seededRandom.ts`. **No `Math.random` in any rule module.** The only one is the choice of
  a sound variant (`src/audio/samples.ts:90`).
- Seeds of new games: `crypto.getRandomValues` (`src/session.ts:9`, `src/ui/missionWords.ts:7`).
- Time: no `Date.now` in `src/`. `performance.now` only in the interface and the board
  (`src/ui/rewardControls.ts:39-40`, `src/ui/adventureControls.ts:47,50`,
  `src/render/missionAssets.ts:156,183,191`, `src/render/BattleScene.ts:249,288-289`); `new
Date` only in the developer's meter (`src/render/devPerformance.ts:117`).
- The clock: fixed steps of 1/30 s (`src/session.ts:8,90-93`), a frame cut at 0.1 s
  (`:89`), a step cut at 0.05 s (`src/game.ts:72,655`), invalid durations ignored
  (`src/session.ts:87`, `src/game.ts:654`).
- **What can make a replay differ**: the rules use `Math.hypot` (20 calls) and `Math.sin` (7,
  all in `src/routes.ts:21-66`); their last digit is left to each browser's engine. The same
  departure code may give another game in Firefox or Safari than in Chrome or the Android
  application. Never tried (the project says "Chromium only"). Nothing a child loses: a code
  shared between a phone and an iPad may simply not be the same game (observation).

## 2.5 Numbers that grow

| Thing                       | Limit                                                                                                 | Can the endless adventure reach it?                                                                                                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Allies in a camp            | `UNIT_LIMIT` 512 (`src/checkpointUnits.ts:16`)                                                        | No: the ground holds 220 (probe, 4 px sweep)                                                                                                                                                            |
| Camp text                   | 100 000 characters                                                                                    | No: 21 500 at most                                                                                                                                                                                      |
| Coins                       | `GOLD_LIMIT` 10 000 000 (`src/gameConstants.ts:49`)                                                   | Not in practice (12 coins a snake, `src/engine/outcome.ts:17`), **but nothing stops the purse**: `src/engine/outcome.ts:25,63` add without a ceiling; only the reward cards cap (`src/game.ts:431,472`) |
| Numbers given to fighters   | `ENTITY_ID_LIMIT` 10 000 000                                                                          | No (a few hundred a round)                                                                                                                                                                              |
| Snakes beaten, eggs hatched | 1 000 000 each, **typed in the reader only** (`src/checkpoints.ts:209-210`)                           | No (thousands of rounds)                                                                                                                                                                                |
| Kings                       | `KINGS_LIMIT` 1 000 (`src/endless.ts:85`), not checked when a king falls (`src/engine/outcome.ts:88`) | No: life ×1.45 a king; the measures say 1 to 5 kings                                                                                                                                                    |
| Cards taken                 | 3 a round (`src/rewards.ts:160`)                                                                      | grows with the kings, bounded by them                                                                                                                                                                   |
| Life of the snakes          | `1.45 ** kings` (`src/endless.ts:75`)                                                                 | infinite only near 1 900 kings                                                                                                                                                                          |
| Game time                   | `game.time`, a sum of 1/30 s                                                                          | fine for years                                                                                                                                                                                          |

- **F6 — The writer does not know the reader's bounds** (mineur, S). If one of these limits
  were ever passed, the camp would be written by `encodeCheckpoint` and refused by the reader,
  the family file would stop being written, and the only sign would be « Sauvegarde familiale
  invalide : aucune écriture » in the status line. Unreachable today; the cheap answer is the
  same named limits on both sides and a purse capped where coins are added (a cap no reachable
  game meets, so no reference game changes — to be confirmed by the traces).
- NaN and infinity: the readers refuse them (`isNumberIn` requires a finite number,
  `src/plainData.ts:12-13`); the family sync tells them apart (`src/familyPersistence.ts:51-55`).
  The engine itself has no guard in its arithmetic, and needs none while its inputs are read
  this way. 1 560 simulated games without an invalid number were reported on 21 November (not
  rerun).

## 2.6 When something throws

- **F7 — No global handler** (important, S–M). No `error` or `unhandledrejection` listener
  anywhere in `src/` (0 occurrence).
- **A frame that throws stops the board for good.** Phaser 3.90 asks for the next frame
  _after_ the callback returns (`node_modules/phaser/src/dom/RequestAnimationFrame.js:89-97`):
  an exception in `BattleScene.update` (`src/render/BattleScene.ts:246-294`, which runs the
  rules at `:251` and more than a dozen drawing steps) means no next frame, ever. The page stays, its
  buttons answer, nothing moves, and no message is shown. Closing and reopening brings back
  the last camp between two waves (nothing is saved during a fight,
  `src/checkpoints.ts:68-72`), so no progress older than the wave is lost — unless the same
  save throws again at the same place.
- **A start-up that throws** shows « Impossible de démarrer le jeu. Recharge la page. »
  (`src/main.ts:12-17`). `src/bootstrap.ts` is 215 lines of top-level statements: one
  exception (an element missing, the graphics context refused) and the home never appears, so
  **the parent cannot reach "export the family file"**. If the cause is in the stored data,
  reloading gives the same screen; the only way out is clearing the application's data, which
  deletes the save.
- Is there a way for the family to recover without losing the save? **When the home shows:
  yes** (parents' page, export). **When it does not: no.**
- Field practice, all local, no network: a handler that shows a child's sentence and a
  « Recharger » button; a `try` around the frame that pauses the game instead of freezing it;
  and on the start-up failure screen a button that downloads the raw stored texts — "start
  again without losing anything".

## 2.7 TypeScript

`tsconfig.json`: `strict`, `noUnusedLocals`, `noUnusedParameters` on. Off, with what turning
each on would cost today:

| Flag                                 | Errors | Comment                                                                         |
| ------------------------------------ | -----: | ------------------------------------------------------------------------------- |
| `noFallthroughCasesInSwitch`         |      0 | free                                                                            |
| `noImplicitOverride`                 |      1 | `src/render/`                                                                   |
| `noImplicitReturns`                  |      5 | 4 in `src/ui/`, 1 in `vite.config.ts`                                           |
| `erasableSyntaxOnly`                 |      5 | `src/render/`                                                                   |
| `exactOptionalPropertyTypes`         |     20 | 8 tests, 4 `i18n`, 3 rule modules                                               |
| `noPropertyAccessFromIndexSignature` |    595 | not worth it                                                                    |
| `noUncheckedIndexedAccess`           |  1 242 | 944 in tests, 298 in `src/` and `deploy/` (72 in rule modules, 26 in `engine/`) |

- In `src/` (texts excluded): **0 `any`, 0 `as any`, 0 `@ts-ignore` / `@ts-expect-error`, 0
  `eslint-disable`** (there is no ESLint), 2 `as unknown as`, 146 `as` (35 `as Kind`, 11
  `as RewardId`, 9 `as Kind[]`) plus 74 `as const`, 137 `!`, 19 fields declared with `!:`. In
  the rule modules: 86 `as`, 40 `!`. These match the review's numbers.
- `byId` returns `document.getElementById(id) as T` (`src/ui/dom.ts:9-10`): a missing element
  is a crash at start-up, not a type error; `tests/dom-ids.test.ts` is the guard.
- **Type-checked**: `src/`, `tests/**/*.ts`, `deploy/`, `vite.config.ts`. **Not type-checked**:
  the 11 `scripts/**/*.ts` (they pass today with 0 error; one line in `tsconfig.json` would
  include them — mineur, S) and the **84 `.mjs` files** of `scripts/` and `tests/` (18 600 +
  lines). With `checkJs` they give 2 368 errors, almost all missing types; among them real
  candidates: `scripts/balance-lab.mjs:101` calls a function with 3 arguments that takes none.
  The scripts whose numbers the parent decides on (`balance-modes.mjs`, `caprices-lab.mjs`) are
  in this unchecked part (important for trust in the measures, M to move the players' logic
  into checked `.ts`, as `scripts/lab/players.ts` already is).
- Recommended order: the four cheap flags (11 errors in all) now; `exactOptionalPropertyTypes`
  with them or after; `noUncheckedIndexedAccess` for `src/engine/` and the rule modules only if
  the 98 places are worth a week — the tests already cover those lines at 99 %.

## 2.8 Dependencies

| Package                               | Installed | Latest seen        | Ships to the player             |
| ------------------------------------- | --------- | ------------------ | ------------------------------- |
| `phaser`                              | 3.90.0    | 4.2.1 (major)      | **yes**, 81 % of the JavaScript |
| `@capacitor/core`                     | 8.6.0     | 8.6.2              | not imported by `src/`          |
| `@capacitor/android`                  | 8.6.0     | 8.6.2              | native shell of the APK         |
| `@capacitor/cli`                      | 8.6.0     | 8.6.2              | dev                             |
| `vite`                                | 6.4.5     | 8.3.8 (two majors) | dev                             |
| `typescript`                          | 5.9.3     | 7.0.2 (major)      | dev                             |
| `@types/node`                         | 24.19.2   | 26.6.6             | dev (follows Node 24: correct)  |
| `@playwright/test`, `playwright-core` | 1.64.1    | 1.65.1             | dev                             |
| `prettier`                            | 3.9.10    | 3.10.1             | dev                             |
| `axe-core`                            | 4.14.0    | 4.14.1             | dev, **unused**                 |
| `vite-plugin-singlefile`              | 2.3.4     | 2.3.4              | dev                             |

- 3 runtime dependencies, **one library in the child's browser**. 172 packages in the lock
  file, 5 of them for production, every one with its integrity sum.
- `npm audit --omit=dev`: **0 vulnerability**; with dev: 0. The registry was reachable.
- Phaser 4 was weighed and set aside by the project; Vite 6 and TypeScript 5 are two and one
  majors behind without a known flaw: nothing urgent (observation).

## 2.9 Build and guards

What exists (`.github/workflows/check.yml`): on every pull request and on `main`, `verify`
(format, 933 tests, type check, build, budgets), the Android signature test, `npm audit` at
level high, the browser on the site, the portable file and the Android package, six groups of
browser recipes including the saves of a build-63 tester. `npm ci` from the lock file. Budgets
(`scripts/check-dist.mjs:15-34`): the page under 32 768 bytes, each script under 200 000, Phaser
under 2 000 000, a music under 3 200 000, anything else under 1 500 000, a content hash in every
asset name.

What a release can still get wrong without a check noticing:

- **G1** (important, S) — `deploy-site.yml` publishes **any branch, tag or commit typed by
  hand** after `npm run verify` only (`.github/workflows/deploy-site.yml:34-43`): no browser
  recipe, no check that this commit is on `main` or was green in CI. The safety is the habit of
  typing `main`.
- **G2** (mineur, S) — the budgets are per file: no ceiling on what the child downloads first
  (`bootstrap` + `rules` + `index` + Phaser), on the styles, or on the size of the Android
  package. The first script is 5.7 Ko from its ceiling and the page 328 bytes from its own (the
  project's own numbers).
- **G3** (mineur, S) — nothing runs on a schedule: a flaw published in a dependency is seen at
  the next pull request only.
- **G4** (observation, S) — the actions are pinned by tag (`actions/checkout@v4`), not by
  commit; `deploy-site.yml:45-48` writes the typed reference straight into a shell line.
- **G5** (observation) — the machine and the CI may differ: nothing refuses Node 22 locally
  (`engines` is only a warning). Everything in this audit ran on Node 22.
- **G6** (observation) — no ESLint. With `strict`, zero `any` and Prettier this is a choice,
  not a hole; the rules a linter would add here are few (unhandled promises, `no-floating`).
- Reproducibility: same lock file and same Node give the same build; the asset names carry
  their hash. Not verified by building twice (builds were not allowed here).

---

# PART 3 — What to do with it

## To merge or fix

| Id                                  | What                                                                                                              | Severity             | Effort                      |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------- | --------------------------- |
| F7                                  | Global error handler, a frame that pauses instead of freezing, a way to export from the start-up failure screen   | important            | S–M                         |
| F3, F2, F4                          | Family file: keep what reads when the camp does not; a second generation; a copy put aside for the other keys too | important            | M                           |
| R1 / S1                             | One keyed store (read, bound, validate, write, **one failure policy**) for the eleven stores                      | important            | M                           |
| M02, M10, M14, M17, M08, M09, M20   | Seven tests for the surviving mutants                                                                             | important (group)    | S                           |
| `game.ts:364`, `:465-474`           | Two tests for rule lines no unit test runs                                                                        | important            | S                           |
| F1                                  | Sentences out of the fingerprint (or out of the state)                                                            | important            | S (fingerprint) / M (state) |
| T1–T7                               | The recipes' common module (server, browser, sizes, keys, asset loader, memory storage, mini-page)                | important for upkeep | M–L                         |
| T8                                  | One automatic player for all balance measures, in type-checked `.ts`                                              | important            | S–M                         |
| G1                                  | Publication only from a commit that is on `main` and green                                                        | important            | S                           |
| R8                                  | One `campTouched(game, session)`                                                                                  | mineur–important     | S                           |
| R9, R10, R11                        | `canRepair` / `canTrain` / `canEncourage` / spendable coins / cracked plate asked from the rules                  | mineur               | S–M                         |
| S9                                  | One titled window helper                                                                                          | mineur               | S–M                         |
| R6, R7, R5, R4, R2, S4, S5, S6, S10 | Small single definitions                                                                                          | mineur               | S each                      |
| R12                                 | Six words and one sentence into the catalogues; tighten the test                                                  | mineur               | S                           |
| R14                                 | `--touch-target: 48px`                                                                                            | mineur               | S–M                         |
| F5, F6                              | New player on a clean number; same bounds for writer and reader                                                   | mineur               | S                           |
| 1.5                                 | 6 `export`, 13 types, 7 images (4.15 Mo), `axe-core`, `.reinforcements-open`                                      | mineur               | S                           |
| 2.7                                 | Four cheap compiler flags; `scripts/**/*.ts` in the type check                                                    | mineur               | S                           |
| G2, G3                              | A budget on the first download; a weekly run                                                                      | mineur               | S                           |

## Parallel by design — leave

- The balance revisions 1 to 7, the save versions 1 to 16, the family file versions 1 to 6, the
  expedition versions 1 to 3, the endless version 1, the two path rules: every branch that
  looks like a copy is an old game that must replay as it was.
- The salts of the draws (`src/boons.ts:82`, `src/rewards.ts:71`, `src/missions.ts:222`): three
  formulas, frozen by the codes already given.
- Voyage beside expedition (S2, S3, S12, the two long `bind…`): the voyage is ending.
- French beside English catalogues, and the page template beside the code for the same word.
- One test file per frozen revision (T10), and the tests that retype a value or a format on
  purpose (T13, `tests/storage-keys.test.ts`, `tests/game-constants.test.ts`).
- The tables of data that resemble each other (`data.ts`, `enemies.ts`, `levels.ts`, `art.ts`).
- The same media query written 14 times: CSS has no name for it without a build step.

## Not worth it

- S7, S8, S11, S13, S14, S15, T14, T15.
- The 420 colours and 96 font sizes: an art-direction job, not a cleaning one.
- `noUncheckedIndexedAccess` everywhere (1 242 errors, 944 in tests),
  `noPropertyAccessFromIndexSignature` (595).
- The ten storage port aliases on their own (they go with R1).
- Cutting `bootstrap.ts` or the long `bind…` for their length alone: they are flat lists. Cut
  `bootstrap.ts` only to make `applyFamily` and `recordGame` testable.
- Phaser 4, Vite 8, TypeScript 7 now.

## The 10 repetition items most worth removing

1. **The eleven stores** (S1/R1) — the only repetition that is also a solidity problem.
2. **The recipes' server and browser** (T1, T2): 26 and 33 files.
3. **The automatic player of the measures written three times** (T8).
4. **Storage keys retyped in 27 recipe and test files** (T4).
5. **The asset loader in 18 files and the memory storage in 14 places** (T5, T6).
6. **"This camp has been touched", five writings, five conditions** (R8).
7. **Action conditions restated in the camp panel** (R9, R10, R11).
8. **Six windows built by hand** (S9).
9. **Small double definitions**: `STAR_MAX`/`STARS_MAX`, `freshSeed`, the armour factor, the
   standable place, the landing search, the coins of a gift (R6, R7, R5, S6, S5, S4).
10. **The mini-pages of the recipes** (T7), together with making them load the game's styles.

## The 10 solidity gaps most worth closing

1. **An exception freezes the board or blocks the start with no way to the save** (F7).
2. **A family file is all or nothing, and what is put aside cannot be read back** (F3).
3. **No second generation of the save** (F2).
4. **Expedition, records and players have no copy when they cannot be read; four failure
   behaviours for the same situation** (F4, R1).
5. **Seven surviving mutants**, four of them storage error branches (M02, M10, M14, M17).
6. **Two rule lines of modes children play are run by no unit test** (`src/game.ts:364`,
   `:465-474`).
7. **A sentence changes the fingerprints of the reference games** (F1).
8. **The site can be published from any commit after `verify` alone** (G1).
9. **`src/bootstrap.ts` — the import of a family file, which game is on the board — is reached
   by no unit test**, and 84 script files, including the balance measures, are not type-checked.
10. **A failed save is told by a status line only** (2.3), and the writer does not share the
    reader's bounds (F6).

## What I could not measure

- Anything on a real phone, in the Android WebView, in Firefox or Safari; anything with the
  children.
- The browser recipes, `npm run verify`, every build and the bundle sizes: not run here. Whether
  the recipes cover the two uncovered rule lines, the "part of the file" message (M10) or the
  board's behaviour on an exception is therefore **read, not observed** — the frozen board in
  particular comes from reading Phaser's source, not from a browser.
- Node 24: every number here comes from Node 22.23.4.
- Real `localStorage` behaviour: quota, a refused write on a full device, eviction, two tabs.
- Whether the same departure code gives the same game in two browser engines.
- The 1.5 million damaged saves, 570 replayed games and 1 560 simulated games reported by the
  earlier bilans: taken as stated, not rerun.
- Cyclomatic numbers are my own count (branches and `&&`, `||`, `??`), not a standard tool's.
- The English interface for the words left in code (R12): not looked at on screen.
- The unused-image list is by file name; an image reached by a name built at run time would be
  a false positive (I excluded the two folders loaded by pattern).

## Earlier statements checked

Confirmed by my own measure: zero `any`; 137 `!` and 146 `as` (review: 138 and 149); 1 256
texts, none unused; one style selector without element; no rule module touching the browser;
25 functions over 60 lines; « partie finie » written once in `src/` (`src/game.ts:75-76`);
`BOON_RULES[1]` once; ten million named in one file; 0 known vulnerability; six images never
shipped still in the tree.

Not quite as stated: the armour factor still has one writing outside `boons.ts`
(`src/engine/state.ts:165`); lot 4 added `STARS_MAX` beside an existing `STAR_MAX`; "no
identical rule repeated" in the styles is 11 small families (0.8 %); `readMedical` and
`isRoster` still bypass the shared guards; the recipes' pages still do not load the game's
styles; « playwright-core imported by 19 files » is now declared, but `axe-core` is declared
and imported by none.

Repository state at the end: `git status --porcelain` empty; `git worktree list` shows the main
tree only.
