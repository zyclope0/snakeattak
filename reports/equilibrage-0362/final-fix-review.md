# Scoped final fix re-review — 0.36.2

Reviewed on 2026-11-10: `d234c27c5b3e596e4e2048bb45f1d7e72cee2a15` → `f2e18f07430097ba9fd9c6cbe125e232d7886c3e`. HEAD independently confirmed; supplied review diff is 42,417 bytes. Scope is the sole R1/P3, its one-line production correction and five regressions, and refreshed private-package/evidence provenance. Read the fix brief, original final-review finding, fix report, relevant binding specification/plan, AGENTS.md and architecture. The preceding whole-branch review remains the assessment of unchanged behavior.

**Specification verdict: PASS for this final fix.** R1 is addressed without downgrading retained progress, changing the seven decisions/five patches, or altering historical fixtures.

**Quality verdict: PASS for this final fix.** No new actionable breakage established within the fix diff. The original review's R1 clean-review blocker is resolved. This is a local technical review; integration/publication and physical/human validation remain separate.

## Finding disposition

| Original finding | Status | Evidence |
| --- | --- | --- |
| R1 — P3: a new refuge replaced by a legacy refuge retains progress 2 but emits/accepts an old family envelope | **ADDRESSED** | `src/familyBackup.ts:28` now includes `missions.version === 2` in the shared classifier. Both reader and writer call it after progress validation. Export therefore selects family 5 even with only legacy retained runs/camps; import rejects nested progress 2 under family 2/3/4. Family 1 already rejects embedded missions. |

The production delta is exactly one added condition. Mission-progress validation preserves its version; neither controller state nor stored progress is canonicalized down to version 1. The writer still requires complete validated missions/albums whenever modern family data is present. The reader still validates albums for family 5 and rejects old-envelope mismatches before the persistence importer can reach its single storage write.

The five added tests use the real progress/albums controllers, Game, camp codec, family codec and persistence importer. The successful replacement regression checks retained progress 2, only the legacy last run/camp, shared stars, exact camp bytes, family 5, full canonical round trip, sticker ownership despite a different active child, one import write and deduplicated subsequent sync. Missing-album exports are refused. Four parametrized cases check false labels 1–4 and zero writes. The family-2 case removes the legacy tutorial marker, so rejection is not accidentally supplied by the independent family-2 tutorial guard. Controlled win state creates the sticker/star witness; it is not represented as an additional physics play.

Existing genuine family 1–4 fixtures and expectations are untouched. Their frozen round-trip assertion remains in the focused green run. No new source change outside `familyBackup.ts`, and no fixture change, exists in this fix range.

## Existing fresh verification inspected

- Final pre-edit RED log: 12 tests, 8 pass, 4 expected failures — export `4 !== 5` and false family 2/3/4 accepted. Family 1 was already rejected. Earlier preparation logs and the corrected auxiliary historical-camp assertion are retained and disclosed.
- Focused GREEN log: 45/45, zero failures, including all five regressions and unchanged legacy witnesses (75 deterministic traces, 41 camp/code witnesses, four family envelopes).
- Fresh `verify/run.log`: 548/548 tests, zero failures; Prettier, TypeScript, production Vite build and distribution budgets succeed. Command receipt records exit 0.
- Fresh general browser and family logs: desktop/mobile flow, file↔web family transport, reload/cancel/invalid/profile-only/blocked storage, and four family viewports succeed; both have `pageErrors:[]` and exit-0 receipts.
- Four cold-start cases in `portable/report.json`: FR/EN normal bundled-offline and file:// portable, each with fresh menu→battle entry, offline state, local fonts ready, no external requests and no errors. Inspected recipe confirms normal assets are fulfilled from dist while the browser is offline; this does not assert first-visit uncached website/service-worker support.
- Android build log records `BUILD SUCCESSFUL`; packaging recipe uses Java 21, the existing SDK, offline Gradle, no daemon and two workers, and restores `capacitor.settings.gradle` in `finally`. Recorded format closure is green; this review's read-only `git diff --check BASE HEAD` also returned exit 0.

These are the implementer's existing fresh executions, inspected in this review. No test suite, build, browser or game cohort was rerun by the reviewer.

## Package and additive-archive provenance

Independently recomputed current APK/portable sizes and SHA256 against `delivery.json`: APK 15,159,454 bytes, `4dfeab542049216e971f5a4e1f0a7085c0550869a6c71cedd58479a1482d7dd4`; portable 15,103,538 bytes, `8bf19d863db9cd6053ca71137906b270277f2754ea3270086758bf1e2161482f`. Portable bytes also equal `dist-portable/index.html`.

Opened the current APK and independently compared all 34 normal dist files to its assets and recorded per-file hashes: zero mismatches. Embedded Capacitor configuration has the expected app ID and no server/start path. Inspected badging, manifest, permissions and signature receipts: 0.36.2/code 48, `com.conqueteserpents.famille`, landscape orientation, certificate SHA256 `d018e28e8ab916b4cb46ef53e2c696079415304be87cb0cf90662df94598d599`, and no INTERNET/BILLING/AD_ID. APK inspection records source `28e958e29ef86b8442c875ce6a96b0707ec0425d`, the source-fix commit preceding packaging. Independently confirmed no runtime/configuration delta from that commit to reviewed HEAD/current files.

Both explicitly named pre-review package copies match their original hashes. `delivery-before-final-review.json` is byte-identical to BASE's delivery receipt. Independently recomputed the preserved initial archive's 150,058,244-byte size and SHA256 `7611963e0815a53fe11dc6ea9d4ce9db0a20888fda53eb6c8d9c84186a2e9bb0`.

Independently reopened the separate final addendum, checked its 30,209,058-byte size/global SHA256 `7bbdc57afb5382e04078a256a212882603e22933d08aa8ea5bf43a84ca7c8da2`, and verified all **51 payload files** against their embedded byte lengths/SHA256 manifest, with no duplicate names. Included source/tests/fix report equal current files; included APK/portable equal current deliverables. Its membership contains the new proofs/scripts and specified reports/packages, with no historical backup, initial archive or pre-review binary payload. The manifest itself is additional to those 51 files. The receipt correctly states that this scoped review and later coordination documents are separate from the already-created addendum.

Independently recomputed all eight preserved physics-source hashes: all match. Inspected preservation runner/final inspection and compared before/after manifests: identical 8,284 entries, comprising all 8,139 original fixed proofs plus 145 Task3 files. The external backup and `finally` restoration procedure preserve changed historical outputs while copying new results into the fix evidence folder. Existing final-inspection receipts cover all older external packages and fixed-file bytes; this review did not redundantly rehash those 8,284 untouched proof files or the initial archive's 632 members. The 672 previously reviewed Game2 plays and broader unchanged UI/reminder matrices remain reused evidence, not additional executions.

## Out-of-scope observations and limits

No new out-of-scope defect was established. The previously disclosed 19 px initial card exposure and pending S24 installation/update, native files, TalkBack, human English review and actual child experience remain unchanged. This narrow review makes no new usability, physical performance, remote CI, merge or live-publication claim and does not redo untouched engine/cohort review.

Only this report was written. No product edit, Git mutation, subagent, remote write, paid operation, suite/build/browser replay or new simulation was performed. Read-only source/diff/log inspection and package/archive/hash checks supply the independent evidence above.
