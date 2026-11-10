# Task 2 fresh spec and quality review

Reviewed `2bde9378ae468210a8c83d3fe8dc7f9ef2b60de8` → `b015ecda63d6b3c0b99878aa41707687f3945948` on 2026-11-10. Read AGENTS.md, architecture, the binding brief, report, full production diff, targeted QA diff/tests, existing logs and representative captures. No application edits, suites, builds, servers, remote operations or Git mutations were performed.

**Spec: CHANGES. Quality: CHANGES.** One functional finding; the other reviewed requirements are satisfactory. The finding is confined to the UI reminder and does not change combat, purchases, saves or deterministic rules.

## Finding

**P2 — A repair paid during fighting can fail to reset the reminder when income masks the expense.** `src/ui/recruitmentReminder.ts:85–89` infers non-recruit spending solely from `game.gold < previousGold`. Successful recruitment has a separate reliable counter, but repair has no equivalent signal: the real handler at `src/ui/controls.ts:150–153` calls `session.game.repair()` and `refresh()`. `refresh()` does not sample/reset this observer. Repair is an available combat action (`src/ui/campToolModel.ts:55–64`), and `BattleScene.update` advances the simulation at `src/render/BattleScene.ts:170` before sampling the reminder at line 177. Income in that intervening simulation can therefore erase the observed decrease.

The supplied `task-2-root-spend-income-probe.json` demonstrates the observer failure with an actual successful Game.repair: eight active seconds at 600, repair to 520, seven simulated income additions of 12 to 604 before the next observer call, then the reminder appears after only two more active seconds. It should require ten seconds since the successful repair under the explicit “tout achat remet ce délai à zéro” rule. The same missed signal can leave an already visible reminder alive after repair.

This is a narrow timing edge with limited harm: an early or uncancelled advisory message. The supplied probe is **not** a naturally played battle or a native-button reproduction; it proves the observer behavior, while the inspected native handler and frame order establish the available production path. I do not infer an actual frequency from it. Training is preparing-only, so I do not extend this finding to a demonstrated training/income race. The rating reflects the explicit reset contract and incomplete event observation, not a gameplay or persistence risk.

Requested correction: signal successful spending from the UI/session coordination path, including repair, rather than relying only on net gold between frames. Preserve the no-core/no-RNG restriction. Add a focused deterministic regression where successful repair is followed by offsetting income before the next reminder update; check both waiting reset and visible cancellation. The current “native spending” recipe (`scripts/equilibrage-0362-browser.mjs:356`) directly assigns gold from 600 to 520, so it does not cover a real action whose expense is hidden before observation. Failed actions must not reset the timer.

## Requirements otherwise satisfied

- New Session/classic starts opt into revision 2; explicit legacy classic code revision is retained through pending confirmation, expeditions, bootstrap and menu. Seed zero/max and cancel/confirm are covered in existing production-browser evidence. `menu.startFromSeed` keeps its historical default. Mission creation opts into 2; exact retry/reprise uses original instances or runs; rerolls retain balance and explicitly preserve/omit refuge rules. The authorized generic classic-reset semantics are retained.
- Catalogue and battle guide read actual `Game.recruitCost`, including vouchers; the home guide reads current standard prices. Existing dock pricing still uses actual cost. `Règles d’origine` is bound for current historical games outside the hideable seed/code section, covering an unrecoverable legacy seed, and translated to EN. Mission preparation also exposes historical rules.
- All five changed caprice descriptions resolve through `capriceDefinitionForRun`; row caching includes balance. Protected French names/announcements are unchanged; the shell-bite explanation scopes the stronger bites to shells.
- The BattleScene change is only callback typing/native delta forwarding. Reminder timing uses that delta, independently of simulation speed/time, rejects invalid/suspended frames, and excludes home/preparing/pause/hidden/dialogue/portrait/placement through existing guards and explicit UI checks. Legal recruitment uses actual affordability, unlock/caprice permission and `Game.canRecruit` probes. Failed probes are throttled.
- Notices, placement and positive-priority coaching prevent acknowledgement/display. The existing bottom line is reused; the readable four-second window pauses behind priorities and inactivity. Recruitment cancellation is reliable through the successful-placement counter, including free vouchers.
- UI markers are a separate preference, bounded to 64 departure keys with memory fallback and exception-safe storage. Matching codes suppress retry/resume/reload repeats; no-seed historical camps use the documented conservative fallback. No game-save schema or family payload is changed.
- The authorized toolbar extension changes only compact `grid-template-columns`. The mobile031 update checks the established explicit-opener contract instead of desktop auto-open. Locale/mission QA updates assert the expected new-start formats while preserving historical fixture expectations. No Game/data/balance/caprice/mission/codec source changes occur in this task's diff.

## Evidence checked and limits

All artifact paths below are under `artifacts/equilibrage-0362/task2/`.

- Existing final verify log records **540 passed / 0 failed**, build/budgets green; final general browser log records desktop/mobile success and no page errors. Existing locale log records 392 checks, 930 inventory entries and no missing EN; caprice log records 281 checks, 39 captures and no errors. I inspected these records rather than rerunning them.
- `browser-1794329733566/results.json` contains the 13 green matrix cases. `final-amended/suite-new-ui/run.log` points to the added spending case, and `browser-1794331774039/results.json` records the final no-seed-label green case. These are staged runs, not one final 15-case replay.
- Viewed `browser-1794329733566/reminder-780-fr.png` and `reminder-812-en.png`: exact localized reminder text is readable on the existing bottom strip below the lanes. Viewed `toolbar-approved-before-after/after-480-fr-CH.png`: complete labels fit with 48px targets. The before/after measurement file reports exact board and panel rectangle equality at 480/780/812 in both languages.
- Independently compared all 21 current owned-source SHA-256 values with the report manifest: no mismatch. Historical before/final manifests are byte-identical and contain 8,139 entries. This confirms manifest consistency; I did not rehash every historical proof file.

No physical S24 behavior, future Task 3 packaging, production deployment, or natural frequency of the spending/income race was verified. The existing S24 STOP gate remains applicable.
