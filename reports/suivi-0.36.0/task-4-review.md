# Task 4 — scoped specification and quality review

Reviewed BASE `813b59f098d9dc0c1be6cc85be78785eae82da58` → HEAD
`7a384beac8f63d875e2a45056c58da2b8f508687` against `task-4-brief.md`, the
delivery report and supplied diff. This review covers delivery changes and
their evidence, not another Task 1–3 implementation review.

**Specification verdict: APPROVED for the delegated Task 4 scope.**
**Quality verdict: APPROVED, with one nonblocking documentation correction.**
No Critical or Important finding. Final whole-branch review, six-persona council,
remote branch/PR work and the parent's STOP handoff remain root-owned obligations;
this approval does not certify those outstanding steps as complete.

## Findings

- **Minor — unsupported fresh-CI wording:**
  `reports/suivi-0.36.0/task-4-report.md:162` says optional
  “portable/file/CI checks have passed.” The complete `commands.json:1` list
  records local checks, portable checks and packaging, but no fresh candidate CI
  run; remote work remains pending at `task-4-report.md:166`. The named main CI
  `42657692341` in `docs/PLAN-ACTUEL.md:24` is completed 0.35.0 history. Remove
  “/CI” from the Task 4 sentence or explicitly identify this as historical main
  CI. Do not imply the unpublished candidate has passed remote CI.

## Evidence assessed

- The delivery diff changes only version metadata, docs, new evidence/captures
  and the two helpers. `package.json:4` and both package-lock versions are
  0.36.0; `android/app/build.gradle:10` is code46/name0.36.0. Dependency entries,
  appID, native settings and game sources have no delivery diff.
- Independently compared `src/game.ts`, `src/caprices.ts`, and
  `src/missions.ts` bytes with `c886b82` and the three SHA256 values in
  `reports/suivi-0.36.0/source-freeze.json:4`: all match. The archived catalog
  baseline equals `/workspace/caprices-ui-catalog-baseline.json`; unchanged
  source preserves the 36 definitions, French names, announcements and rules.
- `tests/locale-035-harness.ts:22` obtains the existing controller; its state
  getter clones data (`src/missionProgress.ts:145`). The helper unlocks all six
  normal missions through validated replacement before witnesses and refreshes
  the UI. `locale-035-harness.ts:179` rejects disabled cards and calls normal
  `.click()`. `tests/result-0342-harness.ts:36` merely exports that controller.
  No production guard or assertion was weakened. Existing English titles,
  canonical IDs/wave counts and before/after game/RNG assertions remain at
  `scripts/locale-035-browser.mjs:695`; exact family4/albums and ordinary
  checkpoint7 assertions remain at `tests/missions-021-browser.mjs:60`.
- Read all required fresh command result logs and their named summary reports.
  They support verify503/503, zero failures/skips and build budgets; browser
  baseline; caprices205/31; locale RED then GREEN392+24; missions and regressions;
  offline; interruptions; child/mobile; interface audit; departures; medical
  persistence; threat preparation; reinforcement scroll. `commands.json:1`
  records the sequence and the justified final verify after helper changes.
  Additional audit13, presentation14, tactical/portable/file checks are recorded.
  All 110 entries in `evidence-sha256.json` independently match their files.
- Fresh `caprices.json:2` is nativePlayed:true/version0.36.0/205 checks. Its log
  records three played waves. Inspected the existing native recipe: actual
  production UI, controlled valid family progression, virtual Playwright clock
  driving the real scene, retained-A/classic/reload/resume/retry/new-B sequence.
  It does not inject the winning battle state. The committed win screenshot
  shows wave3/3, 73% crystal and two stars. This is automated engine play, not a
  human real-time or physical-device session.
- `offline-caprices.mjs:1` explicitly checks English cold bootstrap, family4
  active B, checkpoint8 Ninja+Medic/retained A, and code3 native launch through
  offline disk routes. Its JSON reports four checks/26 files/zero missing,
  external or page errors. Portable report records FR/EN and tutorial start/
  pause from `file://`, with no HTTP requests; normal dist preservation is named.
- Independently verified the actual APK SHA256 and 15,095,241-byte size against
  `apk-inspection.json:5`; all 34 current dist files match the ZIP bytes and all
  34 recorded hashes. Its Capacitor config has no server/appStartPath. A fresh
  read-only `apksigner verify --print-certs` succeeded with the required
  `d018e28e…598d599` certificate. Archived compiled manifest/badging/permissions
  support appID, version46/0.36.0, sensorLandscape0x6, French/English labels and
  absence of INTERNET/BILLING/AD_ID. No packaged source changed after the named
  APK source `673481f` through reviewed HEAD.
- No existing reports or captures are changed by BASE→HEAD. The fixed historic
  audit's current SHA256 matches `historical-preserved.json:4`. The report
  distinguishes historic 185/skipped192/native evidence and old3888 simulations
  from this delivery. Reviewed screenshots of native victory, small English
  preparation, compact controlled reserve and Canvas shell; their labels agree
  with `captures.md`. The result scroll cue remains a documented inherited minor.
- `docs/BILAN-0.36.0.md:8` covers all eight points and exact French policy,
  8-child/24-character limits, shared campaign/separate notebooks, old-envelope
  replacement warning, optional local voice and deferred human validation.
  `docs/CONSEIL-0.36.0.md:9` honestly marks the final council/review pending.
  `docs/PLAN-ACTUEL.md:3` states candidate STOP and preserves completed PR2/main
  CI history. No merge/publication is represented as performed for 0.36.0.

## Cannot independently verify in this scoped read-only pass

No suites, servers, builds or browser recipes were rerun. Fresh check outcomes
are supported by archived logs/reports, not newly reproduced execution. The
ordered command list lacks start/end timestamps, so absolute non-overlap and
the claimed outside-repository preflight backup operation cannot be reconstructed
from that list alone. There is no contrary evidence; immutable historical output
and the final APK/dist contents were independently checked. Physical S24/touch,
TalkBack, French voice audio and human English/child comprehension remain
explicitly unverified. Remote CI/publication state was not queried.

Only this review file was written; no index, source, report, commit or remote
state was changed.
