# Task 2 — carnets et enveloppe familiale

BASE: `5b0b19c` on `feat/caprices-interface`. Implemented only the five owned source/test paths. Root's uncommitted plan/spec changes are deliberately excluded from the task commit. No engine/catalogue/mission changes, browser/server, network, push, merge or subagents.

Completed commit: `dc94fc8` — `feat: persist separate child caprice albums in family backups` (five owned paths, 587 insertions/19 deletions). Frozen engine/catalogue/mission paths verified unchanged against BASE. After commit, only root's two plan/spec files remain modified.

## Result and exact APIs

- `src/capriceAlbums.ts`: exports `CapriceAlbum = { id: string; name: string; completed: string[] }` and `CapriceAlbums = { version: 1; activeId: string; nextId: number; campProfileId: string | null; children: CapriceAlbum[] }`.
- `createCapriceAlbums()` returns one `child-1` album named `Mon carnet`, `activeId: 'child-1'`, `nextId: 2`, null owner and no stickers.
- `validateCapriceAlbums(value: unknown): CapriceAlbums | null` reconstructs defensive plain data. One to eight children, generated-style unique `child-N` IDs with safe positive integer suffixes, safe monotonic `nextId` beyond existing IDs, valid existing active/owner references (owner may be null), names of 1–24 UTF-16 code units with non-whitespace content and no C0/C1 controls, up to 36 unique known caprice IDs. Names are retained verbatim, never translated or interpreted as HTML. Unknown fields are omitted.
- `createCapriceAlbumsController(initial?: CapriceAlbums)` validates initial data or defaults. `.state` returns a deep snapshot. `add(name): string | null` creates and selects a new album; `select(id)`, `rename(id,name)`, `beginRun(profileId = activeId)`, `record(game)`, `replaceState(state)` return booleans. Invalid operations preserve state. `has(capriceId, profileId = activeId): boolean` reads that child's sticker set.
- `beginRun` captures the retained expedition owner; selecting/adding another album never changes it. Classic mode never invokes ownership mutation inside these modules. `record` requires a valid caprice mission, complete won final wave, positive base, empty enemies/eggs and a non-null existing owner; normal games, losses, partial/inconsistent wins and repeats earn no sticker. It does not change money, stars, Game or RNG.
- `writeFamilyBackup(camp, career, missions?, albums?): string | null` emits v4 only when both validated missions and albums are supplied. Old signatures keep existing v1/v2/v3 behavior. FamilyBackup's union exposes `.albums` as absent on old versions and required on v4.
- `family.sync(camp, career, missions?, albums?): boolean` preserves previously loaded/successfully saved missions and albums when omitted. Explicit import of valid v1/v2/v3 replaces data and clears old albums. v4 imports require missions and valid albums. Old versions with any explicit `albums` field reject instead of silently dropping collections, including live `albums: undefined` before JSON could hide it.
- Same authoritative key and a single `setItem` for the complete envelope. Failed validation/quota writes do not update the retained state or persistent data. Existing character/UTF-8 limits remain in force.
- `missionProgress.ts`: run identity now includes `caprice`, and `started` enforces the existing `capriceUnlocked` tier helper. All existing shared bestStars credit remains intact, including caprice victories, per root's corrected brief. Last/retry runs preserve actual caprice identity.

## TDD evidence

1. Initial mission tests RED: missing tier gate (`true !== false`) and the original brief's no-star-credit assumption (`3 !== 1`). Gate/identity implementation became GREEN with the existing mission tests (5/5).
2. Albums tests RED: four assertions that the controller module was absent. Implemented the module; six task tests GREEN. Missing-module assertion was subsequently refactored to a normal static import.
3. Family tests RED: existing family writer emitted v3 instead of v4, v4 reader failed, old caller lost albums, and malformed-v4 input was silently accepted as old data. Evidence: `task-2-family-red.log` (6 pass, 4 fail). Implemented v4 and retained albums.
4. Root corrected the shared stars requirement while this task was running. Changed the test to require existing shared credit; watched RED (`1 !== 3`) against the temporary exclusion, then restored original record behavior and watched GREEN. No star exclusion remains in the final diff.
5. A family2 test fixture initially included new refuge rules2, which the historical v2 reader correctly rejects. Investigated `readMissionRun` and the unchanged tutorial guard, removed the rules property from that historical fixture, and retained the compatibility rules. The TypeScript status narrowing in the real-game loop was resolved with a test-only status reader.
6. Self-review strengthened invalid-win tests to use fresh owners so a previously earned sticker could not mask a guard defect. Added a NaN-base guard case and live legacy `albums: undefined` import case; watched both RED (`task-2-review-red.log`, 9 pass/2 fail), then fixed the positive-base check and pre-serialization version guard. Final task file: 11/11 GREEN (`task-2-targeted.log`).

## Coverage and verification

Eleven tests in `tests/caprices-albums-036.test.ts` cover shared star credit, caprice star thresholds and retry identity, independent child sets, owner retention, actual deterministic engine victory at refuge/petit/seed42, refresh duplicates, losses/incomplete wins/normal wins/enemies/eggs/zero or NaN base, album bounds and immutable snapshots, corrupt IDs/refs/names/stickers, 36-sticker import, v1–v4 readers and default migration, retained owner A after selecting B/classic/save/reload/resume, omitted old sync calls, explicit old replacement, malformed v4, blocked storage, atomic write count and live malformed-version imports.

- Full `npm test`: **495/495 passed**, 0 failed/cancelled/skipped/todo, exit 0, approximately 20.30 s. Log: `task-2-full-test.log`.
- `npm run build`: **passed**, exit 0; includes TypeScript and distribution checks, Vite 8.80 s. Log: `task-2-build.log`.
- No build warnings/errors. Distribution checks pass; rules chunk 80,671 bytes, bootstrap 124,673 bytes, entry 10,011 bytes, English 65,681 bytes, Phaser 1,481,792 bytes (raw), existing asset budgets accepted.
- Owned-path Prettier check and `git diff --check`: passed.
- Final targeted run after tightening normal-victory rejection: **11/11 passed**.

## Self-review and integration notes

Read the complete owned diff and new files against the corrected brief and compatibility/owner/import focus. Fixed both important edge findings by RED→GREEN above. No unresolved implementation findings or deferred minors.

UI responsibilities remain explicit: synchronize the old Game before capturing a new expedition owner; call `beginRun` for a new expedition, never ordinary retry/resume/classic starts; on legacy restore only initialize an owner when none exists. Persist controller snapshots together in the one family envelope. The controller intentionally cannot infer which child historically owned a legacy camp. Browser/mobile/end-to-end integration is outside this task and was not run, as requested by root.

Root rulings followed: original no-star-credit requirement was withdrawn; existing shared credit is preserved. Deterministic string IDs/default label/add-select behavior were confirmed by root. No independent scope changes.
