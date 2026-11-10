# Final whole-branch review — interface 0.36.1

Reviewed `9287e60a51adf2cbceef24db4f4771a0cb1e0640` → `b73892cd0c2f6560b4b0dbf25c7797876a7fe533`, on 2026-11-10. Read `AGENTS.md`, architecture, the exact current audit/prompt, specification/plan, ledger, changed production source, relevant unchanged callers/models, test changes, delivery documentation and recorded evidence. This is one fresh reviewer using six perspectives, including three simulated child perspectives; it is not six human reviews or child testing.

**Verdict: technically ready for a private STOP trial, with one minor accessibility finding. No critical or important finding.** This is a technical assessment, not authorization to merge, publish or apply balance changes. A small fix is described below; it does not justify reopening the design or adding another feature wave.

## Findings

- **Critical: none in this UI candidate.** The unresolved all-enemy versus shells-only bite decision belongs to the separately measured balance proposal; those rules are not applied here.
- **Important: none.** No observed regression of the frozen game/catalogue/save boundaries, navigation destinations, terminal state, caprice ownership or French identities.
- **Minor M1 — visible and accessible notebook field names disagree in English.** `src/ui/capriceAlbums.ts:56` retains `aria-label="Petit nom du carnet"`, while the new associated visible label at `src/ui/capriceAlbums.ts:65` is `Nom du carnet`. The dictionary translates them to **Sticker book nickname** (`src/i18n/dictionaries/caprices.en.ts:111`) and **Sticker book name** (`:85`). The explicit ARIA name overrides the native label, and the English accessible name does not contain the visible label. That can impede matching a spoken command to the displayed field (WCAG label-in-name concern). The screenshot `artifacts/interface-0361/task3/interface0361/evidence/navigation-notebook-en-568x320-safe.png` confirms the displayed wording. Remove the obsolete `aria-label` and let the correctly associated label name the input, or make the two names identical. A focused accessible-name check in FR/EN is sufficient. This remains a named, nonblocking minor for the private trial; no device failure is claimed.

## Source and evidence assessment

The eleven prompt points account for all twelve audit rows. Caprices have a real top preparation button, which scrolls and transfers focus to the actual rows before parental controls; existing star gates remain authoritative. Paper selects/input retain native interaction and are at least 48 px. Home duplication is removed in the source, with the mission-map ID on its native disclosure and the chapter disclosure distinguished from starting a classic game. The new helpers only accommodate that deliberate native toggle; they do not weaken the game assertions. Resume paths remain in the existing controllers.

Canvas fonts are loaded locally before bootstrap constructs Phaser text (`src/main.ts`, `src/render/fonts.ts`), with all changed render labels using the shared faces. The recorded cold-start recipe delays font responses and observes actual `fillText` readiness, rather than merely checking CSS. The final interface report records centered Threats/Dangers text with zero vertical offset in FR/EN at both requested mobile sizes. This supports the specific rendering fixes without asserting physical-device performance.

HTML owns the terminal heading. The canvas retains atmosphere/statistics without a second congratulations. Click, resume and Space paths guard terminal states; the pause control is hidden as well as disabled. I checked refresh ordering: `controls.refresh()` calls `afterChange()` (including expedition/result text preparation) before its result refresh, so expedition updates do not undo the final duplicate-summary suppression. Conditional heading focus preserves the initial complete title/stars when the primary action lies below the fold. Native Tab reaches the actions. Result scrolling is still required on short screens and is not represented as all actions fitting at once.

Descriptions read the actual caprice flags without multipliers; icon motifs use deterministic presentation categories and are shared by preparation, notebook and result. Combined caprices retain their full descriptive text even when one motif represents their leading type. French names and announcements remain raw French leaves, with the identity dictionary also preserving them. No canonical value or serializer was edited. Stored FR/EN has priority; otherwise the primary system language alone selects French or English. Qualitative placement ranges leave numerical range and placement behavior untouched. The family chooser is a native file input activated by a game button, preserving existing validation/generation/atomic application logic.

The family recipe change is justified: it explicitly retains historical v1/v2/v3 witnesses and exact classic/mission fields while accounting for the already-existing v4 album envelope. It does not introduce a production format change. The older French-fallback assertion was changed for the user's explicit English-fallback requirement, not to conceal a regression.

The documentation formatter is limited to prose vocabulary and protects code, links, identifiers, quotations, heading anchors and catalogue rows. The final safety evidence distinguishes 84 spaced historical documents from the broader checked set and reports 17 preserved audit originals. The hygiene plan states measured blob totals and a conditional 442-file / 479,717,142-byte candidate inventory, protects the canonical art reference, and distinguishes checkout/shallow-clone gains from retained full Git history. It does not claim migration, upload or actual repository shrinkage.

The source-to-APK association is coherent: `delivery.json` names source `72cc788`; my read-only `git diff 72cc788 b73892c -- src index.html package.json package-lock.json android` was empty. Later commits are documentation/index refinements. Recorded APK evidence identifies version 0.36.1/code 47, the unchanged app ID/certificate, no server configuration, and 34 web files equal to the normal build. Root's fresh `root-final/independent-integrity.json` reconfirms the eight frozen files, APK/archive hashes and all 34 files. I inspected those results; I did not claim a second independent recomputation of every archived hash.

I read the existing final interface report: **196 checks, zero failures, zero page errors**. The root's final verify log and compact command index record **506 Node tests**, successful build/budgets, general browser coverage, **281 caprice checks**, **392 locale checks + 24 bindings**, and family/offline/interruption/mobile/mission/presentation coverage. No suite, build, browser, server or simulation was rerun for this review. Existing task reviews support provenance but were not substituted for reading the changed behavior.

Representative final captures personally inspected with `view_image`, all under `artifacts/interface-0361/task3/interface0361/evidence/`:

- `navigation-home-en-780x360.png`: consistent main/secondary actions and explicit replay mission context.
- `navigation-preparation-fr-780x360.png`: Caprices visible at initial opening, with launch controls retained.
- `navigation-caprice-rows-fr-780x360.png`: the entry reaches both real rows; French names are intact.
- `fixture-won-caprice-en-812x375.png`: complete single heading, stars, contextual sticker and notebook action; a labelled terminal fixture, not a played victory.
- `navigation-notebook-en-568x320-safe.png`: paper controls and readable visible name label within the small safe-area layout.

## Six simulated council perspectives

| Perspective | Evidence-grounded assessment | Remaining trial question |
| --- | --- | --- |
| Architecture and persistence | Approve for private trial. Changes remain at presentation boundaries; raw French identity, existing rules/codes/saves and separate child books/shared campaign are preserved. Refresh ordering and family migration assertions are coherent. | Observe a normal resume/import with the family's real existing data; no migration is being requested. |
| Android and performance | Approve for private trial. Local font readiness, compact HUD geometry, offline/portable evidence and APK/build association address this lot's concrete risks. New icons are small local SVG motifs and cached by type. | Physical S24 cold start, touch/file chooser/keyboard, sustained rendering and resume behavior remain unmeasured. |
| UX, accessibility and localization | Approve with M1. Entry/focus, 48 px native controls, one result heading and simpler language materially address the audit. Original French names and announcements intentionally remain French in English UI. | Voice control/TalkBack, human English readability and discoverability of scrolling result actions require actual use. |
| Simulated child age 6 | The first-screen Caprices button, distinct motifs and short qualitative rules reduce the need to search or parse multipliers. Sticker ownership remains attached to the existing book. | Whether the child understands star gates and notices lower result actions; no reading ability or enjoyment is inferred. |
| Simulated child age 9 | Mission/replay context and actual challenge rows provide clearer choices; full challenge descriptions accompany the type icons and child-chosen titles. | Whether compound challenge sentences and choosing a book feel clear without adult coaching. |
| Simulated child age 12 | Classic play, chapters, map, resumes and caprice selection remain available; simplifying visible range language does not reduce actual tactical behavior. | Difficulty and the appeal of expensive allies still need playtesting; this interface lot intentionally preserves balance. |

## Explicitly declined to judge

- Physical S24 frame rate, thermals, touch precision, Android keyboard/file-picker behavior, installation/upgrade success, TalkBack and locally available speech voices: no physical device session was supplied or performed.
- Human English quality, actual child comprehension, fun, preference and age suitability: these are simulated perspectives, without participants or invented quotations.
- Whether the five proposed balance changes should ship: only 1,080 paired games were measured here; baseline discrepancies versus the audit remain disclosed, means of minima are not worst-case floors, the bite scope is unresolved, and old code3/checkpoint8 semantics require future versioned routing before replacing rules under existing IDs.
- Reproduction of the audit's 44,092 games or proof that raw damage-per-coin captures range/AOE/placement value: that data and scope are not established by this UI review.
- Completion or compressed gains of a repository migration/history rewrite: the candidate supplies a quantified proposal only, with old evidence retained.
- Full accessibility certification or all possible viewport/content combinations: representative Chromium checks and inspected captures support the scoped fixes, not exhaustive certification.

Existing long help, medical explanations and result-scroll discoverability are reasonable trial observations, not newly established regressions or demands for an out-of-scope redesign. Keep the branch at **STOP**, private delivery only. The coordinator owns any bounded M1 correction, updated artifact association, council summary and PR description.
