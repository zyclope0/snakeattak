# Task 3 R1 — scoped independent re-review

Reviewed 2026-11-09. BASE `493904adeea95be6a78723ea583d0813897c68ae`; HEAD `23bd5f14cfe718207645cf97b3ea5c6f621babca`.

- **R1: ADDRESSED.**
- **Spec verdict: approved within this R1 scope.**
- **Quality verdict: approved within this R1 scope.** No new actionable breakage identified in the seven-file correction diff; no blockers.

## Evidence and reasoning

- `src/ui/missionScouting.ts:8` constructs a separate proposed Game, skips `chooseCapriceKinds` for empty choices, applies nonempty choices through the real engine method, and uses `isUnlocked` plus `capriceAllows` for both advice and flying-counter availability (`:11`, `:13`, `:26`). This preserves the engine's empty/partial/full semantics rather than maintaining another UI rule implementation. Full Ninja + Medic has no available flying counter, so the generic plan retains only the warning (`:22`); advice falls through to the permitted Ninja. Normal mission plan copy remains at `:19`.
- `src/ui/capriceView.ts:159` calls the refresh callback after both selection and deselection. `src/ui/expeditions.ts:64` forwards the pending set, and initial/reopened previews pass `preparation.chosen()` at `:122`. `src/ui/missionPreview.ts:129` updates the generic plan alongside advice at `:139`.
- The proposed Game is local to the helper; it does not receive or replace Session/Game state. The unchanged constructor creates its own unit arrays/IDs/RNG and initial two clubs plus hero (`src/game.ts:123`, `:128`, `:149`, `:163`). Neither selection nor scouting calls a method on the retained Game. Initial-party rendering remains the same trio (`src/ui/expeditions.ts:125`). The exact BASE-to-HEAD diff has no changes to `src/game.ts`, `src/caprices.ts`, or `src/missions.ts`.
- `tests/caprice-readouts-036.test.ts:145` compares empty, partial, full and cleared choices to a real Game, checks advice/counters, unchanged run input and two initial clubs. `scripts/caprices-036-browser.mjs:127` exercises actual preparation buttons in French and English, opens the plan disclosure before checking visible text (`:153`), checks full-selection exclusion, deselection/clearing refresh and unchanged retained Game serialization (`:185`). This corrects the prior weak hidden-text assertion.

Recorded evidence inspected, without rerunning it:

- `task-3-r1-model-recovery.log`: 8/8 passed, zero failures/skips.
- `task-3-r1-browser-recovery.log` and `artifacts/caprices-036/report.json`: 192 checks, 30 captures, zero errors, explicitly `nativePlayed: false`.
- `task-3-r1-verify.log`: 503 passed, zero failures/skips; formatting, TypeScript, production build and budgets completed.
- `task-3-r1-browser-baseline.log`: standard desktop/mobile browser baseline completed with `pageErrors: []`.
- `task-3-r1-locale-recovery.log`: 915 inventoried phrases, 946 English entries, zero missing/added parameters. The changed dictionary supplies both new plan phrases.

## Limits

This was a read-only source/diff and recorded-evidence review limited to R1 and new breakage in its fix. Constructor/availability dependencies were inspected only to assess isolation and engine semantics. No suites or servers were rerun; test results above are recorded evidence, not fresh independent executions. The current browser run skips native combat and does not establish a new played win; previous native proof remains separate. No physical-device, audio or exhaustive selection-combination claim is made. No product file, index or commit was changed; only this requested review report was written.
