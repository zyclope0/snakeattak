# Task 1 — fresh specification and quality review

Reviewed revision: `ad63efe` → `7454103bc345c7935f23fe8c62c394e6bbcb8af8`.

Specification: **CHANGES**. Quality: **CHANGES**.

## Finding

**P2 — Chapter-camp identity merges departures from different balance revisions.** `src/progression.ts:161` retains the first pre-choice chapter camp whenever `previous.rewards.seed === game.rewards.seed`, without comparing `balanceRevision`. Both revisions intentionally derive the same reward seed from the departure seed (`src/game.ts:180`, `src/rewards.ts:43`). Consequently, reaching the same chapter with the same seed under the other revision does not save that departure's army or rules. The chapter resume action loads this stale camp through `career.chapterGame` (`src/ui/menu.ts:110`). This violates the requirement that departure comparisons include balance and that old departures retain their own prices.

Concrete read-only API reproduction, using `new Game(42, undefined, undefined, revision)`, setting the valid pre-choice boundary `wave = 4`, `rewards.pending = 4`, then calling `career.sync(game)` and `career.chapterGame(1)`:

| Capture order | Second requested revision | Retained camp | Resumed revision | Resumed baby-dragon price |
| --- | --- | --- | --- | --- |
| 1 → 2 | 2 | 6 | 1 | 240 |
| 2 → 1 | 1 | 9 | 2 | 210 |

Fix the retention identity to include balance revision. Add focused regression coverage for both orders while preserving the existing same-seed, same-revision rule that retains the original pre-choice camp. The issue is in the core persistence model even though `progression.ts` was not changed in the submitted diff; it should be resolved before Task 2.

## Evidence examined

- Read `AGENTS.md`, `docs/ARCHITECTURE.md`, the binding brief, implementation report and supplied 172,828-byte review package. Inspected relevant persistence, checkpoint, departure, mission, album-import and chapter-resume callsites without regenerating the Git diff.
- New prices and the five cached caprice patches match the specification. The private readonly revision field/getter preserves the historical enumerable own-state shape. Shell-only damage scaling is applied once at ally damage, with the boss exclusion; retaliation and crystal damage paths are unchanged in the supplied diff.
- Code 4, camp 9 and mission-progress 2 route explicit revision 2, reject unsupported versions/markers, and retain initial seed and mission identity. Mission retry comparison includes balance. The separate chapter-camp comparison is the gap identified above.
- Family 5 requires missions and albums for new-revision contents, including main camp, lastRuns, retryCamp, classicCamp and nested career chapter camps. Read/write validators reject downgraded labels. Persistence retains loaded albums, validates before the authoritative write, and the five import/presentation classifiers preserve v5 album handling. Bootstrap applies model replacements only after a successful import.
- Inspected the 75-trace/41-camp-code/family-1–4 fixture and its assertions, including exact catalog identity, code/camp bytes and unchanged French names/announcements. Independently recomputed SHA-256 of `src/data.ts` and the fixture; both match the recorded immutable-witness metadata.
- Inspected the new revision tests, including shell projectile/boss behavior, one-hit poison, 2/3 retaliation, 9 crystal damage, downgrade rejection, albums/provenance and atomic import refusal. The only modified historical expectation in the supplied diff is the future invalid mission-progress version changing from 2 to 3.
- Existing `verify-final.log` records format success, **521 tests / 521 pass / 0 fail**, TypeScript/Vite build and size-budget output. No suite, build, server, remote write or sub-agent was run during this review. The only execution was the small, storage-free chapter-camp reproduction above.

## Verification limits

The recorded 521-test result was inspected, not independently rerun. Capture-before-source-edit chronology and the original `9d3dded` source provenance are supported by the supplied report/fixture/ledger, but were not independently reconstructed from Git history. Browser/mobile flows, Task 2 revision activation and reminder behavior, large laboratory comparisons and the APK are outside this Task 1 review. No additional findings were established in the reviewed scope.
