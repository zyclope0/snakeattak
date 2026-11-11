# One final correction wave — v0.37.0

FIX_BASE fd9e017. Repo /workspace/conquete-serpents-0322, branch feat/interface-mobile-0370.
Read AGENTS.md and approved spec docs/superpowers/specs/2026-11-10-interface-mobile-0370.md.
Authoritative COMPLETE findings: .superpowers/sdd/2026-11-10-interface-mobile-0370/whole-branch-review.md.
Address I1, M1 and M2 together. No new features, rebalancing, paid calls, remote actions or subagents.

## Binding constraints

- No core/rules/data/RNG/save/identity/permission/dependency changes. All81 protected files remain byte-equal to /workspace/serpents-interface-0370/protected-baseline.json.
-36names/announcements stay exact raw French even EN, same IDs; separate books/shared campaign retained.
-48px controls, safe areas, six cards/page and four dock allies retained.
- Restore manual/background pause; selection does not buy; actual Session/Game guards unchanged.
- Old9044proof files and8prior0.36root APK/HTML hashes preserved; new evidence external.
- Runtime currently9ca13bb; old21gates at9ca are not gates of your new runtime. Keep all old receipts/outputs.

## Findings to fix

### I1 — catalogue page/filter results remain offscreen

Report locations: src/ui/catalogPages.ts:20/24/29, src/ui/controls.ts:67–80;
new test scripts/mobile-catalogue-037-checks.mjs only asserted page counter after tools scroll.
At780×360 fresh Classic → All allies → To discover → expand tools → scroll body bottom → Next:
counter1/3→2/3 but body.scrollTop288, resulting cards y-110..-46 above body y176/height170.
Family creatures similarly hidden. Reset ACTUAL .catalog-body after explicit page/category/tab navigation,
after applying result. Remove stale #shop.scrollTop target. Do not reset on every refresh.
Regression: from bottom with tools expanded, Previous/Next, family and Ready/Future each reveal a resulting card
inside the body clip with hit testing. Keep pause, money, fixed controls and ordinary tool-scroll preservation.

### M2 — home re-entry focuses offscreen content

src/ui/homeNavigation.ts:38–48 resets wrong outer scroller then preventScroll focuses heading.
Parents780 scrollTop115 → Home → Parents retains115, focused heading y-1 above visible y114.
Reset real destination/nested mission scroller on explicit entry OR reveal target, not every refresh.
Check Parents and Classic re-entry and compact #mission-list, actual focused target visible inside clip.
Do not change save/launch/selection semantics.

### M1 — journey recipe retained but broken

tests/journey-browser.mjs:69 expects removed8data-quick-kind; :141 measures hidden home-new before navigation.
Also :72/77/100/105 need actual catalogue/disclosure routes and Classic after Home; roster picks need visible pages.
Repair complete npm run test:journey route, preserving its goals:8unique saved roster types/active slot,
real4dock + paged catalogue, recruitment budget and unitcount, encouragement, resume wave,
legacy seeded checkpoint stars/training, chapter confirmation/cancel/replacement, reload and mobile sizes.
Do not recreate hidden8cards just for test or evaluate-click hidden/inert controls.
Use existing tests/browser-entry.mjs and tests/reveal-controls.mjs; fix fixture/route as needed, never game rules.
Outputs externally isolated/restored. Actual journey route must pass; retain all business assertions.

## Verification, source and packaging

- Add meaningful RED/GREEN for all findings. Run targeted regression, test:journey, test:reinforcements-scroll
  (native positive up/down/boundary/no accidental action), test:mobile-menus, npm run verify and test:browser.
  Run other tests only if touched code/failure justifies; old21command9ca receipts remain distinct.
- Freeze/commit corrected runtime/tests before packaging; fresh normal build source must be that full SHA.
  Later docs/reports commits may differ only outside runtime. No version bump beyond0.37.0/code49 (not published).
- BEFORE overwriting0.37 artifacts, preserve current APK/HTML/ZIP+favicon/receipt under
  /workspace/serpents-interface-0370/pre-global-review/ with hashes. These are ours, old0.36 artifacts untouched.
- Reuse/adapt /workspace/serpents-interface-0370/task3/android-package.py and portable-check.mjs, not old proof scripts.
  Installed JDK21.0.2 and SDK36 there; normal SERPENTS_PERF0, restore capacitor.settings.gradle after sync.
  SameappId com.conqueteserpents.famille and samecert d018e28e8ab916b4cb46ef53e2c696079415304be87cb0cf90662df94598d599.
  No INTERNET/BILLING/AD_ID, server or appStartPath (recursive check). APK source full committed SHA.
- Rebuild normal APK plus portableHTML/completeZIP. All normal dist files must byte-match new APK.
 4coldFR/EN cases normal bundled+copied portable, zero JS errors/external requests/fontsready.
- IMPORTANT: old immutable root snapshot /workspace/serpents-interface-0370/root-review-web-manifest.json
  is9ca and WILL differ in UIJS after your fix. Preserve it and all root-visual evidence. Do NOT claim new
  APK matches that original snapshot. Record expected UI file delta and new frozen manifest separately;
  controller will inspect corrected current UI after you finish. Old authentic game remains explicitly9ca.
- Update reports/interface-0370/delivery.json, README, docs/BILAN-0.37.0.md, docs/PLAN-ACTUEL.md,
  source/QA/packaging receipt distinctions. Public site still0.36.2; no GitHub CI/push/publication claim.
  Do not overwrite old21gates, raw report appendices or before-review artifacts. Add final-fix receipts.
- Heavy proof /workspace/serpents-interface-0370/final-fix/. Full ignored report
  .superpowers/sdd/2026-11-10-interface-mobile-0370/final-fix-report.md with findings addressed,
  RED/GREEN commands/output/counts, files, fresh SHA/artifacts/hashes, preservation, limitations.
- Commit source/tests then packaging/docs; self-review. Return only status/commits/tests/concerns/report.
- This is the SINGLE final fix wave. No new feature brainstorming or extra review seats.
