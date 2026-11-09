# Final whole-branch review and six-seat simulated council

Reviewed 2026-11-09. Base `c886b82`; candidate HEAD `026ab1a23e269e21012c355eecc8cfdf5e3047c2`. Scope: Remaining 1–8 in `docs/CAPRICES.md`, binding design spec and final-review brief. Candidate 0.36.0 / Android code 46 remains unmerged and unpublished; public/main 0.35.0 is outside this review's mutation scope.

## Verdict

**APPROVE WITH MINORS for the requested private candidate / parent trial.** No Critical or Important correctness defect identified. Two Minor presentation omissions remain below. This is not a certification of real-child usability, physical Android operation, spoken output, or human-reviewed English. It does not authorize merging or publication.

This independent whole-branch pass reviewed production integration and the final fixture correction, not merely the prior approvals. Task 3 R1 is resolved in final source: pending empty/partial/full choices now feed an isolated actual Game and refresh preparation advice, including the generic flying plan.

## Findings

### F1 — Minor — preparation announcement lacks its requested icon

Location: `src/ui/capriceView.ts:63` and `src/ui/capriceView.ts:84`.

The detail panel creates a French title, French announcement, explanation, Listen button, friend buttons and profile selector, but no icon alongside the caprice announcement. `docs/CAPRICES.md` point 1 and the design spec request an announcement with an icon. The existing ally portraits identify recruit choices; the sticker graphic appears later in the result/notebook and does not supply this cue in preparation. `docs/captures-0.36.0/preparation-1366x768-en.png` confirms the text-only title/announcement.

Effect: a small visual recognition aid is missing, particularly relevant to beginning readers; launch, rules and progress remain correct. Suggested follow-up: a locally drawn decorative caprice symbol alongside the announcement, keeping canonical French text intact and avoiding duplicate screen-reader speech. No generation or rule change is needed.

### F2 — Minor — favorite quick cards omit the reserve-blocking explanation

Location: `src/ui/squadControls.ts:79` and `src/ui/squadControls.ts:82`.

Favorite quick cards correctly disable purchases through `canSpend`, but their label remains only ally name and ordinary price. For example, a 55-coin friend with total 500 / protected reserve 450 is disabled with no reserve reason on that card. The dock's accessible label and catalogue's visible explanation do include the protected-reserve reason (`src/ui/battleDock.ts:103`, `src/ui/controls.ts:348`). The shared HUD shows the reserve, so the overall rule is available, but this purchase surface does not explain its own gray state as the spec requests.

Effect: local clarity/accessibility inconsistency; the actual reserve cannot be spent and no economic defect was found. Suggested follow-up: use the existing translated reserve explanation in the quick-card accessible label and an appropriate visible status when reserve is the blocking condition.

No additional actionable branch-specific finding was identified. The inherited long help, small secondary home actions, medical-group explanation and result scroll cue remain nonblocking follow-up topics, not newly proven regressions.

## Cross-component assessment

- **Owner and shared campaign:** `src/bootstrap.ts:170` validates the next Game first, synchronizes/records the previous Game before capturing a new active owner, and retains the owner for retry. `src/bootstrap.ts:197` resumes the retained expedition without changing its owner; classic transitions retain the album controller. `src/bootstrap.ts:46` caches award results per Game. `src/capriceAlbums.ts:119` requires a complete valid victory and uses retained owner, while `src/missionProgress.ts:112` keeps shared best-star behavior. Native recipe assertions at `scripts/caprices-036-browser.mjs:296` onward cover A launch, B selection, classic, reload, A resume/win, owner-book opening, A retry and fresh B launch. Final `native-owner.json` intentionally reflects the last B launch, with the earlier sticker present only in A.
- **Launch and friend semantics:** `src/ui/capriceLaunch.ts:6` checks mission/star gate and constructs/validates the candidate before assembly changes. Empty arrays skip the engine method; partial/full selections use the engine method. `src/checkpoints.ts:137` restores explicit choices before other state, with engine rejection of duplicates/hero/unavailable types. It never infers choices from surviving or initial units. Tests at `tests/caprices-persistence-036.test.ts:68`, `:85`, `:99` and `:144` cover zero/partial/full, death, invalid input and legacy 6/7 empty behavior. Retry uses the actual chosen getter, including types retained after recruitment.
- **Formats and atomicity:** Checkpoint 8 is caprice-specific; historical normal encodings remain on existing paths. Code 3 covers caprice suffix and rules bit in its checksum, without profile/name/friend choices. `tests/caprices-persistence-036.test.ts:25` enumerates 3,024 round trips; historical byte witnesses remain at `:178`. Family 4 validates albums and references; older sync callers retain loaded albums. `src/bootstrap.ts:230` commits validated import to storage before replacing memory. Legacy import explicitly replaces albums only after the UI warning. `tests/caprices-albums-036.test.ts:211`, `:281`, `:320` cover owner retention, omitted-argument preservation and failed writes/imports.
- **Rules and purchases:** Frozen engine files have no source diff. All three recruiting surfaces read `capriceAllows` and spendable gold. Repair/training use current 80/90 costs; honey controls/help read `noHoney`. Preview budget calls `capriceBudget`; final-wave king projection replaces the last mission entry without classic court. R1's `src/ui/missionScouting.ts:7` delegates availability to a fresh Game and does not change retained Game/RNG. Browser FR/EN empty/partial/full/deselection assertions are at `scripts/caprices-036-browser.mjs:124` onward.
- **36 albums and results:** Slots are constructed by mission + set + unique caprice ID (`src/ui/capriceAlbums.ts:71`), preserving same-name challenges separately. Profiles are local names projected as raw text. Result records are separate from shared stars; repeated wins show already-owned status; losses repeat the original announcement without sticker or economic reward. The notebook is built once and updates only while open or explicitly requested (`src/ui/capriceAlbums.ts:176`), avoiding 36-card rebuilds per frame.
- **Locale and render:** French identity leaves use raw data plus `lang=fr`; translations apply around them. The defeat path clears the stale whole-node binding before adding a raw French child. Speech requires explicit click and an installed `localService` French voice, and is cancelled on close/change. Shell rendering reads actual `unit.shell`, increases visual size, clears pooled graphics each frame and follows pose/flip/rotation/alpha. It does not write collision, combat or speed fields. Canvas and WebGL captures show matching shell/outline treatment.

## Evidence read and limits of method

Read AGENTS.md, architecture guidance, binding spec/brief, ledger, all production diff areas, changed tests/harnesses, browser recipe, delivery report and final fixture correction. The whole stat covers 180 files; the large supplied diff is dominated by archived evidence. Named fresh logs/reports were sampled instead of dumping historical logs. No tests were rerun and no server was started.

- `reports/suivi-0.36.0/verify.log:518`: 503 tests, 503 pass, 0 fail, 0 skipped; types/build/budgets and format evidence also present. `source-freeze.json` records three byte-identical engine files and 36 deep-equal catalog records; production source diff contains no engine/catalog changes.
- `reports/suivi-0.36.0/caprices.log:5` and `caprices.json`: 205 checks, 31 captures, no page errors, nativePlayed true. This is the fresh final run, not prior 185/192 evidence. Exactly one actual native engine game is claimed: Refuge seed 42, three waves, 73% crystal, two stars. Starting family progress was controlled. Outcome/readiness/shell fixtures remain explicitly separate.
- `reports/suivi-0.36.0/locale.log:5`: 915 inventoried phrases, 946 English entries, no missing/added parameters; 24 adapter checks and 392 browser checks. The fixture correction legally unlocks missions then uses native button click, preserving production locked-code guards and exact title/ID/wave assertions.
- `reports/suivi-0.36.0/commands.json`: fresh serialized baseline browser, missions/regressions, medical persistence, interruptions, child-mobile, interface, departures, threat preparation, reinforcements, audit, presentation and tactical clarity outcomes. The observed locale failure is archived and followed by the justified fixture correction and passing rerun.
- `offline.json`, `offline-caprices.json`, `portable.json`, `portable-browser.log`: legacy offline reads plus explicit offline envelope4/checkpoint8/code3 and English coverage; portable file:// startup and native tutorial/pause evidence. These are local Chromium checks, not fresh remote CI.
- `apk-inspection.json:1`, Android build/badging/permissions/signature evidence and Task 4 report: normal debug APK 0.36.0/code46, unchanged AppID/certificate, 34 bundled dist files identical, no INTERNET/BILLING/AD_ID permission. Packaging evidence does not prove installation or runtime on S24.

Visually inspected existing captures: desktop English preparation, 568×320 preparation and scrolled notebook, 568×320 reserve, actual native A victory, Canvas shell, WebGL shell and full-choice R1 English plan. Preparation footer and notebook close remain reachable; tiny bank copy and scroll-heavy detail remain practical usability risks.

## Six-seat simulated council

These are six analytical lenses applied by one reviewer to source and recorded evidence. The three age seats are explicitly simulations: no children were recruited, observed, quoted or represented as having tested this candidate. The technical seats are also review perspectives, not claims of six independent human reviewers.

| Seat | Evidence-supported assessment | Decision and remaining risk |
| --- | --- | --- |
| Architecture / persistence | Owner capture, retained retry/classic state and prevalidated launch compose correctly; explicit schemas preserve prior formats; one authoritative family write and failed-import ordering protect current data. Native A/B sequence and focused tests support the cross-layer result. | Approve. Physical crash/storage/WebView behavior beyond the recorded cases remains unverified. |
| Mobile / accessibility | Native buttons/selects, pressed states, raw French language attribution, pause ownership and focus return are present. 568×320 footer and sticky notebook close are visible; browser assertions measure 48px actions with safe-area margins. | Approve with F2 Minor. Small reserve copy, long preparation scrolling and inherited result scroll cue merit parent trial. TalkBack and actual Android touch remain unverified. |
| Localization / rendering | Protected French names/announcements and translated English context match the explicit instruction; profile names stay data. R1 full-choice advice no longer recommends Archer. Both shell backends preserve visual contour while scaling actual shells. | Approve with F1 Minor. Human English quality, local French voice playback and unsampled animation poses are not certified. |
| Simulated child aged 6 | Ally portraits and the large launch button provide recognizable choices; the earned sticker is clearly shown in the real win capture. Missing announcement icon and long optional-choice explanation may increase adult reading assistance. | Suitable for a supported private trial; F1 matters most to this lens. No claim that a real six-year-old understands the rules unaided. |
| Simulated child aged 9 | Star gates and two challenge rows expose progression; selecting friends has immediate pressed state and advice. A visible result opens the correct owner's notebook despite another active book, reducing sibling attribution confusion. | Suitable for private trial. The bank total versus available amount may still need explanation, especially F2 and tiny mobile bank text. |
| Simulated child aged 12 | Exact codes, reroll/retry consistency, visible rule multipliers and retained friend choices support experimentation. R1 removes misleading strategy advice; separate collections coexist with shared family stars without rankings. | Suitable for private trial. Identical sticker artwork across 36 named slots and scrolling may limit visual variety; this is a design risk, not a new requirement or correctness finding. |

## Cannot verify / remaining nonblocking risks

- Recorded tests were inspected, not independently rerun. Captures establish sampled browser states, not every name, language, scroll position, device and interaction sequence.
- No physical S24 install, Android touch session, TalkBack run, measured device performance or real native-English human review is established.
- Local French voice availability and audible playback were unavailable in headless evidence. The source-level local-only and explicit-action boundaries are verified by inspection.
- One native completed caprice game plus controlled progression does not demonstrate 36 natural child playthroughs or new balance measurements. Historic 3,888 simulations are not this delivery's work.
- Candidate publication/merge and remote CI are not performed or attested by this review. Root owns report integration, final remote Git actions within authorization, and STOP.

No product edits, tests, servers, staging, commits, pushes, merges or publishing were performed by this reviewer. Only this requested ignored review report was written.
