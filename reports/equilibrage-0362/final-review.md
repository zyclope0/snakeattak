# Fresh whole-branch final review — 0.36.2

Reviewed on 2026-11-10: `9d3dded6bd22bcfee25c3f622eb9fffc50750496` → `d234c27c5b3e596e4e2048bb45f1d7e72cee2a15`. HEAD was independently confirmed. Scope: the complete supplied 53-file branch diff, binding specification/plan, AGENTS.md and architecture, task reports and original/corrective reviews, current source and delivery evidence. This is a fresh branch review, not an aggregation of the three prior approvals.

**Specification verdict: CHANGES — one minor format-label consistency issue (R1, P3).** All approved balance values, historical game behavior, UI routing and reminder requirements examined are otherwise satisfied.

**Quality verdict: CHANGES — resolve the small R1 boundary inconsistency before declaring the final gate clean.** No P0/P1/P2 finding established. The implementation is coherent, the previously reported three defects are resolved, and the recorded verification/package evidence is strong. R1 does not demonstrate current-version save loss, broken gameplay or failed atomicity.

**Technical merge readiness:** the tested branch is operational and packaged consistently, but my clean-review recommendation is pending R1 correction and a focused re-review. A narrow codec fix needs affected persistence checks and refreshed build/package provenance; it does not justify replaying unchanged physics cohorts or the complete ten-second UI matrix. Physical S24/human checks remain limitations, not an inferred replacement for the user's later explicit publication authorization. Remote CI and integration state were not reviewed here.

## Actionable finding

### R1 — P3: retain a modern family envelope when mission progress remains version 2

**Location:** `src/familyBackup.ts:26` (`missionProgressHasBalance2`, particularly line 28), consumed by the reader at line 74 and export classifier at line 129; envelope selection is line 140.

**Trigger:** start the first new revision-2 refuge, then replace it with an imported historical refuge departure. With no other revision-2 run/camp retained, `MissionProgress.version` correctly remains 2 (promotion is sticky), but `missionProgressHasBalance2` only examines current run/camp revisions. Export consequently falls back to family version 4 while embedding mission-progress version 2. The current family reader also accepts that combination; analogous incomplete public exports can select version 2/3 with progress 2.

**Concrete read-only API reproduction executed during this review:**

```js
const progress = createMissionProgressController();
const modern = createMissionRun('refuge', 42, undefined, 2);
const legacy = createMissionRun('refuge', 43);
progress.started(modern);
progress.rememberCamp(new Game(42, undefined, modern));
progress.started(legacy);
const game = new Game(43, undefined, legacy);
progress.rememberCamp(game);
const raw = writeFamilyBackup(
  encodeCheckpoint(game), createCareer().state,
  progress.state, createCapriceAlbums(),
);
const result = JSON.parse(raw);
// result.version === 4
// result.missions.version === 2
// JSON.parse(result.camp).version === 7
// result.missions.lastRuns.refuge has no balance field
// readFamilyBackup(raw) !== null
```

This uses normal public transitions, no forged values, storage, simulation steps or product edits. The production launch path has the same sequence: retain old session, `started(run)` clears retryCamp/replaces lastRun, then remember the new camp. The base reader at `9d3dded:src/missionProgress.ts:49` rejects any `version !== 1`, so this advertised family-4 file is outside the original family-4 schema. That old-reader result follows directly from its inspected guard; an old application was not launched.

**Effect and calibration:** the same 0.36.2 app round-trips the file successfully and preserves its data. An older app rejects it, even though the envelope is labelled with its supported old format and all actual departures now use old rules. The issue is the inconsistent new/legacy schema boundary and acceptance of a new nested format under an old envelope, not a claim that an old app must understand family 5. This is low priority: safe rejection by the older reader, no demonstrated corruption or loss, and no combat impact.

**Proposed correction:** treat retained `missions.version === 2` as requiring family 5 on both read and write, alongside the current nested revision checks. Keep complete missions/albums mandatory for that envelope; reject progress 2 disguised under versions 1–4 before writes. Alternatively, explicitly canonicalize progress to version 1 only when all contents are representable historically, but this is a broader policy change than preserving sticky promotion. Add a focused new→legacy replacement regression, version 1–4 rejection for progress 2, and an unchanged genuinely legacy progress-1 export witness. Do not weaken old fixture expectations.

## Requirement and architecture assessment

- `balanceRevision.ts` preserves historical defaults and changes only T-rex 340, dragon 210 and tank 440 in revision 2. Game metadata is a private readonly field/getter; old enumerable state hashes remain meaningful. `data.ts` is unchanged, as are unlock rules and allied statistics. Free-recruit vouchers remain authoritative.
- The five caprice patches match the approved values exactly. Cached frozen contextual definitions preserve all original French names/announcements and historical objects. `shellBite` applies once to shell non-boss damage, including the clarified hypothetical shell projectile. Non-shell/boss damage, retaliation 2/3 and crystal entry 9 retain their prior paths. No new RNG, browser/network dependency or arbitrary rule snapshot entered the engine.
- Codes 1–3 and historical camp readers remain available; code 4 uses the specified 256 payload, refuge flag and mandatory suffix. Camp 9 requires revision 2, coherent mission/seed and retained friend choices. Unknown and downgraded revision markers are rejected. New persistent formats reject dynamic laboratory aliases; Game/lab aliases remain available. The revised chapter comparison and mission comparison include balance identity.
- Session and new menu entries explicitly choose revision 2. Restored games, old/new codes, mission retry and reroll preserve the original revision and refuge flag. Classic pending confirmations retain seed zero/max and revision. The existing generic classic new-game/reset semantics remain intentional. Battle catalogue/dock/guide prices resolve from the active Game, home guide uses current prices, and old departures receive the localized original-rules label even without a recoverable seed.
- Family 5 routes albums through bootstrap, preview and persistence, preserves owner/stickers/shared stars, and validates before the single authoritative import write. No collection is invented by the public new-camp exporter. R1 is the sole uncovered schema edge found in this inspection.
- Reminder state stays in the UI. Native frame delta is separate from simulation speed; active guards and pause/orientation/dialogue integration exclude unavailable time. Threshold uses spendable gold; successful Session purchase signals include recruitment/free vouchers/repair/training and cannot be masked by same-frame income. Priorities defer display, four readable active seconds are bounded, cancellation is handled before activity checks, and markers are only set on actual eligible display. The 64-code cache and denied-storage memory fallback are separate from family/game state. Placement probes use real Game eligibility and placement validation, with throttled failure retries.
- New localized copy is bound through the existing explicit i18n layer. Caprice names and announcements remain raw French in both languages; explanations and surrounding controls translate. The compact toolbar change is limited to layout, with no board/rules mutation.
- QA amendments preserve legacy witnesses and strengthen explicit modern-version assertions. The corrected touch helper selects a genuinely visible card intersection; it retains native gestures, movement, both directions, disabled/armed cases, no accidental purchase/selection, tap selection and document-scroll assertions.

## The 19 px short-viewport issue: initial exposure, not a permanent card slit

I viewed `task3/scroll-diagnostic/before-568-24-48-16-0.png`: at 568×320 with safe insets 24/48/16/0 the first cards initially show only their top 19 px, with no unit names. This is a genuine discoverability/comfort limitation after the authorized toolbar stacking.

It is not evidence that complete cards cannot be read or selected. `src/style.css:2803` makes **the entire reinforcement panel** scrollable, and `src/style.css:2844` gives the inner shop `overflow: visible` and no maximum height. The filter/tabs scroll upward. I also viewed `task3/reinforcements-scroll-green2/generated/artifacts/reinforcements-scroll-037/after-568-48.png`: full Massue and Ninja cards, including portraits, names and prices, are visible; Massue is selected. The saved native recipe records 105 px panel movement and preserves actual tap/drag assertions. This provides more evidence than movement alone.

**Judgment:** no functional recruitment blocker established; no new P2/P3 finding assigned from the initial exposure alone. The disclosed design tradeoff is acceptable for this bounded balance delivery. Child discovery and comfort still require observation; the queued graphics/menu study can assess them without treating automated movement as proof of usability.

## Evidence independently checked

- Inspected final `task3/verify/run.log`: 543 tests, 543 pass, zero fail, formatting/types/production build/budgets successful. General browser log records desktop/mobile purchase/reload/menu behavior and `pageErrors:[]`. This review did not replay them.
- Read targeted browser recipes and existing staged receipts/reviews: old/new contextual prices and actual T-rex guide captures; code/retry/reroll routing; native delay/duration/×2/locales/priority/pause/reload/refused storage; focused real repair with controlled offsetting income. Controlled QA state is not called a naturally earned-income playtest. The initial staged 15 cases and subsequent focused repair proof are distinct from a fresh full replay.
- Recomputed all eight physical-source hashes against `actual-core/manifest-before.json`: zero mismatches. Independently compared every recorded Task2 reuse equality against commit `09aaae9`: zero discrepancies; the declared QA screenshot script delta is real, production files are equal. No runtime diff from APK source `e55e2d3` to reviewed HEAD.
- Read actual simulation receipts: 540 actual canonical Game revision-2 plays/540 exact approved matches plus 132 actual pricing plays/132 exact matches = **672**. The 540 old controls are reused, **1,356** exploratory games are separate, and prior-review cohorts are not counted as new. The laboratory `play` body remains unchanged and outputs record full runs/revision. Pricing adapter uses actual Game revision 2 without overriding prices/damage. Classic discovery minimum and classic mission-only stars are excluded from the stronger claims; cumulative exploratory gold durations do not prove the reminder delay.
- Parsed the legacy fixture: 75 deterministic traces, 41 exact camp/code witnesses and four family envelopes. Independently recomputed fixture SHA256 `0eec20bd6bf531756e47f776b8cd0a13f1156ff62dcad207ef7ed704457b09ad` and immutable data hash `3fd2b6d7b9c1202d4847991c2ba0aec13a5b4a967822349435e3903abf7f3518`, matching the capture record. Test logic checks original catalog identity, bytes and behavior rather than replacing expected legacy results.
- Independently hashed current APK, portable and proof archive: all sizes/SHA256 match `reports/equilibrage-0362/delivery.json`. Opened APK and compared all **34** normal dist files to archive bytes and recorded per-file SHA256: zero mismatches. Current runtime source matches its packaged-source commit. Read signature/manifest/permissions receipts: version 0.36.2/code 48, appID `com.conqueteserpents.famille`, unchanged certificate `d018e28e8ab916b4cb46ef53e2c696079415304be87cb0cf90662df94598d599`, no INTERNET/BILLING/AD_ID, local normal bundle and no server/start path.
- Read the four cold-start script/receipt paths: FR/EN normal bundled-offline and file:// portable, fresh page/menu-to-battle, local fonts and zero external requests/errors. The normal-offline case serves bundled files through a test route while network is offline; it proves local-bundle independence, not installation of a browser service worker or first visit to an uncached offline website.
- Existing Task3 review independently verified 632 archive members and historical preservation of 8,139 fixed proof files/six external older deliverables. I verified the current global archive hash and inspected preservation receipts, but did not redundantly hash every archive/historical member again. The archive explicitly predates this whole-branch review.

## Six simulated council lenses

These are reasoning lenses, not people consulted or human testing.

| Lens | Assessment | Limit |
| --- | --- | --- |
| Architecture/persistence | Explicit immutable revisions and strict reconstruction keep old rules separate; R1 is a small missing nested-version boundary. | Real family data on the physical device not exercised here. |
| Android/performance | Local assets, same identity/certificate and package/source integrity are supported. No extra combat dependency. | No physical frame-time, thermal, input or installation measurement. |
| UX/accessibility/locale | Contextual prices, raw French identities and noninterrupting bottom reminder are coherent; compact cards become readable after panel scroll. | Initial 19 px exposure, TalkBack and human English quality remain unproven. |
| Simulated child age 6 | Short reminder and visible price reduce the amount of text needed to choose an ally. | Whether the child discovers catalogue scrolling or understands the reminder requires observation. |
| Simulated child age 9 | Cheaper dream units and preserved caprice identity support the approved design intent. | Robot win rates do not establish enjoyment or perceived fairness. |
| Simulated child age 12 | Historical codes retain their challenge; revision-aware prices/rules permit meaningful replays. | Long-session strategy interest and purchasing choices were not human-tested. |

## Declined to judge / verification limits

- Physical S24 install/update, native file handling, keyboard, TalkBack, GPU/thermal/fluidity: no device execution authorized for this reviewer and no physical evidence supplied.
- Actual child comprehension/fun and human English quality: simulated lenses and automated localization checks cannot supply human observations.
- Exhaustive accessibility or performance certification: finite viewport/gesture checks and deterministic engine games do not establish those claims.
- Future GitHub CI, merge/deployment and live-host headers/cache: no remote operations performed; this review assesses the local technical candidate only.
- Naturally occurring frequency of masked-income repair timing: the fix is substantiated by actual handlers plus labelled controlled income, not a frequency study.
- Exhaustive compatibility across every conceivable hand-edited save or every seed: inspected strict boundaries and frozen/targeted evidence, not a mathematical proof of all inputs.
- Capture-before-edit chronology and all archive/history member hashes were not reconstructed again; original capture records, immutable current hashes and prior independent Task3 integrity review support those claims.

Only this report was written. No product edits, Git mutations, subagents, suite/build/browser replays, remote writes or paid operations. The sole functional execution was the tiny storage-free family-version probe reproduced above. Existing green evidence was inspected rather than re-created.
