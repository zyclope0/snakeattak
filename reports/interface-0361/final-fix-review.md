# Scoped final-fix review — UI0361 M1

Reviewed on 2026-11-10: base `b73892cd0c2f6560b4b0dbf25c7797876a7fe533` → fix `4f3cabe5f0cdc9961b5d5c6d233455bc1ac11cc3`. Scope is the two-path final-fix diff and its named saved proofs, following `final-fix-brief.md`; this is not a repeat of the whole-branch review. Read `AGENTS.md`, architecture, the original M1 finding, packaged U10 diff, current relevant source and the completed implementer report. No suite, build, server, subagent or Git mutation was run for this review.

**M1: ADDRESSED.** `src/ui/capriceAlbums.ts` removes the stale translated `aria-label` and its unused helper import. The existing native label has `htmlFor = name.id` and contains the same input, so its translated text now supplies the accessible name: **Nom du carnet** / **Sticker book name**. The existing text-node translation binding preserves that association when language changes. No dictionary, game rule, save format or notebook editing handler changed.

The regression assertion in `scripts/interface-0361-navigation.mjs` uses actual `page.getByRole('textbox', { name: expectedName, exact: true })`, requires exactly one match, and verifies `caprice-album-name`. It sits inside the existing FR/EN × six-size loop after the retained visible-label, 48 px, add/rename, raw-name and icon assertions. No existing assertion is removed or weakened.

Saved evidence personally read under `artifacts/interface-0361/final-fix/`:

- `red/evidence/report.json` and `red/run.log`: **68/80 pass**, exactly the 12 notebook accessible-name checks fail with `0 !== 1`; page errors empty, 73 captures. The pre-patch RED described in the report is consistent with the stale name in the base diff.
- `green/evidence/report.json` and `green/run.log`: **80/80 pass**, including all 12 notebook cases; page errors empty, 73 captures. The recorded wrappers select `INTERFACE_NAVIGATION_ONLY=1` and separate RED/GREEN report folders.
- `commands.json`, `verify/run.log`, `browser/run.log`: recorded exit 0 for fresh verify and general browser checks; **506/506 tests**, zero fail/skip, format/types/build/budgets pass; desktop/mobile checks pass with page errors empty.
- `portable/report.json`: **4/4** fresh FR/EN normal bundled-offline and portable `file://` contexts pass, no external requests or page errors. This supports cold delivery behavior; it is not a separate notebook-name test.
- `source-freeze.json`: eight recorded frozen-source checks true. No historical archive or old proof scan was repeated here.

The completed packaging section and `final-fix/android/apk-inspection.json` associate the replacement APK with **`4f3cabe5f0cdc9961b5d5c6d233455bc1ac11cc3`**. The inspection records **34/34** normal-build files identical to packaged web assets, including the new `bootstrap-L4htFEOp.js` (142,231 bytes), version **0.36.1 / code 47**, app ID `com.conqueteserpents.famille`, unchanged certificate and no server configuration. APK SHA-256 is **`adab7ad166490e35abff5f2e2dc8278be8c25e67f5b5bd49071aebe8a24243f3`**. I inspected the saved association; root owns its independent integrity verification and final index/addendum.

**New breakage in the fix diff: none found.**

**Out-of-scope observations: none.**

**Final verdict: approve the bounded M1 fix and its recorded replacement-APK association.** No residual finding from this diff requires another fix wave. The previous STOP/private-trial limits remain; no physical-device, TalkBack, child-participant or human-English validation is claimed.
