# Task 1 review — checkpoints and departures

Reviewed base `6818589` → head `5b0b19c5e784f2bf6df6ff19a281695d6e75a06e` against the Task 1 brief, implementation report, supplied diff, and the conservation/code contract in the approved design. Scope: checkpoint/departure compatibility only.

## Verdicts

- **Spec compliance: PASS.** The checkpoint8 and departure3 requirements are implemented, with legacy checkpoint1–7 readers and departure1/2 behavior preserved.
- **Code quality: APPROVE.** The change stays within the three owned files, reuses the canonical mission/catalog/engine validators, and introduces no identified correctness or maintainability blocker.

## Findings by severity

- **Critical:** None.
- **Important:** None.
- **Minor:** None requiring a change.

## Strengths and evidence

- `src/checkpoints.ts:26` selects version8 only for caprice missions; existing non-caprice version selection and serialization fields remain unchanged. `src/checkpoints.ts:64` writes explicit choices only in version8.
- `src/checkpoints.ts:120` requires a valid caprice mission for version8 while preserving the prior version7/rules2 and older-version rules checks. `src/checkpoints.ts:137` requires an explicit array, applies the catalog-backed kind limit, rejects unknown kinds, and invokes `chooseCapriceKinds` only for nonempty lists. Engine validation supplies uniqueness, hero, unlock and caprice restrictions. Choices are restored before unit reconstruction; no choices are inferred from survivors or initial units.
- The bounded outside-diff check confirmed `src/game.ts:421` rejects empty lists, so the conditional invocation is necessary; `src/game.ts:442` keeps additional kinds available for a partial choice until the limit. `src/missions.ts:86` validates all MissionRun fields and permits rules2 only for refuge.
- `src/departures.ts:48` canonicalizes the run; `src/departures.ts:51` uses caprice catalog metadata for the suffix. `src/departures.ts:59` and `src/departures.ts:64` reserve the full byte for configuration plus the exact rules2 flag. `src/departures.ts:35` includes the suffix in the checksum. `src/departures.ts:81` rejects suffix/version mismatches; `src/departures.ts:88` decodes the seed, configuration and rules flag and validates the reconstructed MissionRun. No profile, notebook or ally-choice data enters the code.
- `tests/caprices-persistence-036.test.ts:26` covers all36 caprices, all18 configurations, boundary seeds and both refuge rule variants (3,024 distinct roundtrips). Focused tests cover empty/partial/full choices, dead recruited types, malformed choices and missions, old caprice camps, all historical checkpoint versions, frozen legacy byte/code fixtures, valid-checksum invalid packets and downgrade rejection.
- The commit diff contains only `src/checkpoints.ts`, `src/departures.ts`, and the new persistence test. The frozen engine/catalog/mission files have no changes between review base and head; no rules, values or RNG implementation changed.

## Verification and limits

Reviewed the retained green log (11/11), full-suite log (484/484), and build log, consistent with the implementation report. Current HEAD is the reviewed commit. Per review instructions, no suite or browser was rerun; runtime validation relies on the supplied exact-code evidence. Browser/UI behavior and later family-envelope/profile integration are outside this task and have not been assessed here. No additional in-scope cannot-verify item was identified.
