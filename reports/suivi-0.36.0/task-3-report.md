# Task 3 — Caprices preparation, friends, notebook, results

Status: **DONE** — commit `493904adeea95be6a78723ea583d0813897c68ae`. Fresh independent task review remains with root.

Branch: `feat/caprices-interface`  
Task BASE: `e76de2118890a4feccf97d3e0eca0eb7524bfacf`  
Scope: Task 3 only, continuing the interrupted implementation. Tasks 1 and 2 were already complete and were not reimplemented. No push, merge, publication, package/version change, schema/model edit or subagent dispatch.

## Implementation

- Two preparation rows use the exact French `CAPRICE_SET_NAMES` and all 36 existing definitions. Stars, lock state and code launch use shared progression plus the existing caprice gate. Normal mission, select/deselect, previous departure, reroll and retry preserve the appropriate run identity.
- Optional zero/partial/full friend choices happen before the new Game is attached or saved. Available choices exclude the hero and reflect mission unlocks/healer restrictions. Initial clubs are unchanged. Choice buttons reuse the existing unit portraits, paper palette and 48 px targets. The dock, full catalogue and quick favorites read `capriceAllows` and the actual spendable purse.
- `capriceLaunch.ts` validates the proposed run and nonempty choice set before touching retained progress/camp/owner. Empty choices deliberately skip `chooseCapriceKinds`. A rejected launch leaves the preparation open.
- Production bootstrap syncs the old game before capturing the new active notebook owner. Retained A ownership survives profile selection B, classic mode, reload, resume and retry; a new preparation launch captures B. Shared mission stars keep existing `MissionProgress.record` semantics. Sticker recording is separate and idempotent for the Game that won.
- Home and caprice results open a 36-slot notebook. Add/rename/select use raw local names; active choice is also visible in preparation. Result opens the retained owner's book. Nodes are created once; hidden books avoid repeated rendering and preparation rows cache mission/stars. Dialog uses the existing pause lease and restores keyboard focus. A sticky notebook header keeps its title and 48 px close control accessible after scrolling.
- Complete caprice victory shows the actual locally drawn paper sticker, exact French caprice name, status and a styled notebook button. Defeat preserves the exact original announcement as a protected French leaf. Repeat wins report an existing sticker. No caprice result promises a next normal mission.
- Reserve HUD keeps total gold and separately displays the protected bank/spendable amount. Free recruitment, paid recruitment, repair (80) and training (90) all use `gold - reserve`. No-honey commands/help reflect the existing flag.
- Final-wave caprice king previews replace the last planned snake without adding a classic court. Advice excludes forbidden healers. Shell snakes use a larger visual silhouette and an original matte procedural shell with the existing enemy contour; no logical size/collision/health/RNG changes.
- English surrounding labels/explanations/statuses are registered in the new caprice dictionary. All names/announcements and row names remain exact French; DOM protection is on leaves, never entire cards/dialogs. The identity dictionary also covers canvas/metadata. Import preview explicitly explains envelope-4 notebook replacement and old-envelope empty-book replacement, with raw local names.

## TDD and debugging evidence

Inherited interruption artifacts were read before changing the work:

- `task-3-red.log`: readout test initially failed because the new caprice view did not exist.
- `task-3-launch-red.log`: narrow transactional launch test failed before `capriceLaunch.ts` existed.
- `task-3-help-red.log`: real assertion failure showed no-honey help still promised a free pot; corresponding green log records the correction.
- `task-3-locale.log`: inventory rejected missing `Réserve bancaire protégée ·`; current inventory is green.
- `task-3-model-green.log`, `task-3-targeted.log`, `task-3-help-green.log`: earlier focused progress only, not the final full suite.

Recovery regression work:

- `task-3-visual-red.log`: browser assertion reproduced the earned result's missing actual SVG graphic. The corrected result reuses the notebook's local medallion, exact French name, and paper button style.
- Added portrait assertions and notebook-close reachability checks after full scroll in every landscape viewport, with captured evidence.
- Added a loss/locale regression. `task-3-loss-locale-red.log` shows switching to English removed the protected French defeat leaf. Root cause was the wrapper's stale whole-node copy binding. The fix uses existing `setMarkup` to retire that binding before installing the raw leaf; no change to the translation engine or game.
- `task-3-bank-mobile-red.log`: compact HUD hid the new bank readout via its existing `.resource small` rule. An ID-specific readout rule restores it. `task-3-bank-total-red.log` then caught the 568×320 total being pushed above the viewport; the total and bank now share the existing 24 px resource row, without adding a HUD row/overlay. Both are browser regression assertions.
- A focused run caught a temporary static asset import leaking into pure model tests. Portrait styling is now injected by the existing expedition binder, preserving the DOM/rules test separation; focused tests passed again.
- The first broad browser continuation reached the played native win and desktop matrix, then used desktop `#menu-home` on a mobile layout. The test now uses the actual visible desktop/mobile Home button. This was a recipe selector issue, not a gameplay change. The bank fixture also needed the actual visible desktop catalogue entry instead of its hidden mobile toggle. Downstream selector/layout iterations used `CAPRICES_SKIP_NATIVE=1`, explicitly separate from the final no-skip native proof.

## Verification

Final verification (all commands completed with exit 0):

- `npm run verify`: **502/502 tests**, formatting, TypeScript, production build and budgets passed. Full output: `task-3-verify.log`.
- `env -u CAPRICES_SKIP_NATIVE node scripts/caprices-036-browser.mjs`: **185 checks, 29 captures, zero page errors**, `nativePlayed: true`; full recipe including real native A win and all downstream states passed. Full output: `task-3-browser-final.log`; machine report: `artifacts/caprices-036/report.json`.
- The last downstream-only iteration used `CAPRICES_SKIP_NATIVE=1`: **172 checks, 28 captures, zero errors**, explicitly `nativePlayed: false`. It is debugging evidence, not the native production proof. Full output: `task-3-browser-iteration.log`.
- Locale inventory/check passed: **912 inventoried phrases, 943 English entries, zero missing** (`task-3-inventory-final.log`, `task-3-locale-final.log`).
- `git diff --cached --check` passed before the explicit-path commit. Exactly 30 Task 3 files were committed.
- Final recipe cleanup removed `.caprices-036-fixture.html`. No test server is retained.

Already observed in this recovery:

- Focused `node --experimental-strip-types --test tests/caprice-readouts-036.test.ts`: 7/7 passed. These are seven Task 3 tests, separate from the existing 12 tests in `tests/threat-preview-036.test.ts` and the final total suite.
- `npm run verify`: first complete run passed 502/502 tests, formatting, types, production build and asset budgets. The final run above includes the defeat-locale and compact-bank corrections.
- `npm run test:browser`: desktop/mobile production baseline passed, zero page errors.
- `npm run test:missions`: existing mission flow passed, including checkpoint 7/no-caprice expectations and exact envelope 4 + real albums assertion.
- Locale extract/check: 912 inventoried phrases, 943 English entries, zero missing, zero additional parameters.
- Frozen SHA256 values for `src/game.ts`, `src/caprices.ts`, `src/missions.ts` match `/workspace/caprices-ui-catalog-baseline.json`; all 36 catalog entries deep-equal that frozen baseline.
- Production budget: HTML 31,771 bytes; bootstrap 138,539 bytes, rules 81,912 bytes, Phaser 1,481,792 bytes. All budget checks pass. No index HTML growth.
- `git diff --check`: clean.

## Browser evidence and honest limits

The caprice recipe labels injected valid family progression/profile data as controlled. Ownership is exercised through the real production bootstrap and native menu, launch, profile, classic, reload, resume, retry and new-launch controls. The native clock drives an unchanged real Scene/Game through three waves from refuge seed 42 with the initial trio. The observed win was **73% crystal health and two stars**, not 100% or three stars. A receives its sticker while B is active; retry retains A and the next newly prepared launch captures B. `native-owner.json` records the resulting real envelope.

The readiness/defeat/repeat/pause cases are explicitly controlled test fixtures. Shell captures use an actual engine-spawned third snake, then freeze advance only for render comparison. They do not claim a child's natural playthrough or change production rules. No production test hook is introduced. The test does not grind 36 real games; existing engine/album/serialization tests cover the full catalog and repeat/win/legacy behavior.

Requested viewports: 1280×800, 1366×768, 812×375, 780×360, 568×320 with safe margins; 375×812 portrait instruction. French and English are covered. Preparation footer controls are measured on screen at ≥48 px. Notebook close is measured after full scrolling; screenshots show the sticky header. The portrait screen retains its rotate instruction.

Artifacts: `artifacts/caprices-036/` contains production A win, per-language preparation/portrait/notebook captures, controlled reserve and Canvas/WebGL shell captures, full native envelope and machine-readable report. The final report enumerates 29 captures, including one native production win, 10 preparation views, 10 scrolled notebook views, two portrait views, one English notebook view, three controlled bank views and Canvas/WebGL shell captures.

## Files and self-review

Production integration: `src/bootstrap.ts`; UI `battleDock`, `battleResult`, `campToolModel`, `controls`, `dockModel`, `expeditions`, `familyControls`, `feastControls`, `hud`, `missionPreview`, `squadControls`, `threatControls`, `threatPreview`; renderer `actors`, `resultCopy`.

New UI/render modules: `src/ui/capriceAlbums.ts`, `capriceBudget.ts`, `capriceCopy.ts`, `capriceLaunch.ts`, `capriceSpeech.ts`, `capriceView.ts`, `caprices.css`; `src/render/capriceShell.ts`; `src/i18n/dictionaries/caprices.en.ts` wired by `english.ts`.

Tests: `tests/caprice-readouts-036.test.ts`, `tests/caprices-036-harness.ts`, `scripts/caprices-036-browser.mjs`, narrow envelope expectation update in `tests/missions-021-browser.mjs`.

Self-review checked owner sequencing, invalid launch transaction, idempotent old-game award, legacy import replacement and storage failure, reserve/free thresholds, forbidden versus future allies, French leaf scope, normal mode compatibility, stable notebook/row nodes, rendering pool lifecycle and exact frozen engine/catalog. The live locale regression above was fixed under a failing browser test. Root will perform the fresh task review; this report is the implementer's self-review, not a substitute for it.

No approval question is needed within the authorized Task 3 scope. No new product decision/rule was introduced. No unresolved Critical/Important or deferred minor was identified by self-review. Local French speech is optional and no installed French voice was available in headless Chromium; actual audio playback and physical-device behavior are not claimed. All device evidence here is browser emulation.

## Task 3 review correction R1 — 2026-11-09

Continued the interrupted seven-file R1 work on BASE `493904adeea95be6a78723ea583d0813897c68ae`; no Task 1/2 or other product scope was reopened. **DONE — commit `23bd5f1` (`fix: refresh caprice scouting for pending friends`)**. Explicit-path commit contains only the seven R1 source/test files; final working tree is clean. `git diff --cached --check` passed before committing. No test server or generated `.caprices-036-fixture.html` remains.

- `missionScouting.ts` constructs an isolated proposed Game, applies a nonempty pending choice through the real `chooseCapriceKinds`, then reads `isUnlocked` and `capriceAllows` for both scouting advice and the generic flying-enemy plan. Empty choices skip the method; partial choices keep the engine's remaining availability. The selected full Ninja + Medic pair yields Ninja advice and a flying warning without unavailable counters. Normal-mission plan copy remains unchanged.
- Selection and deselection callbacks refresh preparation scouting immediately, including the generic plan. Initial clubs and the retained Game remain untouched. The two new flying-plan phrases and the internal validation error have explicit English inventory entries. French caprice names/announcements remain exact.
- The inherited `task-3-r1-model-red.log` records the actual full-selection mismatch (7 pass, 1 fail); `task-3-r1-model-green.log` records 8/8 after the fix. `task-3-r1-browser-red.log` records stale Archer advice after selecting Ninja + Medic. Those failing runs were read, not recreated by reverting completed work.
- The inherited file named `task-3-r1-browser-green.log` is **not green evidence**: it failed the partial generic-plan assertion. Recovery reproduced that failure in `task-3-r1-browser-recovery.log` before replacing that log with the final successful run. Cause: `#mission-plan` is under a closed parent disclosure, so `innerText` was empty; the previous full negative assertion was also weak. The browser now clicks the real parent summary and first requires visible flying-plan text, then checks full/partial advice and plan contents in French and English. No production UI change was needed for that recipe issue.

Fresh recovery commands and results:

- `node --experimental-strip-types --test tests/caprice-readouts-036.test.ts`: **8/8 passed**, 0 failures (`task-3-r1-model-recovery.log`).
- `CAPRICES_SKIP_NATIVE=1 node scripts/caprices-036-browser.mjs`: **192 checks, 30 captures, zero page errors**, `nativePlayed: false` (`task-3-r1-browser-recovery.log`, `artifacts/caprices-036/report.json`). Includes empty, partial, full Ninja + Medic, deselected/cleared choices, live advice refresh, visible generic plan, exact French announcement and unchanged retained Game in both languages. Added `r1-advice-full-fr.png` and `r1-advice-full-en.png`; self-review visually inspected the English visible generic plan.
- Locale inventory initially identified the new internal error string; it now follows the existing explicit English-identity convention. `node scripts/extract-locale-035.mjs` and `node --experimental-strip-types scripts/check-locales-035.mjs`: **915 inventoried phrases, 946 English entries, zero missing, zero added parameters** (`task-3-r1-locale-recovery.log`).
- `npm run verify`: **503/503 passed**, zero failed/skipped, formatting, TypeScript, production build and budgets passed (`task-3-r1-verify.log`). HTML remains 31,771 bytes; bootstrap is 139,024 bytes; rules bundle is 81,921 bytes; Phaser is 1,481,792 bytes.
- Standard `npm run test:browser`: **passed**, desktop/tablet/mobile production baseline with `pageErrors: []` (`task-3-r1-browser-baseline.log`, exit 0). The first attempt overlapped verification's replacement of served `dist` files and timed out waiting for the tablet canvas at `tests/browser.mjs:177`; its failure is preserved as `task-3-r1-browser-baseline-overlap.log`. The sequential rerun against the completed build passed without any product change.
- `git diff --check` passed. No diff for `src/game.ts`, `src/caprices.ts`, `src/missions.ts` against either R1 BASE or frozen `c886b82`.

The native waves were intentionally not rerun for R1. The previous 185-check/29-capture `nativePlayed: true` proof is preserved separately in `task-3-r1-prior-native-report.json` and the original `task-3-browser-final.log`; the current artifact report is explicitly the new skipped-native run. The later full release verification belongs to Task 4. No new natural-play, physical-device or audio claim is made. No rule, schema, model, version/package, launch gate, push, merge or publication changed. Scoped independent re-review remains with root.
