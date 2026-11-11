# Final scoped re-review — interface mobile 0.37.0

10 November 2026. **APPROVED for the scoped correction wave.** I1, M1 and M2 are addressed. No new breakage was found in the supplied fix diff.

## Scope and method

Reviewed the supplied `final-fix-review-package.diff`, FIX_BASE `fd9e017` through HEAD `26763cde2880995f2c0af64722c0bdae7ef0a636`; corrected runtime/tests are frozen at `b31933bf9f6dc56b9c7bf4d286068f52ff3bf28a`. Read the final-fix brief, authoritative whole-branch findings, implementer report, approved specification and repository instructions/architecture. Inspected surrounding code only to assess the corrections. This is the single requested targeted re-review, not a new whole-branch review.

Checked the supplied RED/GREEN receipts and raw outputs against the changed code. No suite was rerun: the existing targeted evidence answers the three findings, including the controller's independent immutable-b319 check. Read-only hash assertions additionally checked the protected baseline, current artifacts, APK entries, corrected normal bundle/controller manifest, prior-artifact preservation and historical command provenance. The only file written by this reviewer is this report; no source, index, branch, build or historical proof was changed. No subagents were used.

## Finding verdicts

| Finding | Verdict | Assessment |
| --- | --- | --- |
| I1 — catalogue page/filter results offscreen | **ADDRESSED** | `src/ui/catalogPages.ts:20` retains the actual `.catalog-body`; explicit Previous/Next and `reset()` request a one-shot reveal. `refresh()` first applies resulting page visibility and then resets that body at `:47`. `src/ui/controls.ts:67` removes the stale `#shop` reset while retaining family/Ready/Future reset routes. Ordinary refresh does not request a reveal. The regression starts from genuinely positive bottom scroll with expanded tools, checks all six explicit navigation routes, verifies a resulting card inside the clip through hit testing, and checks unchanged gold. |
| M1 — retained journey migration | **ADDRESSED** | `tests/journey-browser.mjs:35` waits for the real asynchronous home bootstrap. Visible roster selectors and a deliberate next-page replacement preserve eight distinct saved identities, active slot, actual replacement and reload persistence (`:53`–`:91`). The recipe checks the real four-card dock and paged catalogue; `revealControl` opens recruitment, encouragement and training through existing visible routes (`:85`, `:100`, `:124`). Classic navigation precedes chapter actions and mobile new-game measurements (`:129`, `:166`). Budget/unit-count, encouragement, resume wave, seeded legacy stars/training, chapter confirmation/cancel/replacement, rewards, reload and all four viewport goals remain. The actual full journey command passed. No hidden/inert evaluate-click or recreated eight-card presentation was introduced. |
| M2 — home re-entry focus offscreen | **ADDRESSED** | `src/ui/homeNavigation.ts:33` detects a destination change; `:39`–`:43` reset the actual destination and nested mission scroller before heading focus. Remaining on the same destination does not reset scrolling. Parents, Classic and compact Missions re-entry have focused headings fully inside their scroll clip in the regression. Existing save, launch, selection and focus-target decisions are unchanged. |

## Evidence and delivery consistency

- The navigation RED report records nine behavioral failures and no JS errors; GREEN records **9/9**, no errors. The new script checks card visibility/hit testing rather than merely a changed page counter. Its 150 ms ordinary-refresh check also guards preservation of tools scrolling.
- `test-journey.log` records the complete route green at widths **1440/390/320/844**, with all business flags true, no page errors and no external requests. The obsolete-card RED failure remains recorded separately.
- Raw final logs agree with the implementer report: verify **549 passed, 0 failed**, normal build/types/budgets; native reinforcement scroll **5 positive cases plus desktop**; mobile menus **519 checks**; normal browser desktop/mobile route with no JS errors. Native scroll evidence includes positive up/down motion and actual lower boundaries **13/53/112/112/53 px**, without accidental actions.
- Four cold offline results cover normal bundled and copied portable `file://`, each FR/EN, with fonts ready, no external requests and no JS errors.
- The independent controller report `/workspace/serpents-interface-0370/release/after-fix-verified/report.json` identifies immutable source **b31933b** at **1280×800 FR / 812×375 EN / 780×360 FR**. All **nine** re-entry focus targets are visible; explicit Next/family results are visible at body scroll 0; errors are empty. This evidence remains separate from the implementer's automated counts.
- Independently verified all **81 protected file hashes** against `protected-baseline.json`. The fix diff changes only the three presentation files, journey recipe, focused regression and delivery documentation/receipts. No rules, values, RNG, saves, identities, permissions or dependencies change. Six-card pagination, four dock allies, 36 raw French identities/announcements, separate books/shared campaign and existing pause/purchase authority are preserved by this bounded change.
- Independently verified all **34 corrected normal files** against current `dist/`, the corrected controller manifest and the APK entries. The APK's two additional standard Cordova bridge files are outside the normal dist manifest. Runtime source is **b31933bf9f6dc56b9c7bf4d286068f52ff3bf28a**; the later HEAD commit changes documentation/receipts only.
- Actual corrected APK SHA-256 is **`6e9494f467f7d02800328383909f3039cc0d36d83e7a05ba867c5ce175a36a7b`**. Actual portable HTML/ZIP hashes match delivery.json (**`f92179c8398bbc37688331b225575aa444e205fc354bd46c9bd36d892e7f51f1`** / **`cd27bfb499a4a1fb0b6f44335422be7772e87bae0a7fb06b924fd2cf27cad342`**). APK receipt retains version **0.37.0/code49**, app ID and certificate, normal no-server configuration and permission checks.
- Independently verified all **five preserved prior 0.37 copies**, the original root manifest hash **`32b4d105c6cd886684ea1bd0bb42528333c73241084256136360151a015431cd`**, and exact retention of all **21 historical command results**. Those commands and authentic gameplay remain explicitly **9ca13bb**. Delivery correctly marks the old snapshot as not matching the corrected APK and records the expected UI module/index delta with **31 unchanged files**; it does not relabel old proof as b319.
- The final integrity receipt records preserved **9044 historical proof files**, **8 required prior 0.36 artifacts** and **23 existing root 0.36 files**, with the preexisting approved plan-status difference explained. These historical inventories were inspected as receipts rather than rerun as a new broad archival audit.

## New breakage

**None found.** No new Critical, Important or Minor finding requiring a severity/file:line entry arises from the supplied fix diff.

## Out-of-scope observations

Physical Galaxy S24/WebView, Android hardware Back/system bars, TalkBack, children's comprehension and native-English editorial quality remain unverified by this re-review. Chromium receipts and bundle hashes do not establish those outcomes. No new balance conclusion is drawn; the authentic gameplay proof remains historical 9ca13bb. The partial image quote remains separate, with no paid generation. No remote CI, push, merge, deployment or publication was performed or claimed; the public site remains 0.36.2.

## Final verdict

**APPROVED — I1 ADDRESSED; M1 ADDRESSED; M2 ADDRESSED.** No further correction is requested within this scope. The corrected artifacts and fresh verification are consistently tied to b31933b, with the previous 9ca13bb proof preserved and clearly distinguished. Subsequent integration/publication remains the controller's action under the existing authorization.
