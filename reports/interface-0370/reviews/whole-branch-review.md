# Whole-branch review — interface mobile 0.37.0

Reviewed 10 November 2026 by the independent final Senior Code Reviewer.

Scope: supplied `whole-branch-review-package.diff`, BASE `2b5ae484add9e5abcca1392be5665af2c4837257` through HEAD `fd9e017`; runtime source `9ca13bb55a55f7a571c6fbc027e31c466c638e3c`. Read the approved spec, plan, ledger/rulings, architecture, changed runtime and relevant surrounding controllers, new browser checks and migrations, canonical Task 3 report including its fix appendix, and delivery/quote receipts. The supplied package was used instead of rebuilding the Git range. No source, index, branch, build or historical artifact was changed. This report is the only file written.

## Strengths

- The implementation preserves the architectural boundary: home navigation, preparation views and pagination rearrange presentation; Session/Game, existing unlock/budget helpers and existing save controllers remain authoritative. Both saved modes remain reachable. No additional save schema or rule calculation was introduced for the new views.
- Catalogue actions account for the integration consequences of becoming modal. The capture handler releases its own lease before ordinary camp actions, projected readiness retains manual/background/nested pauses, and harmless recruitment selection remains separate from the real placement purchase. The synchronous close/reopen correction in `pauseForDialog` is appropriate and the Game-replacement boundaries have explicit coverage.
- Album identities, separate child books and protected French copy are retained. New strings use the translation mechanism, input names are assigned as text, and the preparation summary uses the actual chosen kinds rather than deriving game rules.
- Native modal focus containment, nested-guide rotation, fixed catalogue controls, safe-area geometry, actual hit testing and the repaired positive native scroll test provide substantial evidence. The touch mutation test now demonstrates that the relevant assertion can fail when scrolling is blocked.
- The delivery documentation clearly distinguishes local candidate from publication, Chromium from Android hardware, simulated councils from people, frozen runtime from test-only follow-up, and the incomplete image quote from authorization to generate. APK identity/certificate and exact normal bundle provenance are recorded. The 21-command final receipt and subsequent focused scroll receipt are useful, separate evidence; I did not rerun those suites.

## Issues

### Critical

None found.

### Important

**I1 — Page and filter changes can leave every resulting catalogue card outside the visible scroll area.**

Locations: `src/ui/catalogPages.ts:20`, `src/ui/catalogPages.ts:24`, `src/ui/catalogPages.ts:29`; related stale scroll target `src/ui/controls.ts:67`–`80`. Coverage gap: `scripts/mobile-catalogue-037-checks.mjs:167` checks the changed page counter after scrolling through expanded tools, but not whether the new cards enter the viewport.

Reproduction on the frozen normal bundle at `http://127.0.0.1:4973/`, Chromium touch viewport 780×360, French, fresh storage: Classic adventure → new game → All allies → To discover → expand Tips and tools → scroll the catalogue body to its bottom → Next. The page counter changes from `1 / 3` to `2 / 3`, but `.catalog-body.scrollTop` remains **288**. Its viewport begins at **y=176** and has height **170**; the first new card is at **y=-110..-46**, with the second row above the viewport too. Selecting the existing `creatures` family similarly leaves scrollTop **288** and the first resulting card at **y=-110**. I used ordinary UI clicks/selects and a DOM scroll solely to establish the boundary, without changing game state or time.

A child has explicitly asked for another page/category but sees the same tools area and no allies; they have to discover that a separate upward scroll is needed. This undermines the primary paged-catalogue interaction on the target phone layout. The old `#shop.scrollTop = 0` now affects a non-scrolling child, not the actual `.catalog-body`.

Fix: reset the real catalogue body to its top after explicit Previous/Next and family/Available/To discover navigation, after applying the resulting page. Centralize that behavior with the pagination controller if useful. Do **not** reset it on every refresh, which would break ordinary tool browsing. Add a focused regression beginning at the bottom with tools expanded, clicking page and filter controls, and asserting a resulting card intersects the real body clip/hit area. Keep the existing no-spend, pause and fixed-control assertions.

### Minor

**M1 — The retained journey recipe is still incompletely migrated (the previously deferred finding).**

Locations: `tests/journey-browser.mjs:69`, `tests/journey-browser.mjs:141`; further stale interaction sites `:72`, `:77`, `:100` and `:105`.

The recipe asserts eight `[data-quick-kind]` elements even though that presentation was intentionally removed, and calls `boundingBox()` on `#home-new` before navigating to its now-hidden Classic page. Simply fixing those two lines is insufficient: subsequent recruitment/encouragement/training clicks need the visible modal/disclosure route, and the chapter click after `#menu-home` needs Classic navigation. Roster selection should also explicitly choose a visible page/card rather than relying on the first matching node across hidden pages.

This leaves `npm run test:journey` unusable as a retained regression recipe and fails the plan's migration intent. The report correctly does not claim it passed. Keep severity **Minor**: it is outside the executed final gates, and independent current suites cover the relevant save/recruitment/training/navigation behavior; it is not evidence of a product failure. It would not independently block this merge. Since I1 already needs a final fix wave, repair the complete journey route in that wave and run this recipe with new outputs isolated from historical artifacts. Preserve its behavioral assertions; replace the removed-card count with checks of saved roster identity and the actual dock/catalogue representation.

**M2 — Re-entering a scrolled home destination focuses a heading above its visible area.**

Location: `src/ui/homeNavigation.ts:38`–`48`.

`show()` resets `#home-screen.scrollTop`, but dedicated destinations scroll in their own `.home-page` (and the compact mission map uses `#mission-list`). The subsequent heading focus uses `preventScroll: true`. Reproduced at 780×360: open Parents, scroll its body down, return Home, open Parents again. The destination retains **scrollTop=115**, its visible region starts at **y=114**, while its newly focused heading is at **y=-1**. Keyboard focus has therefore been deliberately moved to content the player cannot see.

Fix: when navigating into a destination, either reset its actual scroll container before focusing the heading, or explicitly reveal the chosen focus target within that container. Preserve normal scrolling while remaining on a page. Add a small re-entry check covering the scrolled Parents/Classic destination and the compact mission container. This is recoverable by scrolling/Tab and is not a merge blocker by itself.

## Recommendations and verification scope

One final fix wave should address I1 and preferably both minor items. No broad re-audit of unchanged game rules is needed. Focus verification on explicit page/filter changes from a scrolled body, destination re-entry focus, and the repaired journey recipe, then apply the project's required changed-runtime build/release checks. A runtime correction means the current APK/portable snapshot no longer represents the final source: the controller should regenerate the affected artifacts and update their provenance before publishing. Do not relabel the existing `9ca13bb` receipts as tests of the correction.

Review-time browser probes were narrowly targeted against the supplied frozen snapshot. The first filter probe mistakenly requested a nonexistent option (`healers`) and timed out; the corrected probe selected the real `creatures` value and reproduced I1. This reviewer mistake is not counted as a product/test-suite failure. No full suite or new playthrough was run.

## Declined to judge

Each considered boundary set aside is listed explicitly:

- Physical Galaxy S24/WebView behavior, Android system bars, hardware Back and actual device performance: no physical-device evidence is available; desktop Chromium and bundle hashes cannot establish these. The delivery already discloses that limit.
- TalkBack output and real assistive-technology usability: reviewed DOM/focus semantics and the concrete M2 behavior, but cannot certify screen-reader operation from Chromium layout tests.
- Real children's comprehension and native English editorial quality: the six council perspectives are explicitly simulations; no participant session or native-language review is supplied.
- Balance, difficulty, recruitment values and combat efficacy: intentionally unchanged and outside this UI revision; one authentic three-wave win cannot establish balance. No finding requests new game rules.
- Six-image visual quality, provider parity and final Runway price: no images were authorized/generated and the quote remains partial. This separate future gate does not block this interface merge.
- Public deployment, store readiness and remote CI completion: this is a local candidate review; publication remains the controller's later action. Local receipts do not prove any remote run or release.
- Every ancillary historical development recipe not listed in the executed final receipt: inspected migration changes and report disclosure but did not individually certify unexecuted suites. The concrete journey defects are reported as M1 rather than silently excluded.
- Preservation of scroll position as a general navigation preference: retaining position can be legitimate; M2 is specifically the conflicting act of focusing a newly hidden/offscreen heading. No blanket requirement to reset all scroll positions is imposed.
- Artificial language changes while preparation is modal: noticed that `missionPreparation.ts` mixes a fallback whole-node text binding with later child spans, but ordinary language controls are outside the modal and a reopened preview rebuilds its summary. No demonstrated user-facing failure was established, so this is not elevated into a speculative finding or a required fix.
- Additional speculative modal/Game-replacement and save-corruption cases: examined the changed ownership/control paths and existing focused evidence; no concrete defect was found. No extra suite run was justified solely by possibility.

## Assessment

**Ready to merge? With fixes.**

Fix I1 before merge: the new paginated catalogue currently changes pages/categories without revealing their results after a normal tools scroll. The broader architecture, save preservation, pause integration and documented delivery evidence are sound. M1 and M2 are bounded minor defects, suitable for the same final correction wave; neither independently establishes a release-blocking gameplay risk.
