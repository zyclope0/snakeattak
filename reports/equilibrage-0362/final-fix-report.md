# Final fix wave — R1 family schema label

DONE locally, pending root scoped review/integration/publication. Base `d234c27c5b3e596e4e2048bb45f1d7e72cee2a15`; source fix commit `28e958e` (full SHA in `final-fix/final-inspection.json` and current delivery receipt). No subagents, remote writes, new feature, paid call or additional design decision.

## Narrow correction and regression

The single P3 was confirmed: a revision-2 refuge remembered then replaced by a legacy refuge retains mission-progress version 2, while the old classifier selected family 4. `missionProgressHasBalance2` now also recognizes `missions.version === 2`, on export and import. Sticky progress is preserved; complete missions/albums remain mandatory for family 5. Nothing is downgraded or canonicalized to historical progress.

Five regressions use real controllers/codec/persistence APIs. They cover new→legacy replacement, retained stars and camp bytes, family-5 full round trip, album owner/sticker versus active child, one atomic write and deduplicated sync, incomplete exports refused, and false labels 1–4 rejected before storage writes. The family-2 case uses a historical refuge without the tutorial marker so rejection cannot be masked by its existing tutorial guard. The simulated win is explicitly controlled QA state for recording a sticker/star, not a new physics proof game.

RED before production edit: final `red-final.log` has 12 tests, eight pass/four fail: export `4 !== 5`, and false labels 2/3/4 accepted. Family 1 already rejected embedded missions. Earlier preparation logs are retained too: the first auxiliary family-2 assertion expected camp 5 but that historical mission correctly encodes camp 6; this assertion was corrected before the final RED and before the source edit. Focused GREEN: 45/45, zero fail, including unchanged genuine family-1..4 fixtures, 75 deterministic legacy traces and 41 historical byte witnesses. Source production diff is one added classifier condition.

## Fresh verification and packaging

- `npm run verify`: 548/548 tests, zero fail; format/types/normal production build/budgets green, 34.428s.
- `npm run test:browser`: desktop/mobile flow green, `pageErrors:[]`, 34.602s.
- `npm run test:family`: file→web, web→file, reload/cancel/invalid/profile-only/blocked and four viewports green, `pageErrors:[]`, 17.575s.
- Copied/adapted Task3 scripts under `artifacts/equilibrage-0362/final-fix/`, leaving initial logs intact. Separate portable build and four fresh FR/EN normal-bundled-offline plus file:// cold starts, 17.286s, zero errors/external requests, local fonts ready.
- APK after source commit: Java 21/existing SDK, Gradle offline/no daemon/max-workers=2, 10.996s. Version 0.36.2/code 48, appID `com.conqueteserpents.famille`, same certificate `d018e28e8ab916b4cb46ef53e2c696079415304be87cb0cf90662df94598d599`, landscape, no server/startpath/INTERNET/BILLING/AD_ID. All 34 normal dist files byte-equal to APK. `capacitor.settings.gradle` restored in finally. Exact source SHA, package sizes and hashes are in current `reports/equilibrage-0362/delivery.json` and ignored `final-fix/android/apk-inspection.json`.

## Preservation and provenance

External snapshot `/workspace/equilibrage-0362-final-fix-historical-backup`: 8,284 files = all 8,139 historical fixed proofs plus all 145 Task3 files. New/changed browser outputs copied under final-fix then historical bytes restored in finally. Every baseline hash and the original Task3 historical-final manifest checked again after packaging. Six older external APK/archives, the initial 150,058,244-byte/632-member archive and both newly preserved pre-review deliverables remain identical. All eight physical-source hashes still match the reviewed actual-core manifest. The reviewed 672 Game2 proof games, exploratory cohorts and broad unchanged UI/locale/caprice/reminder matrices were reused, not rerun.

Current delivery paths remain `/workspace/conquete-serpents-v0.36.2-debug.apk` and `conquete-serpents-v0.36.2-portable.html`. Pre-review copies are explicitly named `conquete-serpents-v0.36.2-before-final-review-debug.apk` and `conquete-serpents-v0.36.2-before-final-review-portable.html`; same code 48 because the previous candidate was not released to the user. Initial delivery receipt preserved separately. Initial proof archive SHA remains `7611963e0815a53fe11dc6ea9d4ce9db0a20888fda53eb6c8d9c84186a2e9bb0`.

New `/workspace/conquete-serpents-v0.36.2-final-addendum.tar.gz` contains only the final fix proofs/scripts/source/tests/review/report and current APK/portable, with a per-member SHA256 manifest. No historical proof payload, backup, initial archive or pre-review binary is duplicated. Its exact verified hash/count are recorded separately in the external `.verification.json` and current delivery receipt, avoiding self-referential archive hashes in this included report. Root later adds scoped-review and coordination documents separately. Current compact receipt/README/commands/BILAN/PLAN identify the final fix source and distinguish initial versus final packages/archive.

## Limits and final gate

No combat, difficulty, price, caprice, RNG, catalogue, code/camp or unrelated save change. Seven decisions and five patches remain as reviewed. Physical S24 installation/update/native files/TalkBack, human English review and children remain pending. The already disclosed 19px initial card exposure is unchanged; no new finding is introduced. Final formatting/diff and package/archive integrity checks accompany the documentation closure; root owns scoped review, merge and publication.
