# Task 2 fix round 1 — scoped spec and quality review

Reviewed `b015ecda63d6b3c0b99878aa41707687f3945948` → `09aaae905079f0e79ef8055032be4e85f4079143` on 2026-11-10 using the supplied eight-file U10 diff, binding brief, original review, appended fix report, current affected sources/tests and named evidence. Read AGENTS.md and docs/ARCHITECTURE.md. This review checks the single P2 correction and new breakage introduced by the fix; it does not repeat the whole Task 2 review.

**Spec: APPROVE. Quality: APPROVE. Original P2: ADDRESSED.** No new finding in the fix diff.

## Correction verified

`Session.purchaseCount` replaces the task-local recruitment counter. Successful placement still increments it, including a free voucher. New `Session.repair()` and `Session.trainHero()` call the existing Game methods exactly once and increment only after a successful result. The actual repair handler in `src/ui/controls.ts` and training handler in `src/ui/adventureControls.ts` now call those wrappers. Searches of current production sources found no remaining direct repair/training UI calls or references to the replaced counter.

The reminder compares the purchase counter before its activity, priority and retained-marker checks, resetting both waiting and visible duration when it changes. Consequently, offsetting income cannot conceal a successful repair. Failed actions leave the signal unchanged; the existing net-gold-decrease fallback remains. Game replacement initializes the sampled counter and clears reminder state, so retaining the monotonic Session counter across restart/useGame does not carry reminder timing into another game.

This is coordination metadata only. The production delta changes Session, the two real handlers and the observer; it introduces no Game/core/RNG/render/persistence changes. Repair/training validations, costs and results remain owned by Game. The existing free-voucher reset and failure behavior are preserved.

## Evidence checked

Paths below are relative to `artifacts/equilibrage-0362/task2/`.

- `fixround1/node-green.log` records **18 passed / 0 failed**, including Session clock guards, successful/failed repair and training, free-voucher placement, masked-income waiting reset and visible cancellation. The inspected regression code exercises real Session/Game actions. `node-red.log` fails on the initially missing wrapper API; it is not by itself a behavioral reproduction.
- `fixround1/native-red.log` records the pre-fix failure of the ten-second-since-repair assertion. The inspected fixture invokes the production bindControls handler through the native button and injects income afterward in the same click task, before a native BattleScene frame. It does not override a Game method.
- `browser-1794332648037/results.json` records the focused native case green with no page errors. `masked-repair-wait.json` records actual repair **600 → 520**, controlled income to **604**, purchaseCount **1**, and **10,206 ms** until the hint. `masked-repair-income.json` records the second actual repair **628 → 548 → 632**, purchaseCount **2**, and only an empty-string mutation after cancellation during the five-second observation. The case checks both the fresh wait and cancellation of the already visible hint.
- `fixround1/build-green.log` records typecheck, production build and size budgets passing. `format-green.log` records formatting passing. These are existing implementer results, not reruns by this reviewer.
- Independently hashed all **22** entries in `fixround1/all-task2-source-hashes.json` and all **8** entries in `changed-source-hashes.json`: no mismatches. `core-and-render-unchanged.diff` is empty. `historical-preservation.json` reports **8,139** unchanged proof files; I did not rehash the historical collection.

## Limits

No suites, builds, browser sessions, servers, Git operations, subagents or product writes were performed for this review. Only this review file was written. The seven +12 income additions are labelled controlled QA state, not naturally earned income or evidence of the race's frequency. The native evidence is one focused 1280×800 FR case; prior full-suite, language and mobile results were not replayed for this narrow fix. Task 3 packaging and physical S24 validation remain outside this approval; the S24 STOP gate remains applicable.
