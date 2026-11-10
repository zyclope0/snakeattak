# Task 4 — livraison candidate 0.36.0

Status: **DONE — delivery complete; final root review/council pending.** Root owns final whole-branch fresh review, six-persona council,
ledger and remote Git writes. No subagent/reviewer, push, merge or publication by
this task. BASE `813b59f098d9dc0c1be6cc85be78785eae82da58`.

## Scope and changes

Version0.36.0 in package/lock root; Android versionCode46/versionName0.36.0,
no dependency, appID or certificate change. Added package command `test:caprices`
for the existing full recipe. Delivery docs include points1–8, current8/3/4
formats, exact-French names AND announcements, shared family campaign and
separate notebooks (8 children/24 character names), explicit old-envelope empty
notebook replacement, optional local voice, unchanged engine and honest physical
S24/English-human-review limitations. PLAN-ACTUEL records candidate STOP and
PR2 merged `1c4e94f`/main CI42657692341 success as completed history.

Archived Task1/2 approved reports/reviews, Task3 report/review and scoped R1
approval in reports/suivi-0.36.0, including the explicitly historic native report.
Root may delete the ignored plan workspace after its final review. Pending final
council is stated as pending, never represented as completed by delivery.

## Fixture-only compatibility correction

First `npm run test:locale` failed 20 assertions (ten per fixture language):
normal previews beyond Refuge retained the prior mission title/ID/wave count.
RED evidence: locale-fixture-red.log/json in the release report directory.
Root cause: the old locale fixture called disabled cards' onclick directly;
Task3's production preview now correctly checks allowed(run), so the old bypass
cannot open locked missions. Root explicitly authorized fixture adaptation.

`tests/result-0342-harness.ts` only exports its existing progress controller.
`tests/locale-035-harness.ts` clones its valid progress, sets all six bestStars to3,
validates/replaces it before equality witnesses, refreshes UI, then requires an
unlocked button and clicks it normally. No production guard, canonical name,
wave-count assertion, locked-code test, model, schema, rule or RNG changed.
Exact helper diff is saved with delivery evidence for final review. GREEN rerun:
392 browser checks,24 adapter checks,915 inventory phrases,946 English entries,
zero missing/added parameters, page errors or unknown phrases.

## Fresh evidence

All build-mutating commands and all browser fixtures are serialized. No builds
replace dist while production browser recipes run. Historical reports/captures
are backed up outside the repo. The fixed audit report is restored in finally
immediately after archiving the current result.

- `npm run verify`:503/503 passed,0failed/0skipped; prettier, types, production
  build and budgets passed. Initial source commit813b59f plus delivery package version
  metadata. Final verify after the helper correction also passed503/503,0fail/0skip;
  logs preserve both runs. All3 frozen files byte-identical to c886b82 and all36 catalog records
  deep-equal /workspace/caprices-ui-catalog-baseline.json (source-freeze.json).
- `npm run test:browser`: passed,39.1s, no page errors.
- `env -u CAPRICES_SKIP_NATIVE npm run test:caprices`: passed,205 checks,
  31 captures,0page errors, nativePlayed:true,125.9s. New0.36.0 full proof,
  not the historic185 or skipped192 runs. Actual real engine/native controls
  Refuge seed42:3waves,73% crystal,2stars, A receives its sticker while B active.
  Retained-A/classic/reload/resume/retry/new-B sequencing verified.

The complete command outcomes and counts follow below; raw logs and JSON are
archived under reports/suivi-0.36.0. Machine command timings/exit status: commands.json. Visual
inspection sampled actual native result, FR/EN preparation including568×320,
sticky close after full notebook scroll, compact total+reserve, R1 advice and
Canvas/WebGL shells. Reserve states are812×375,568×320 and desktop1280×800.
Fixtures and controlled progression are labeled; no child or physical-device
play is claimed. 31 caprice captures are reduced to13 representative committed
views, plus interface regression captures and the explicit offline caprice view.

## Limits and pending root work

No balancing rerun; historic3888 engine simulations are not presented as ours.
No installed French speech voice/audio assertion; no physical S24/Android touch,
TalkBack or human English review. Inherited minors: long help, small secondary
home actions, medical group explanation, result scroll cue. No new product
minor or unresolved product Critical/Important identified in this delivery pass.
Whole-branch final fresh review/council remain pending with root.


## Complete serialized checks

| Command | Fresh result |
| --- | --- |
| npm run verify | Initial and justified final run after helper change:503/503,0fail/0skip; format/types/build/budgets pass |
| npm run test:browser | Production desktop/tablet/mobile baseline pass, no page errors |
| env -u CAPRICES_SKIP_NATIVE npm run test:caprices |205checks/31captures; nativePlayed:true; one actual3wave73%/2star win |
| npm run test:locale | RED20obsolete fixture assertions; GREEN392browser+24adapter checks,915inventory/946English,0missing/added parameters/errors/unknowns |
| npm run test:missions | Native mission flow, exact envelope4+albums and old checkpoint7/no-caprice assertions preserved |
| npm run test:missions:regressions | Import refresh and retained camp after defeat pass |
| npm run test:offline |10checks,28local files, old schemas1–7, no errors/external/missing |
| npm run test:interruptions |11checks, no errors |
| npm run test:child-mobile |14check categories over6sizes, no errors |
| npm run test:interface-audit |24results pass,0failures/errors |
| npm run test:departures |12named checks, guarded mission import,108configuration codec, no errors |
| npm run test:medical-persistence |Partial stock, return, restock, cooldown, reload, export, invalid import preserved |
| npm run test:threat-preparation |11check categories,5screens, no errors |
| npm run test:reinforcements-scroll |6check categories,5touch cases+desktop, no errors |
| npm run test:audit |13/13pass; current report archived, historical fixed report immediately restored in finally |
| npm run test:presentation |14controlled scenarios including shield/shot/pause/impact, no browser errors |
| npm run test:tactical-clarity |3viewports, placement/egg/earned-stars/honey advice pass, no errors |
| node reports/suivi-0.36.0/offline-caprices.mjs |4explicit checks: English bootstrap; envelope4 B-active/A-owner; checkpoint8 Ninja+Medic; code3 native launch;26disk files,0errors/external/missing |
| npm run build:portable |FR/EN portable build pass; HTML15,089,849bytes, normal34files byte-identical before/after |
| node reports/suivi-0.36.0/portable-check.mjs |4checks offline file:// French/English/notebook/native tutorial wave+pause,0errors/HTTPrequests |
| GAME_URL="file://$PWD/dist-portable/index.html" npm run test:browser |Full desktop/tablet/mobile file-browser baseline pass, no page errors |

The two narrow helper changes are the only non-delivery-file correction, explicitly
authorized by root after reproduction. Their exact diff is
locale-fixture-correction.diff; no game source changed during delivery. Source
metadata/fixture commit: `673481f345b4c8790f1407ac13292155b0e80ba1`.

No recipe ran concurrently with another fixture, portable build, normal verify,
or Android sync/build. Browser/fixture cleanup completed before packaging.

Historical preservation:5638tracked reports/capture files compared byte-for-byte
with preflight backup, all equal; fixed audit SHA256
`5ee820a31b59950b9c05e7d5892ef492654d682b956b2f3c89286b5779c8137f`.
Modern generated root reports were moved under reports/suivi-0.36.0, leaving no
new report outside the delivery directory.18representative captures retained:
13caprices,4interface regressions,1explicit offline caprice. Raw extra interface
captures remain in ignored artifacts, without overwriting old captures.


## Normal Android package

Source commit before final documentation: `673481f345b4c8790f1407ac13292155b0e80ba1`.
Normal production build from final verify, no diagnostic build flag. Equivalent commands (executed Python orchestrator below):

```sh
export JAVA_HOME=/workspace/android-toolchain/jdk-21.0.2
export ANDROID_HOME=/workspace/android-toolchain/sdk
export PATH="$JAVA_HOME/bin:$PATH"
SERPENTS_PERF=0 npx cap sync android
# original android/capacitor.settings.gradle restored immediately in finally
cd android
./gradlew assembleDebug --offline --no-daemon --max-workers=2
```

The exact executed Python orchestrator (environment assignment, sync-finally
restoration, Gradle, copy and package assertions) is archived as
reports/suivi-0.36.0/android-package.py. Sync/Gradle logs and aapt/apksigner raw
outputs are beside it. Gradle passed in12s,93tasks (33executed/60up-to-date).

- APK: `/workspace/conquete-serpents-v0.36.0-debug.apk`,15,095,241bytes.
- APK SHA256: `7abacc43c2554b7446eff7d02429770cf1058afd55034dfa82d5147c99f6c9a6`.
- AppID `com.conqueteserpents.famille`; versionName0.36.0/versionCode46.
- Certificate SHA256: `d018e28e8ab916b4cb46ef53e2c696079415304be87cb0cf90662df94598d599`, exactly the prior certificate.
- `sensorLandscape` observed in compiled manifest as0x6; normal Capacitor config
  has no server/appStartPath; French label preserved, English Snake Attack TD.
- No INTERNET/BILLING/AD_ID permissions. Only app-owned dynamic receiver permission.
- All34dist files compared byte-for-byte with assets/public/ in the APK. Paths,
  byte counts and SHA256 are in apk-inspection.json, including source SHA.
- Original relative capacitor.settings.gradle preserved; no generated native file
  or machine-absolute Gradle path remains modified. Prior0.35artifact untouched.

No APK installation or physical-device result is claimed. No release key,
account, Play flow, network SDK or paid generation was requested or used.

## Delivery status

Delivery metadata/fixture commit: `673481f345b4c8790f1407ac13292155b0e80ba1`.
Documentation/evidence commit is returned to root after its explicit-path commit.
The final change contains no UI/model/rules/RNG/schema changes. All requested
fresh checks and optional portable/file checks have passed. The only observed
failure was the obsolete locale fixture bypass, reproduced and fixed above;
there is no unresolved product regression from this delivery pass.

Root still owns whole-branch fresh review, six-persona council, ledger completion,
remote branch/PR writes and final STOP message to parent. Candidate is unmerged
and unpublished. Public site/main remain0.35.0 until later user authorization.


Final formatting check passed for all changed package/helper/docs files;
`git diff --check` passed for tracked delivery changes. Raw archived logs/diff
and the verbatim prior Task3 Markdown intentionally preserve original trailing
spaces; staged whitespace verification excludes reports to keep raw evidence
unaltered. No product source whitespace issue is introduced.
