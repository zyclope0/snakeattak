# Final F1/F2 fix wave

Completed locally on 2026-11-09, branch `feat/caprices-interface`, base `026ab1a23e269e21012c355eecc8cfdf5e3047c2`.

Product/test source commit: `23a37debbc8659a46a6ad4c53e0b2a1deba87ae3` (`fix(ui): clarify caprice preparation and reserve favorites`). Only five narrow product/test files are committed there. New evidence commit: `c2f66d5747950f1e3365690ceaf3bd26c9412f23` (188 new files, all under `reports/suivi-0.36.0/final-polish/`). No push, merge, publication, council/docs/PR writes or subagents were performed. Root owns scoped re-review, receipt/docs integration and STOP.

## Changes and self-review

- `src/ui/capriceAlbums.ts`: export the existing original local `stickerGraphic` helper; the SVG literal and existing result/notebook calls are unchanged.
- `src/ui/capriceView.ts`: append the shared decorative graphic and existing canonical announcement as separate siblings in `.caprice-announcement`. The original exact French announcement leaf, `lang=fr`, raw-copy protection and speech content remain intact.
- `src/ui/caprices.css`: 32px fixed-width badge, aligned beside the announcement with an 8px gap; no extra asset, dependency or paid generation.
- `src/ui/squadControls.ts`: when the protected reserve blocks an unlocked favorite, show the existing translated protected-bank reason in its status and append that reason to its accessible name, retaining the ordinary price there. Existing disabled/selection, unlock, pause, outcome, affordability, recruitment and friend-filter predicates are unchanged. Status clears when the friend becomes affordable.
- `scripts/caprices-036-browser.mjs`: FR/EN at desktop 1280×800 and landscape 568×320 assertions for exact raw French announcement/language, separate aria-hidden sibling graphic, compact side-by-side geometry, reachable 48px footer actions, reserve-disabled favorite, visible and accessible translated reason, retained price and clearing after affordability. Final recipe opens Favorites by native summary click and checks actual favorite/status visibility plus whole-card viewport bounds and minimum action size. Optional report destination isolates new proof.

Self-review: F1 and F2 are implemented within their requested presentation scope. The shared badge is decorative and cannot duplicate screen-reader announcement speech. The reserve predicate only changes presentation, matching catalogue/dock reserve conventions. All production changes are in the four UI files above. `source-freeze.json` proves `game.ts`, `caprices.ts`, `missions.ts` byte-identical to base; no rules, values, RNG, models, schemas, version, application ID or SDK changes. No broad review-clean claim is made; root's scoped re-review remains pending.

## RED → GREEN and evidence distinctions

Evidence root: `reports/suivi-0.36.0/final-polish/` (all paths below relative to that folder).

- `red.log` / `red/`: initial test fixture timed out locating a battle-screen language picker. Corrected by setting the locale preference before fixture boot; this is not product-failure evidence.
- `red-confirmed.log` / `red-confirmed/`: expected assertion failure listing exactly 12 F1/F2 regressions (missing icon and missing accessible/visible bank reason, across two languages and two viewports). No product changes preceded this confirmed RED.
- `green-debug.log` / `green-debug/`: intermediate recipe still left Favorites closed, so visible `innerText` checks failed in all four combinations. Those captures are explicitly not final proof of visible favorites.
- `green-debug-fixed-fixture.log` / `green-debug-fixed-fixture/`: Favorites opened; 256 checks / 38 captures / errors `[]`, native skipped only for debugging.
- `caprices.log` / `caprices/report.json`: fresh FULL recipe, no `CAPRICES_SKIP_NATIVE` variable, **269 checks / 39 captures / errors `[]`, nativePlayed true**. Actual Game/Scene plus Playwright clock completed Refuge seed 42, three waves, crystal **73%**, **two stars**; ownership through A launch/B selection/classic/reload/A resume/win/retry/fresh B launch passed. Family starting stars/profiles were controlled; readiness, outcome and shell fixtures remain separate.
- `caprices-visibility.log` / `caprices-visibility/report.json`: strengthened final native-disclosure/visibility recipe, **268 checks / 38 captures / errors `[]`**, `CAPRICES_SKIP_NATIVE=1`. It is additional presentation coverage, not another native playthrough. Root explicitly requested avoiding a duplicate unchanged three-wave replay. `caprices-full-test.mjs.txt` archives the full run's recipe revision; `caprices-final-test.mjs.txt` archives the strengthened revision. They differ only in native opening and the extra visibility/viewport assertions. `source-association.json` and `product-fingerprint.json` confirm identical production bytes throughout both runs and APK packaging.

The historical `reports/suivi-0.36.0/caprices.json` remains the separate old **205-check** proof. It was not replaced or relabelled.

## Fresh serialized verification

Every command below exited 0. No build/browser commands ran simultaneously. The first six form the requested sequence. The second caprice command used `CAPRICES_SKIP_NATIVE=1` with `CAPRICES_REPORT_DIR=reports/suivi-0.36.0/final-polish/caprices-visibility`; the first full command explicitly removed that skip variable and used the `caprices/` destination. Locale inventory used the new `locale-inventory/` destination. Commands and durations are also in `commands.json`; recipes are archived as `run-checks.py` and `post-checks.py`.

| Command | Exit | Seconds | Log |
| --- | --- | --- | --- |
| `npm run verify` | 0 | 34.08 | `verify.log` |
| `npm run test:browser` | 0 | 35.53 | `browser.log` |
| `npm run test:caprices` | 0 | 125.27 | `caprices.log` |
| `npm run test:locale` | 0 | 76.49 | `locale.log` |
| `npm run test:child-mobile` | 0 | 41.37 | `child-mobile.log` |
| `npm run test:reinforcements-scroll` | 0 | 48.51 | `reinforcements-scroll.log` |
| `npm run test:caprices` | 0 | 40.54 | `caprices-visibility.log` |
| `npx prettier --check scripts/caprices-036-browser.mjs src/ui/capriceAlbums.ts src/ui/capriceView.ts src/ui/caprices.css src/ui/squadControls.ts` | 0 | 0.64 | `final-format.log` |
| `npm run build:portable` | 0 | 9.64 | `portable-build.log` |
| `node reports/suivi-0.36.0/final-polish/portable-check.mjs` | 0 | 3.35 | `portable-browser.log` |

Results:

- Verify: **503 tests, 503 pass, 0 fail, 0 skipped**, formatting/types/build/normal distribution budgets pass. Final specific formatting check covers the later test-only visibility assertions. Product `git diff --check` also passed.
- Baseline browser: desktop and tactile mobile recipes pass, pageErrors `[]`.
- Locale: **915 phrases / 946 English entries**, zero missing entries or added parameters; **24 adapter checks + 392 browser checks**, failed/errors/unknowns all `[]`. Fresh browser result copied to `locale.json`.
- Child mobile: **six viewport cases**, errors `[]`, copied result `child-mobile.json`.
- Reinforcements scrolling: **five cases plus desktop**, errors `[]`, copied result `reinforcements-scroll.json`.
- Portable: fresh build and **four offline file-browser checks** (French startup, English dictionary, English notebook, native tutorial wave start/pause), errors/HTTP requests both `[]`. New `portable-check.mjs` changes only output destination from the old verified recipe. Old `portable.json` remains intact. Normal distribution hashes before/after portable and after packaging are equal; portable did not replace normal `dist/`.

## Representative final captures

Authoritative F1/F2 captures use `caprices-visibility/`, generated by the final native-disclosure/visibility recipe. Desktop/small and FR/EN examples are:

- `final-icon-1280-fr.png`, `final-icon-1280-en.png`, `final-icon-568-fr.png`, `final-icon-568-en.png`.
- `final-reserve-favorites-1280-fr.png`, `final-reserve-favorites-1280-en.png`, `final-reserve-favorites-568-fr.png`, `final-reserve-favorites-568-en.png`.

Visually inspected final 1280 FR and 568 EN icon/favorites captures: compact badge sits beside the unchanged French text; footer actions remain on screen; actual favorite cards and wrapped protected-bank status are visible. Also inspected `caprices/production-A-win.png`: actual 73% crystal / two-star result. The full recipe additionally retains the 1366×768, 812×375, 780×360, 568×320, portrait guidance, notebook, reserve and both shell-backend captures; exact lists are in the two report JSONs.

## Normal final APK

- Source SHA: `23a37debbc8659a46a6ad4c53e0b2a1deba87ae3`; the source/test commit was made before packing.
- APK: `/workspace/conquete-serpents-v0.36.0-final-debug.apk`.
- Bytes: **15,151,926**.
- SHA-256: `c6909b41534b3f576cf59cc8bff55b32e801e8180a8022d2395770bcdf07cddb`.
- Certificate SHA-256: `d018e28e8ab916b4cb46ef53e2c696079415304be87cb0cf90662df94598d599` (same existing debug certificate).
- App ID `com.conqueteserpents.famille`; versionName `0.36.0`, versionCode `46`; French and English native labels preserved; compiled `sensorLandscape` is `0x6`.
- `apksigner verify --print-certs` passes. Compiled permissions contain only the app-owned dynamic-receiver permission; **no INTERNET, BILLING or AD_ID**. Capacitor config has **no server or appStartPath**.
- **All 34 normal dist files compared byte for byte** with APK `assets/public/`; inspection includes each path, byte count and SHA-256. `normal-dist-before-portable.json`, `normal-dist-after-portable.json` and `source-association.json` associate the preserved normal build.

Packaging used the adapted new `android-package.py`: `JAVA_HOME=/workspace/android-toolchain/jdk-21.0.2`, `ANDROID_HOME=/workspace/android-toolchain/sdk`, `SERPENTS_PERF=0`; `npx cap sync android` with immediate settings restoration in `finally`, then `./gradlew assembleDebug --offline --no-daemon --max-workers=2`. Gradle passed in **10s**, **93 tasks (27 executed, 66 up-to-date)**. Raw sync/build/package, badging, manifest, permissions and signature logs plus `apk-inspection.json` are all in the new folder. No native generated path is committed.

`preserved-before.json` / `preserved-after.json` verify **113 prior files unchanged**, covering the original `/workspace/conquete-serpents-v0.36.0-debug.apk` and 112 existing report files, including old Task 4 proofs, old APK inspection, old portable proof and old 205-check caprice proof. Root was notified preservation completed before any later root-owned receipt update.

## Limits and handoff

These are local Chromium/cloud, deterministic fixture and debug-package results. No physical S24 install, Android touch/TalkBack session, audible local French voice playback, real-child usability session or native-English human review is claimed. Controlled family data is distinct from the one actual completed engine game. No new balance measurements or all-36 natural playthrough claim. Nothing was pushed, merged or published. Root owns scoped re-review and final documentation/council/remote actions within authorization.
