# Task 1 report — checkpoint/code compatibility

Status: DONE
Base: 6818589
Branch: feat/caprices-interface

## Implementation

- A mission with a caprice now writes checkpoint8 and an explicit capriceKindsChosen array. Missions without a caprice retain exactly their previous checkpoint format/bytes.
- Checkpoint8 requires a valid caprice-bearing MissionRun and an explicit array of choices. The array can be empty; nonempty choices are restored through Game.chooseCapriceKinds, which enforces the catalog/mission unlock rules, uniqueness, no hero and caprice limits. Empty arrays never invoke chooseCapriceKinds.
- Partial choices preserve capriceAllows behavior: other kinds remain available until the engine limit. Initial clubs are retained and never inferred as choices. Choices survive even when all recruited units of their kinds have died.
- Checkpoints1–7 remain readable. Existing caprice-bearing6/7 camps retain empty-choice legacy behavior, with no reconstruction from survivors/start units/dead units.
- Code3 is emitted only for caprice missions: MOT-3-AAAA-BBBB-S1-CC (S/C for set, 1/2/3 for tier), with eight base32 payload digits encoding seed*256 + configuration +128 for rules2. The checksum includes the complete payload/rules flag and suffix. Mission, rules, seed, layout, assault, nest and caprice roundtrip exactly.
- Old code1/2 emission remains byte-identical and decoding produces no caprice. No profile/name/notebook or ally choices appear in departure codes.
- No engine rule/value/RNG changes. git diff c886b82 -- src/game.ts src/caprices.ts src/missions.ts is empty.

## Files

- src/checkpoints.ts
- src/departures.ts
- tests/caprices-persistence-036.test.ts (11 tests)

Only these three owned files are committed. This report and verification logs remain in the ignored task workspace.

## TDD evidence

Before production edits, captured historical checkpoint SHA-256 fixtures and exact departure1/2 strings from the baseline. Added the new tests and observed the final RED run: 11 tests, 5 passed, 6 failed. Failures demonstrated missing checkpoint8, lost choices (including choices with no surviving corresponding units), missing caprice suffix, and accepted silent downgrade. A preliminary recruitment fixture used a blocked coordinate; corrected it to use real placementSuggestions before saving the final RED evidence.

Implemented the minimal checkpoint/departure changes, then observed GREEN: 11 passed, 0 failed. Re-ran targeted tests after formatting: 11 passed, 0 failed.

Commands and retained logs:

- node --experimental-strip-types --test tests/caprices-persistence-036.test.ts — RED: 5/11 passed, 6 expected failures; task-1-red.log.
- Same targeted command — final GREEN: 11/11 passed; task-1-green.log.
- npm test — once, 484/484 passed, 0 failures/skips; task-1-suite.log.
- npm run build — once, exit0; typecheck, Vite production build and size-budget checks passed; task-1-build.log.
- npx prettier --check src/checkpoints.ts src/departures.ts tests/caprices-persistence-036.test.ts — passed.
- git diff --check — passed.

The 36 caprices are exercised over all18 configurations and seeds0/1/2026/0xffffffff, including both historical and rules2 refuge variants: 3,024 unique code/checkpoint roundtrips. Additional coverage includes choices0/1/2, duplicate/unknown/hero/locked kinds, exceeded limits, missing/invalid caprice missions, no choices for unlimited caprices, old1–7 reads, old caprice6/7 behavior, five frozen checkpoint byte hashes, exact legacy1/2 codes, checksum tampering of caprice set/tier and rules flag, malformed valid-checksum packets, and rejection of caprice code downgrades.

Build sizes: HTML31,771 bytes; bootstrap124,673 bytes; rules78,958 bytes; Phaser1,481,792 bytes. All enforced budgets passed.

## Scope review / concerns

No known concerns or deviations. Browser/server checks were not run as instructed for this task. No push, merge, publication, network service, dependency/package/doc edits, or subagents. Existing APIs are unchanged. The root integration task owns the further family/UI work and whole-branch review.

Commit: 5b0b19c5e784f2bf6df6ff19a281695d6e75a06e — feat: preserve caprices in checkpoints and departure codes.
Post-commit status: clean; commit contains only the three owned paths above.
