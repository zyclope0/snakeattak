# Scoped final F1/F2 fix re-review

Reviewed 2026-11-09. Base `026ab1a23e269e21012c355eecc8cfdf5e3047c2`; candidate HEAD `c2f66d5747950f1e3365690ceaf3bd26c9412f23`; product/test source `23a37debbc8659a46a6ad4c53e0b2a1deba87ae3`.

**APPROVE for the scoped final fix wave. F1 ADDRESSED. F2 ADDRESSED. Blockers: none. New minors or fix regressions: none identified.**

This re-review covers the two findings in `final-review.md` and actual regressions introduced by their fixes. It does not replace the prior whole-branch review or expand its device/human-testing claims. The requested fixes meet the binding presentation requirements in `docs/CAPRICES.md` and `docs/superpowers/specs/2026-11-09-caprices-interface-design.md`.

## F1 — ADDRESSED

`src/ui/capriceView.ts:66` adds a separate announcement wrapper containing the reused original local badge and the existing announcement paragraph. `src/ui/capriceAlbums.ts:27` only exports the existing SVG helper; its literal and prior callers are unchanged. The SVG is `aria-hidden=true`. `src/ui/caprices.css:49` constrains it to 32×32 px with fixed flex basis and an 8px gap. No new asset or dependency is needed.

The canonical leaf remains a `frenchLeaf`, with `data-copy-raw` and `lang=fr`; `announce.textContent = caprice.announce` and speech input remain unchanged. The graphic is outside that leaf, so neither the exact French string nor spoken announcement gains decorative text. The added FR/EN assertions check exact announcement, language attribution, sibling graphic, geometry and reachable footer actions at 1280×800 and 568×320. I inspected the final `caprices-visibility/final-icon-1280-fr.png` and `final-icon-568-en.png`: the badge is visible beside the original French announcement, and the footer remains reachable.

## F2 — ADDRESSED

`src/ui/squadControls.ts:65` derives a presentation-only reserve condition for an unlocked favorite from the same protected-bank/spendability helpers already used by the catalogue. The small visible status uses the existing translated reserve phrase; the accessible name retains the ordinary price and appends the existing translated reserve reason. Status returns to the ordinary label when affordable. Existing hidden, disabled, pressed, unlock, pause, won/lost, purchase and friend-filter predicates are unchanged.

The final test opens Favorites through its native summary, verifies that the actual favorite and status are visible, checks whole-card viewport bounds/minimum size, disabled state, FR/EN reason, retained accessible price and clearing after affordability. I inspected `caprices-visibility/final-reserve-favorites-1280-fr.png` and `final-reserve-favorites-568-en.png`: actual Favorites cards are open and show the wrapped reserve reason. Earlier `green-debug` captures are intermediate closed-disclosure fixture evidence and are explicitly labelled as such in the implementation report; they were not used as final visual proof.

## Evidence association and verification

Read the brief, prior review, fix report, supplied five-file source/test diff, focused helper/localization dependencies and named fresh proofs. No suites or servers were rerun. The saved confirmed RED lists the expected 12 F1/F2 failures across two languages/two sizes; the intermediate fixture failures are distinguished from product defects.

- `caprices/report.json` and `caprices.log`: **269 checks, 39 captures, errors []**, `nativePlayed=true`; the full-run recipe explicitly removes `CAPRICES_SKIP_NATIVE`. Logs show all three actual waves and the native ownership/victory success. The reported controlled-family/actual-engine distinction is maintained.
- `caprices-visibility/report.json` and its log: **268 checks, 38 captures, errors []**, `nativePlayed=false`; the strengthened test-only run explicitly uses `CAPRICES_SKIP_NATIVE=1`. It adds native disclosure opening and visible/card bounds checks. Comparing archived recipes confirms those are the only differences. It is not a second native playthrough.
- Independently read and hashed current product files: all four match `product-fingerprint.json`. Current final recipe matches its archive; both archive SHA-256 values match `source-association.json`. Current frozen engine/catalogue/mission files match the saved freeze hashes; the supplied source diff changes none of them.
- Fresh saved `verify.log`: **503 tests, 503 pass, zero failed/skipped**, types/build/budgets pass. Baseline browser passes with no page errors. Locale reports **392 browser + 24 adapter checks**, zero failed/errors/unknowns and no missing/added parameters. Child-mobile reports six sizes and no errors; scrolling reports five cases plus desktop and no errors. Portable reports four offline checks, errors/HTTP requests empty. Commands are serialized in the archived scripts and all recorded exits are zero.
- Independently hashed the actual final APK: **15,151,926 bytes**, SHA-256 `c6909b41534b3f576cf59cc8bff55b32e801e8180a8022d2395770bcdf07cddb`. All **34** current normal `dist` files match its `assets/public/` bytes. Normal before/after portable manifests are identical. APK config has no server/appStartPath. Saved manifest/badging/signature/permissions show AppID `com.conqueteserpents.famille`, version 0.36.0/code46, sensorLandscape, unchanged certificate and no INTERNET/BILLING/AD_ID. Old/new inspection AppID and certificate match.
- Independently rehashed all **113** entries in `preserved-before.json`: **zero changed**, including the old APK and historical 205-check proof. The original evidence remains separate.

No additional actionable regression was found in the narrow source changes or their immediate dependencies. Existing physical S24, Android touch/TalkBack, audible French voice, real-child and human English-review limits remain as recorded in the prior review. No merge or publication is authorized by this report.

Only this requested ignored review file was written. No product edits, tests, servers, index/Git operations, subagents, commits, pushes, merges or publication were performed by this reviewer. Root owns final documentation/council/PR/STOP.
