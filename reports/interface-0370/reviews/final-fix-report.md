# Final correction report — mobile interface 0.37.0

Status: I1, M1 and M2 addressed in the single authorized correction wave. No new features, game rules, balance, assets, paid calls, dependencies, identity, permission, save or RNG changes. No subagents or remote actions.

FIX_BASE: `fd9e017`. Frozen corrected runtime/tests: `b31933bf9f6dc56b9c7bf4d286068f52ff3bf28a`.
Packaging/docs commit: `26763cde2880995f2c0af64722c0bdae7ef0a636` (six documentation/receipt files only; worktree clean)..
Version unchanged: **0.37.0 / Android code 49**. Public site remains **0.36.2**.

Requirements read: final-fix-brief.md, authoritative whole-branch-review.md, approved specification, AGENTS.md and architecture. Systematic diagnosis and RED/GREEN were used. Controller retains final re-review, push, merge and publication.

## Findings and bounded fixes

### I1 — reveal explicit catalogue navigation results

Root cause: pagination callbacks only refreshed hidden cards; they retained the real `.catalog-body` scroll position. The family callback reset `#shop`, which is now a non-scrolling child. A new result could remain entirely above the body clip after tools scrolling.

`src/ui/catalogPages.ts` now marks a one-shot reveal request for Previous/Next and `reset()`. `refresh()` applies resulting card visibility first and resets the real body only for that explicit request. `src/ui/controls.ts` removes the stale child scroll target. Existing tab/family reset calls share this behavior. Ordinary refreshes preserve tool scrolling. No recruitment or pause authority changed.

### M2 — visible focused heading on destination re-entry

Root cause: navigation reset only `#home-screen` before focusing a title with `preventScroll`, but Parents/Classique scroll in their own destination and the compact mission map in `#mission-list`.

`src/ui/homeNavigation.ts` resets the entered destination and, for Missions, its nested map before heading focus. Resets occur when changing destinations, not on ordinary refresh. Saves, launches, selected mission and menu handlers remain unchanged.

### M1 — retained journey recipe migrated completely

`tests/journey-browser.mjs` now awaits the asynchronous real home bootstrap; selects only visible roster cards and deliberately changes roster page before choosing a replacement; checks eight distinct saved identities, actual removed/added kinds, active slot and persistence after reload; checks the real four-card dock and six-card paged catalogue instead of removed eight quick cards; opens recruitment, encouragement and training through `revealControl`; navigates to Classic after Home for chapter replacement; and measures `#home-new` after its destination is visible.

All business goals remain: new camp gold 300 / units 3, ninja placement gold 150 / units 4, encouragement consumed, Home/re-entry wave 1, seeded legacy storage checkpoint stars and training, training-choice lock, chapter confirmation/cancel/replacement, reward count, saved stars after reload, mobile no horizontal overflow/title clipping, usable new-game control, and widths 1440/390/320/844. No hidden/inert evaluate-click, replacement production fixture, game-rule change or hidden eight-card recreation was added. `JOURNEY_REPORT_DIR` isolates new screenshots.

### Focused regression

`scripts/mobile-navigation-final-037-browser.mjs` runs the actual menu with a 780×360 touch context. It checks Parents, Classic and the compact mission scroller after scrolling to bottom and re-entering. It then expands catalogue/tools, establishes a genuinely positive bottom scroll, confirms ordinary refresh preserves it, and tests Next, Previous, creatures, all, Ready and Future. Each resulting page must reset to 0 and expose a real card inside the body clip verified by `elementFromPoint`; navigation cannot spend money. The retained 519-check mobile suite covers fixed controls, pause restoration/manual/background/nested pause, safe areas, no-spend selection, both languages and protected French names.

## RED evidence and diagnosis

All raw outputs are retained under `/workspace/serpents-interface-0370/final-fix`.

- `FINAL_NAVIGATION_REPORT_DIR=/workspace/serpents-interface-0370/final-fix/red-navigation node scripts/mobile-navigation-final-037-browser.mjs`: **exit 1,9/9 expected behavioral failures,0 JavaScript errors**. Parents scroll 115/title y -1 / clip top 114; Classic scroll 335 / title y -221; Missions nested scroll 620 / title y -488. All six explicit catalogue navigation actions left results outside the clip. Both nested tools were expanded, giving body scroll 1094 rather than the reviewer’s shallower 288; it is the same stale real-scroller cause. Raw labels/rectangles/hit results: `red-navigation/report.json`; console: `red-navigation.log`.
- Initial `npm run test:journey`: **exit 1**, “Home menu missing”; inspection identified the recipe’s missing asynchronous language-bootstrap wait. After adding the real visible-home wait, `npm run test:journey`: **exit 1**, expected obsolete `[data-quick-kind]` assertion **0 !== 8** (`red-journey-stale-cards.log`).
- First migrated journey attempt exposed that the old “other” selection simply reselected the just-removed first card. The new meaningful identity assertion failed, rather than treating that as a swap. Navigating to the next visible roster page establishes a different real replacement. Retained log: `green-journey-attempt1.log`; no extra production fix resulted. The complete migrated route then passed (`green-journey-attempt2.log`).
- The initial integrity comparison flagged the already-approved plan-status edit in fd9e017 against Task3’s older archive. Current bytes were proven identical to this wave’s before snapshot; the parent confirmed they must remain. That preexisting difference is explicitly recorded, not restored or hidden.
- A receipt formatting check after adding controller evidence requested Prettier formatting for the new JSON; it was formatted and final checks passed. No final test, build, integrity or format failure remains.

## GREEN verification

`npm run verify` completed **exit 0**, **549 tests passed/0 failed**, formatting, types, normal production build and size budgets. Log: `verify.log`. It ran on the exact runtime/test contents subsequently committed as `b31933bf9f6dc56b9c7bf4d286068f52ff3bf28a`; `source-freeze.json` records that distinction. Final normal build from the full committed SHA ran again for packaging, below.

Frozen-source gate results (all sourceSHA fields equal `b31933bf9f6dc56b9c7bf4d286068f52ff3bf28a`):

| Command | Exit | Duration | Log |
| --- | --- | --- | --- |
| `node scripts/mobile-navigation-final-037-browser.mjs` | 0 | 9.6 s | `navigation.log` |
| `npm run test:journey` | 0 | 14.6 s | `test-journey.log` |
| `npm run test:reinforcements-scroll` | 0 | 85.0 s | `test-reinforcements-scroll.log` |
| `npm run test:mobile-menus` | 0 | 23.8 s | `test-mobile-menus.log` |
| `npm run test:browser` | 0 | 85.8 s | `test-browser.log` |

Counts: focused navigation **9/9**; journey full business route and four viewport widths; native touch **5 sizes,5 genuinely positive up/down/boundary cases plus desktop**; mobile menus **519 checks**; normal browser desktop/mobile route, **0 JS errors**. Native scroll ranges were 13/53/112/112/53 px; each returned down to 0, reached its real lower limit and preserved document Y 0, without accidental selection/purchase/close. Detailed receipts: `qa-results.json`, `navigation-final/report.json`, `reinforcements-scroll/report.json`, `mobile-menus/report.json`.

No old 21-command gate is relabelled. `delivery.json.historicalQA` retains those command results and source 9ca13bb; `delivery.json.qa` is the six current verification commands only. No broad re-audit of unchanged game rules or extra product gate was added.

## Packaging and provenance

Runtime was committed before these serialized steps. Adapted the existing Task3 `android-package.py` and `portable-check.mjs` into this final-fix proof directory; did not invoke obsolete proof recipes.

| Step | Exit | Duration | Log |
| --- | --- | --- | --- |
| normal-build | 0 | 11.3 s | `normal-build.log` |
| android-package | 0 | 13.2 s | `android-package.log` |
| portable-build | 0 | 10.4 s | `portable-build.log` |
| portable-package | 0 | 0.7 s | `portable-package.log` |
| cold-offline | 0 | 8.1 s | `cold-offline.log` |

Normal build uses `SERPENTS_PERF=0`. Android uses installed JDK 21.0.2 / SDK 36 and offline Gradle; capacitor.settings.gradle is restored in `finally` after sync. APK is the same `com.conqueteserpents.famille`, version 49 / 0.37.0, sensor landscape. The signature certificate SHA-256 remains `d018e28e8ab916b4cb46ef53e2c696079415304be87cb0cf90662df94598d599`. Manifest permissions contain no INTERNET/BILLING/AD_ID. Recursive packaged JSON inspection rejects server/appStartPath keys, including nested objects/lists. Every one of 34 normal dist files is byte-equal to its APK entry.

| Corrected artifact | Bytes | SHA-256 |
| --- | --- | --- |
| `/workspace/conquete-serpents-v0.37.0-debug.apk` | 15168726 | `6e9494f467f7d02800328383909f3039cc0d36d83e7a05ba867c5ce175a36a7b` |
| `/workspace/conquete-serpents-v0.37.0-portable.html` | 15125054 | `f92179c8398bbc37688331b225575aa444e205fc354bd46c9bd36d892e7f51f1` |
| `/workspace/conquete-serpents-v0.37.0-portable.zip` | 10852935 | `cd27bfb499a4a1fb0b6f44335422be7772e87bae0a7fb06b924fd2cf27cad342` |
| `/workspace/icon-512-BPQ3IZsK.png` |356179| `f39bf630c3da1e89d91633acbb5fae8268a43e9e5c5a22545c820df0b449b0ab` |

ZIP contains exactly five files: renamed portableHTML, favicon, prototype V4, font licences and asset provenance; each entry is byte-equal to its generated source. Source in both packaging receipts is the full frozen runtime SHA. Normal HTML remains 32475/32768 bytes. Receipts: `android/apk-inspection.json`, `portable-artifact.json`.

Four fresh cold Chromium cases passed: bundled offline and **copied** file:// portable, each in FR/EN. All had navigator.online false, language correct, fonts ready before observed canvas text, **0 external requests**, **0 JavaScript errors**. Evidence, canvas font checks and four screenshots: `offline/report.json`; console `cold-offline.log`.

## Frozen snapshot distinction

The preserved original coordinator snapshot remains 9ca13bb, including its original manifest and authentic three-wave gameplay. It is not a test of the corrected runtime and does not match the new APK UI.

`corrected-web-manifest.json` separately freezes the new 34 normal files. `frozen-snapshot-delta.json` records the expected old→new delta: index.html changed; old bootstrap-Bc08rJdp.js/index-vuvoutOW.js removed; corrected bootstrap-C-Dj4wfG.js/index-D73S7WBW.js added. **31 files unchanged**, including rules-BvS96c7w.js, Phaser, CSS, locale, images, fonts and prototype.

Controller’s separately built corrected snapshot `/workspace/serpents-interface-0370/release/corrected-review-manifest.json` is source `b31933bf9f6dc56b9c7bf4d286068f52ff3bf28a` and **all 34 hashes identical** to the new manifest and hence APK. Controller separately supplied a GREEN visible-navigation check at 1280×800 FR / 812×375 EN / 780×360 FR: all 9 destination focus targets visible; page/family after tools bottom reveal hit-testable cards at scroll 0; 0 JS errors. Its independent report is `/workspace/serpents-interface-0370/release/after-fix-verified/report.json`, outside this agent’s automated gate counts.

## Preservation

Before overwriting any 0.37 artifact, preserved APK, copiedHTML, completeZIP, favicon and delivery receipt under `/workspace/serpents-interface-0370/pre-global-review/`, with the following hashes:

| Preserved old 0.37 file | Bytes | SHA-256 |
| --- | --- | --- |
| `conquete-serpents-v0.37.0-debug.apk` | 15106817 | `07b2ab7a1288e2eec57c990e05201c3ee63afd0c5dd95b9dbbfc24280dd066bb` |
| `conquete-serpents-v0.37.0-portable.html` | 15124867 | `fe758b5c047ea53f36bd9db99eb696e066ac65025da383eb0f9523cf7031886c` |
| `conquete-serpents-v0.37.0-portable.zip` | 10855887 | `7c8805832462307cc9bf32a49bee96bf7f60e6fbd47e7f65d0bc70c8c4278277` |
| `icon-512-BPQ3IZsK.png` | 356179 | `f39bf630c3da1e89d91633acbb5fae8268a43e9e5c5a22545c820df0b449b0ab` |
| `delivery.json` | 7281 | `68865e5b085c7e6d6b0212602de2080d58b37845be48f8601949ecaec92a26f0` |

`pre-global-review/manifest.json` remains the preservation receipt. All five preserved copies verified after packaging. All **81 protected files** remain byte-equal to `/workspace/serpents-interface-0370/protected-baseline.json`; runtime diff from frozen source is empty.

Historical archive audit covers **9044 files** with no newly changed proof. The approved lot-plan status already changed by fd9e017 is byte-equal to this wave’s FIX_BASE snapshot; its earlier bytes remain in Task3’s historical-docs archive. PLAN-ACTUEL is the explicitly authored status document. Nothing reopens its closed lots. The same **8 required prior 0.36 APK/HTML hashes** plus all **23 existing root 0.36 files** are unchanged. Original root 9ca snapshot all 34 hashes verified; root-review-web-manifest hash remains `32b4d105c6cd886684ea1bd0bb42528333c73241084256136360151a015431cd`. Root-visual evidence and all old 21 gate receipts were untouched.

Current proof baseline of 9082 docs/reports/artifacts files was copied before work. After new gates, 8647 artifact/report files were checked; two standard-browser screenshots were copied out then restored; one new default-path RED-journey screenshot was copied out then removed. Actual new final journey/mobile/native/navigation outputs were already isolated externally. Nothing overwrote historical proof to make it look new. Receipts: `before-manifest.json`, `generated-output-preservation.json`, `final-integrity.json`.

## Files and self-review

Source commit changes only `src/ui/catalogPages.ts`, `src/ui/controls.ts`, `src/ui/homeNavigation.ts`, `tests/journey-browser.mjs`, and the new focused script. Minimal one-shot navigation reset, no CSS change, no core/controller mutation, six cards and four dock allies retained. Manual/background pause, existing Session/Game guards and protected French identities remain covered by retained suites and protected hashes.

Packaging/docs commit changes only README.md, docs/BILAN-0.37.0.md, docs/PLAN-ACTUEL.md, reports/interface-0370/README.md, delivery.json and new final-fix.json. Existing raw report appendices and task reports were not rewritten. Self-review checked the source diff, resulting receipt semantics, exact old 21-command values retained under historicalQA, new/source SHA consistency, all artifact hashes, recursive config checks, protected/history preservation, and expected UI-only snapshot delta. Final document formatting and `git diff --check` pass; no runtime difference after freeze.

## Limits and remaining controller actions

No physical Galaxy S24/WebView, TalkBack, children or native-English editorial session. Chromium touch/layout/transport checks do not certify those. No new balance conclusion; old authentic gameplay remains explicitly9ca13bb. No paid image generation. No network push, PR merge, deployment, publication or remote CI claim by this agent. The controller’s one final scoped re-review and subsequent authorized release actions remain pending.

Full heavy evidence: `/workspace/serpents-interface-0370/final-fix`. Compact tracked receipts: `reports/interface-0370/final-fix.json` and `delivery.json`.
