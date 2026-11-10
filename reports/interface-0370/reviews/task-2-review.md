# Task 2 review — preparation and paused catalogue

Reviewed `886aa6b..96e1f06` against the Task 2 brief, the approved spec, the final Task 2 rulings in `progress.md`, the integration context and the implementation report. Read the supplied full diff package; no source/index/branch edits, subagents or test reruns.

## Spec verdict

**Needs fixes.** The preparation views, harmless catalogue selection, six-card pagination, pause ownership and retained camp actions implement the approved approach. One explicit Task 2 requirement is unmet: catalogue page controls are not fixed outside the scrolling content.

## Strengths

- Preparation rearranges existing controls and preserves the expedition controller's draft, historical revisions/codes and optional caprice friend restrictions. Exact French caprice leaves remain protected; new commands have English bindings.
- Catalogue selection closes before the existing guarded command. Readiness projects release of its own pause lease without copying or temporarily unpausing a Game. Manual/background/nested pauses remain authoritative.
- The approved removal of eight duplicate recruit shortcuts retains the roster selector and shop access; the four-unit/two-honey dock is retained.
- Tests exercise real state freezing, selection without spending, ordinary placement, exact camp-action costs/effects, immediate close/reopen, nested dialogs, interruption, focus, filtering and all twenty recruit IDs. Adapted caprice/locale assertions retain the underlying protections, including the restored reroll geometry checks.
- Supplied final receipts are clearly distinguished from development/pre-polish runs: verify 549/build, mobile 442, browser zero page errors, caprices 293/39 captures and locale 440 + 24 bindings. Existing protected-file receipt lists 81 unchanged hashes. No engine, save-format, Android identity, paid-service or historical-evidence change appears in the reviewed product/test diff.

## Findings

### Critical

None.

### Important

1. **Pagination scrolls out of the catalogue instead of remaining fixed.** `src/ui/catalogPages.ts:18` inserts `.catalog-pagination` immediately before `#shop`. At that point `src/ui/reinforcementsDrawer.ts:25` has already moved `#shop` into `.catalog-body`, whose new CSS uses `overflow: auto`; the navigation has no sticky/fixed positioning. Scrolling the cards or opening/using the tools therefore scrolls the Previous/Next controls with the content. This contradicts Task 2's “titre/filtres/pages fixes” and the report's claim that page commands stay fixed.

   Focused external confirmation: the existing final `final-target-frozen/after-measurements.json` records this body's scroll/client heights as **252/182** at 568×320 and **250/142** with safe insets: 70px and 108px of scrolling, enough to remove the 48px page buttons completely. Current geometry checks inspect their initial position, so the green receipts do not contradict this defect. Keep pagination outside `.catalog-body` (or give it a verified fixed/sticky position) and check its visibility after scrolling the body to the bottom at these sizes.

### Minor

None.

## Cannot verify / scope limits

- Physical S24, Android system-bar behavior and screen-reader behavior are not established by the supplied browser evidence; the report accurately makes no such claim.
- Task 3's historical fixture migrations and native portrait-rotation polish were excluded as instructed. They are not Task 2 findings.
- Existing final receipts were inspected/reused; no independent suite rerun was needed. Heavy evidence remains outside Git under `/workspace/serpents-interface-0370/task2`.

**Decision: Needs fixes** for the fixed-pagination requirement above; no other demonstrated Task 2 defect found.
