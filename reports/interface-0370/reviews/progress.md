# SDD ledger — plan: docs/superpowers/plans/2026-11-10-interface-mobile-0370.md

Base: 2b5ae484add9e5abcca1392be5665af2c4837257 (latest origin/main, includes Claude passation).
Baseline: npm test 548/548 pass, 0 failed. Existing isolated linked worktree reused.
Spec: docs/superpowers/specs/2026-11-10-interface-mobile-0370.md
Approved: eight A choices + all okay; autonomous execution, push/merge/publish authorization persists. Image quote remains separately gated.

Ruling: formalize and execute the eight already-approved choices without asking for identical plan approval — user's standing autonomy and latest all-okay authorize this — if misunderstood, reversible UI rework.
Ruling: skill helper script resource is unavailable (skills.read failed); produce equivalent brief extraction and diff packages locally in this plan's workspace — no skill scripts installed — equivalent filenames and complete content retain review gates; cost if wrong: reconstruct affected brief/diff and repeat that review.
Ruling: version 0.37.0/code49 for the approved substantial UI revision — existing release 0.36.2/code48 — reversible before publication, no application ID change.

## Preflight conflict scan

| Tasks | Shared file/interface | Check and resolution |
| --- | --- | --- |
| 1 alone | home-primary vs old mode handlers | Delegates commands; uses existing activeMode; no save format edits. Test both retained modes. |
| 2 alone | catalogue selection vs pause | Choice only while paused; actual purchase after close/placement. Existing Session/Game semantics remain authority. |
| 3 alone | release assets vs history | New proofs external; historical tracked outputs restored after tests. No image generation in release. |
| 1 / 2 | expeditions, index, mobileMenus, locale | Task 2 extends established navigation; sequential writers only. Task1 public interface fixed in plan. |
| 1 / 3 | CSS, package/test entry, locale flows | Task3 polish only and integrates tests without undoing navigation semantics. |
| 2 / 3 | CSS, tests, Android recipe | Task3 consumes actual modal/pause interfaces and verifies all viewports, no rule edits. |

Task 1: implementation944f958 complete; reviewer /root/mobile0370_review1 running; BASE70c5bf1, targeted234, verify548, browser fresh green. Optional locale392/caprices281 supplementary overlapping receipts; final integration reruns later.
Task 2: pending
Task 3: pending

Task 1: complete (commits70c5bf1..944f958, review clean). Review /root/mobile0370_review1 approved spec+quality; no findings, no extra tests. Council6 simulated done in council-task1.md.
Task 2: starting — BASE886aa6b (documentation-only closure after Task1).

Task1 Cannot verify disposition: physical S24/system bars/screen reader are explicitly outside simulated evidence; integration migrations belong to Task3. None asserts a present defect or blocks Task1. Final report must retain these limits.

Task2 implementer: /root/mobile0370_preparation_catalogue.
Ruling: preserve quick-slot roster switching under tools but remove eight duplicate quick recruitment cards from visible catalogue; all favourites remain reachable in six-card shop and four-card dock — literal approved six allies per page and compact UI outweigh duplicate shortcut presentation — if unwanted, reversible UI-only reintroduction; no roster/game rules changed. Update reserve regression to active shop/dock rather than hidden legacy cards.

Ruling: camp actions inside the auto-paused catalogue close its lease before invoking existing Session/Game commands; read-only UI readiness may ignore only the temporary catalogue pause, never retained manual/background pause — otherwise preserving controls but always disabling them would remove usable features — if implementation is wrong, risk is unintended resume/spend; require repair/training/honey/encourage and nested/interruption tests, no engine edits.

Task2 targeted checks exposed stale pauseForDialog release on synchronous native close/reopen; implementer fixing settle-before-new-hold with regression, preserving queued-close guard. Controller named reset/end-restart Game replacement risk; capture close added plus cancel/confirm test planned. Visual review requested terse Caprices tab and accurate normal-mission friend copy; no new rule.

Task2 final gates observed: targeted442, unit549/build, locale440, final-browser0errors, final-caprices293/39captures0errors. Restored20reroll geometry checks in Options, added12dock reserve checks vs old281. Await implementer report/commit then task review.

Task2 implementation complete96e1f06; task review /root/mobile0370_review2 running, BASE886aa6b. Final gates in report:442targeted/549unit/293caprices39captures/440locale+24bindings/browser0JSerrors, HTML32475bytes, protected81unchanged. Council-task2 drafted simulated, awaits review.
Controller interrupted Task2 after5min of no commands/output and resumed same agent to finish bounded final browser/caprices/report; no completed work redispatched.

Task2 review Needs fixes: Important fixed pagination is actually inside scrolling.catalog-body (catalogPages insertion after drawer moves shop). Explicit requirement unmet. Fix round1/5 dispatched to original /root/mobile0370_preparation_catalogue, FIX_BASE96e1f06. Need RED/GREEN bottom-scroll with expanded tools and fixed header/filter/pages at568/safe/780. No other findings; physical limits and Task3 migrations are outside scope, no missing Task2 behavior confirmed there.

Task2 fix1 commit ee4e9bd, source one-line nav inserted before.catalog-body, targeted476/build/browser fresh green; scoped re-review /root/mobile0370_review2_fix1 running. Original549unit/293caprice/440locale+24 unchanged-code receipts retained; full final integration Task3 later.

Task 2: fix round1/5 (1 addressed,0open — pagination moved outside scroll body; commits96e1f06..ee4e9bd). Scoped review clean, no out-of-scope observations.
Task 2: complete (commits886aa6b..ee4e9bd, review clean after1fix). Council6 simulated accepted after corrected fixed-controls evidence.
Task 3: running — BASE42e8152, implementer /root/mobile0370_polish_delivery.

Task3 polish: keep existing spendable-coins readout visible within full-screen chooser using availableGold, no new economy fields. RED normal/after-select/after-placement/reserve/FREN/header cases authored before implementation.
Ruling: preserve rewards legacy late battle/render focus scenario using a test-only capture listener that opens Help during a real visible Continue/New click, then normal handler proceeds; remove inert/hidden evaluate-click path — home-only replacement would weaken original timing condition and violate no-hidden-click migration goal — if wrong/flaky, implement isolated UI fixture for same focus race, no product rule change.

Task3: source frozen 9ca13bb55a55f7a571c6fbc027e31c466c638e3c; mobile519, mission-journey16, scroll5+desktop, child6, presentation14, rewards stress green; full final CI recipe and Android packaging pending.
Ruling: portrait guidance reuses its existing node inside actual last-open native modal while coarse portrait, restoring body parent on landscape; closing modals or changing pause leases would lose existing state. CSS-only suppression proved inert. Cost if wrong: rotation overlay/focus confusion, bounded by real hit-test and nested-guide coverage.
Ruling: historical dock visibility assertion now tests actual top-layer coverage because the approved native catalogue intentionally leaves underlying DOM rendered and inert; same objective of unavailable dock retained. Keyboard honey paths reopen catalogue after actions close it. Cost if wrong: concealed interaction regression; native hit-test/keyboard/recruitment assertions retained.
Ruling: rewards late-render stress opens Help from a capturing listener during a real visible Continue/New click, preserving battle render and focus assertions without hidden clicks; authorized by coordinator. Cost if wrong: narrower synthetic timing coverage, reported explicitly.

Task 3: complete (commits42e8152..37c2e2d; frozen runtime9ca13bb; final21/21commands green,549unit/519mobile/440locale+24bindings/293caprices39captures/13audit/16mission/6child/5scroll+desktop/14presentation; APK49/0.37 source9ca samecert,34files equal to dist and root snapshot,4coldoffline green,81protected exact,9044history files preserved). Revue globale et release au coordinateur; workspace SDD actif conservé.

Task3 implementation complete: runtime/tests9ca13bb, documentation/receipts37c2e2d. Final21commands green (unit549/mobile519/locale440+24/caprices293+39/audit13/mission16/child6/scroll5+desktop/presentation14);34APK/dist/root-snapshot files byte-equal; same certificate/appID, code49.4offlinecoldcases; historical9044checked/187restored,8priorrootartifacts unchanged. Full report external task3/task-3-report.md copied to canonicalSDD task-3-report.md for review. Task3 task-scoped review starting BASE42e8152..37c2e2d.

Task3 review Needs fixes I1: native touch positive motion assertions were removed; snapshot still old panel/shop rather than actual.catalog-body though overflow remains. Fix round1/5 original /root/mobile0370_polish_delivery resumed, FIX_BASE37c2e2d. Need native actual body movement both directions, boundary no document scroll, existing no-spend/no-selection/no-close +all20IDs. Test-only mutations can prove failure, no productchange presumed before diagnosis.
Task 3: minor (deferred): M1 tests/journey-browser.mjs:69 still expects8 removed data-quick-kind; :141 measures hidden home-new before visible navigation(:144). Known incomplete ancillary migration, not falselyclaimedpassed. Finalwholebranchreview must triage and include in one finalfixwave ifneeded.
Cannot verify Task3 disposition: physicalS24/WebView/TalkBack/children/native-English not available, explicitlydeclared, not codegap; artifacthashes/normalbundlecold are verified. Ancillary recipes unexecuted disclosed, concrete M1 deferred; siximagepilot correctlyheldatpartialquote.

Task3 fix round1/5 implemented bf15c83ea57b816658ea9a7b65ee8aa082a263d6: I1 test-only, native body positive movement in5cases/bothdirections/trueboundaries; blocked-touch RED then focused GREEN5mobile+desktop0JSerrors. Original21receipt/runtime9ca/APK/HTML/ZIP SHA unchanged. M1 deferred per controller; awaiting targeted re-review.

Task 3: fix round1/5 (1 addressed,0open — native actual bidirectional scroll restored and mutation RED proves it; commits37c2e2d..bf15c83). Scoped review clean, M1remainsdeferred.
Task 3: complete (commits42e8152..bf15c83, review clean after1fix). All3taskscomplete; preparing strongest-model wholebranchreview.

Wholebranch review With fixes: I1page/filter scroll reset leaves cards offscreen (real repro), M1journey ancillary incomplete, M2home re-entry focuses above scroll viewport. Single finalfixwave complete list prepared final-fix-brief.md; no additional gameplay/save/pause/packaging defect found.
Declined-to-judge dispositions (all report lines): physicalS24/systembars/hardwareBack/perf unavailable, disclosed later physicalQA; TalkBack unavailable, fix concreteM2 only; realkids/nativeEnglish no sessions, simulatedcouncils explicit; balance frozen81hashes/no new conclusion; siximages separatefinancialgate/no generation; publicdeployment/CI belongs controller after review and must actually complete; unexecuted ancillary not certified, M1 now in finalfixwave; general scroll retention preference not blanket requirement, only reveal entry focus and explicitpage/filter results; artificial locale change under modal not demonstrated/reopened summary rebuilds, no speculative fix; speculative pause/save cases no defect/evidence gap, no extra suites solely for possibility.

Single finalfixwave runtime/tests committed b31933bf9f6dc56b9c7bf4d286068f52ff3bf28a by /root/mobile0370_final_fix. Native explicit-navigation9RED/9GREEN, journey completeGREEN, verify549GREEN,81protectedunchanged. Frozen-source browser gates/package stillrunning; do not treat old9ca21gates as newruntime.

Single finalfixwave complete: source b31933bf9f6dc56b9c7bf4d286068f52ff3bf28a, packaging26763cde2880995f2c0af64722c0bdae7ef0a636. Exactly one scoped rereview /root/mobile0370_final_rereview APPROVED all I1/M1/M2, no new breakage; all source/artifact provenance checked. Controller visual targeted3sizesGREEN on immutable b319. No second wave. Remote Git/CI/publication next under existing explicit authorization.
