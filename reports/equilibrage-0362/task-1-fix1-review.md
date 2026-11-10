# Task 1 — fix round 1 specification and quality re-review

Reviewed revision: `7454103bc345c7935f23fe8c62c394e6bbcb8af8` → `f6dd559fc16e5ad6e0814e4286da9416ed9134f0`.

Specification: **APPROVE**. Quality: **APPROVE**.

## Finding verdicts

- **R1 — ADDRESSED.** Chapter-camp retention in `src/progression.ts` now requires both the same reward seed and the same `Game.balanceRevision`. A different revision therefore replaces the prior snapshot in either capture order. The unchanged retention branch still preserves the first pre-choice camp for matching seed/revision. The focused regression tests cover 1→2 and 2→1 at both chapter boundaries, verify restored revision, dragon price and second capture's gold, and verify exact snapshot retention after repeated synchronization and controller reconstruction.
- **R2 — ADDRESSED.** `isPersistableMissionRun` accepts a balance-2 caprice only when its ID belongs to the frozen `CAPRICES` or `CREATOR_CHALLENGES` arrays. Those canonical definitions and rules are frozen, and `defineCaprice` rejects replacement of an existing ID, so dynamic aliases cannot gain persistence eligibility by replacing an official definition. Code-4 encoding rejects an alias before producing bytes. Camp-9 encoding and decoding reject it, and mission-progress validation, `started` and `record` reject it before retaining configuration or changing stars. `rememberCamp` inherits the checkpoint guard. Family read/write paths validate their mission progress and every camp through these same boundaries, preserving rejection rather than silently canonicalizing an alias. Code-4 decoding already resolves only the official arrays. `readMissionRun`, `Game` and experimental rule registration remain available, while balance-1 alias persistence and legacy encoding retain their previous behavior.

No new blocking specification or quality finding was established in this corrective diff.

## Evidence and scope

Read `AGENTS.md`, `docs/ARCHITECTURE.md`, the binding Task 1 brief, original review, root alias probe, appended fix report and the supplied 18,222-byte log/stat/U10 review package. Inspected the changed source and tests plus the directly relevant catalog and family-validation paths. HEAD matches the reviewed commit and the tracked worktree was clean before writing this review.

The saved `fix1-red-valid-camps.log` faithfully records the two wrong-revision resumptions, missing alias-encoding exception and accepted alias camp: **7 tests, 3 pass, 4 fail**. Its same-revision retention, canonical round trips and legacy alias cases already pass. The fixture normalization is confined to the test helper and makes its artificial chapter boundary legal; no product normalization or expected historical bytes were changed.

The saved `fix1-career-green.log` records **3/3** after R1. `fix1-focused-green.log` records **61/61**, including the seven new regressions, immutable historical witnesses, all 36 official identities, existing chapter/progress/family cases and alias rejection. `fix1-build.log` records TypeScript, Vite build and size-budget output; `fix1-format-check.log` records successful formatting checks. These saved results were inspected, not independently rerun. The report's clean diff-check claim was not independently rerun.

The six changed paths are limited to the five persistence/model modules and the focused regression test. `progression.ts` extends the original file list specifically to resolve the authorized R1 finding. The fix does not edit Session/UI, Game combat, catalogs/data, the laboratory, versioning or delivery outputs.

This was a scoped re-review of R1/R2 and regressions introduced by this diff, not a repeat of the complete Task 1 review. No suite, build, server, simulation, remote write or sub-agent was run during this review. Task 2 activation/reminder behavior, browser/mobile checks, later global verification and APK delivery remain outside this review.
