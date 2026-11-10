# Task 1 — fix round 1 independent review

Reviewed BASE `4cb77e5` → HEAD `c6196f10a2ac9dd2d027782ebea6f4c26ef68341`.
Scope: the original Task 1 P2/R1 finding and regressions introduced by its
three-file fix only.

**R1: ADDRESSED. Spec verdict: APPROVE. Quality verdict: APPROVE.**
**Blockers: none.** No new material issue found in the scoped fix.

## Why R1 is addressed

- The labelled terminal harness now imports the exact production
  `src/ui/caprices.css`. The browser assertion also requires the rendered sticker
  SVG to be 58×58, preventing the original unstyled fixture from silently
  returning.
- The new initial-state assertion runs after two animation frames and before
  test scrolling or keyboard actions. It measures the full heading and earned
  stars against the result panel's client clip intersected with the viewport,
  with a 1 px rounding tolerance. This closes the original `isVisible()` gap.
- The faithful saved RED records 110/113 passing, with precisely three clipped
  caprice headings: FR 780×360, EN 780×360 and EN 812×375. I inspected all three
  corresponding captures; their normally sized stickers and clipped headings
  agree with the recorded geometry. The French 812×375 case did not fail RED.
- The saved GREEN records 117/117 passing, 44 captures and no page errors.
  I inspected all four initial FR/EN caprice-win mobile captures. Each has the
  complete sole heading and stars visible, scrollTop 0 and heading focus. The
  recorded heading top is 61 px, with full heights of 26.390625 px (FR) and
  52.78125 px (EN); the complete 28 px stars are inside the clip too.

## Product change and interaction quality

The production adjustment follows the demonstrated defect: on the first
presentation of a result, it retains primary-action focus when that action fits.
When the action extends below the panel, it focuses the existing heading using
`tabIndex = -1` and `preventScroll`, preserving the initial outcome view. The
existing once-per-game guard, visibility/dialog/orientation guards, action order
and action handlers remain intact. This adds no repeated focus loop or new
gameplay behavior.

The four recorded native-keyboard checks reach album → Retry → mission map in
order, asserting each focused control's complete rectangle is visible. I also
inspected their four final keyboard captures: the map focus and all three actions
are visible. The later user-driven scroll can move the heading away normally;
the initial outcome captures are taken separately before that interaction.
Focused Retry receives the stronger bounds assertion across the terminal matrix.
The saved matrix covers ordinary mission/classic results and caprice defeats as
well as wins, without identifying a regression from the conditional focus change.

## Evidence and limits

Read the original P2 review, appended round-one report, supplied diff, all three
changed files and focused result/caprice CSS context. The Git diff independently
confirms three files, 87 insertions and four deletions; `git diff --check BASE HEAD`
exited 0.

Independently parsed both saved reports and verified all **98** round-one evidence
manifest byte counts/SHA-256 entries, with no mismatches. Independently recomputed
all **eight** frozen source hashes; all match. Read the recorded normal/portable
build and typecheck output, baseline browser success (`pageErrors: []`), and
formatting success. These are recorded runs, not suites rerun by this reviewer.

No test suite, build or server was started. No product, index or Git state was
written; only this requested review report was created. This remains a scoped
Task 1 acceptance review using labelled browser fixtures, not a physical-device
playtest or a final-delivery review.
