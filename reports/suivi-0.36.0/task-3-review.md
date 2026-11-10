# Task 3 — independent spec and quality review

Reviewed 2026-11-09. BASE `e76de2118890a4feccf97d3e0eca0eb7524bfacf`; HEAD `493904adeea95be6a78723ea583d0813897c68ae`.

## Verdicts

- **Spec verdict: changes requested.** The main requested UI/integration is implemented, but R1 leaves preparation advice inconsistent with a valid completed friend selection, contrary to the explicitly named advice requirement.
- **Quality verdict: changes requested for R1 (Medium / Important).** No Critical or High defect identified. The implementation is generally cohesive, preserves the engine boundary, and has substantial recorded verification. The finding concerns user-facing integration, not combat rules or ownership.

## Finding

### R1 — Medium / Important — preparation can recommend a forbidden friend

Primary location: `src/ui/missionPreview.ts:140` (availability predicate at lines 144–146). Related changed locations: `src/ui/capriceView.ts:148` and `src/ui/expeditions.ts:119`.

The preparation advice sees only mission rank and `noHealers`. It never receives the selected friend set. Selecting/deselecting a friend updates button states only, so the existing scouting recommendation and generic flying-enemy plan remain unchanged even after the caprice's limit is filled.

Concrete valid case: open `sonnette-petit` and choose Ninja + Medic. Both choices are accepted by the unchanged engine. At launch the resulting Game forbids Archer, but the preparation's `mission-advice` still says `Pense aux archers pour toucher les volants.` The generic plan also recommends archers, a dragon or a tank without regard to this selection. This sends the child toward recruits the resulting dock/catalogue correctly hide.

A focused, read-only Node projection (not a suite rerun) reproduced the exact availability predicate used by `showMissionScouting` against a fresh Game:

```json
{
  "accepted": true,
  "chosen": ["ninja", "medic"],
  "advice": {
    "kind": "archer",
    "text": "Pense aux archers pour toucher les volants."
  },
  "recommendedAllowed": false
}
```

Required correction: derive preparation advice from the pending chosen set using the same empty/partial/full semantics as `capriceAllows`, and refresh that advice on selection changes. Update the generic flying-enemy suggestion consistently. Preserve initial clubs, allow empty/partial choices, and leave the engine untouched. A focused regression should demonstrate that full Ninja + Medic does not recommend Archer, while an empty or partial choice still permits suggestions according to the engine. Current-wave advice already passes `game.capriceAllows` in `src/ui/threatControls.ts:30`; the preparation needs the corresponding integration.

## Strengths and spec coverage

- New launch construction and choice validation happen before replacing the session, clearing the retained camp or capturing a new owner. Empty choices skip `chooseCapriceKinds`; retry/restart supply the actual getter set. UI launch failure keeps the preparation open.
- Bootstrap synchronizes/records the old Game before capturing the active child for a new preparation. Resume and retry retain ownership. Per-Game award caching prevents a visible old win being credited again after profile selection changes; campaign stars retain existing shared progression semantics.
- Album persistence is integrated at ordinary sync, export and successful import sites. Import validation/storage succeeds before in-memory replacement. Old-envelope replacement is disclosed explicitly, including the absence of historic stickers.
- The notebook uses stable 36-slot nodes, raw local names, a shared pause lease, keyboard focus return and a sticky close control. Preparation row caching avoids rebuilding all six challenge cards on battle refresh.
- French names/announcements are protected on individual leaves; English surrounding commands/explanations remain translatable. The defeat fix clears the stale parent binding before adding the protected French phrase.
- Recruitment surfaces use `capriceAllows` and spendable gold; repair/training share the reserve subtraction. No-honey controls/help read the existing flag. King previews replace the final planned entry and avoid the classic court.
- Shell rendering changes visual scale/graphics only and uses a bounded pool with scene cleanup. Canvas and WebGL evidence both show the shell and enemy contour.
- No diff exists for `src/game.ts`, `src/caprices.ts` or `src/missions.ts` between HEAD and either Task 3 BASE or frozen `c886b82`. No package/version/schema change is included in this task diff.

## Evidence reviewed and method

Read `AGENTS.md`, the supplied Task 3 brief/report/full-context review diff, the design spec, `docs/CAPRICES.md` and architecture guidance. Reviewed all 30 changed-file sections in the supplied diff. Focused outside-diff checks were limited to concrete integration questions: album controller validation/award behavior, mission progress sequencing, pause ownership, departure gates, localization bindings, unchanged engine friend semantics, mission threat composition and renderer contour transforms.

Existing evidence was inspected, not rerun:

- `task-3-verify.log`: 502 tests passed, 0 failed, 0 skipped; typecheck/build/budget checks completed.
- `task-3-browser-final.log` and `artifacts/caprices-036/report.json`: 185 checks, 29 captures, 0 page errors, `nativePlayed: true`.
- Locale logs: 912 inventoried phrases, 943 English entries, 0 missing.
- `native-owner.json`: version 4 envelope, A owns the earned `refuge-petit` sticker; B is active and owns the newly prepared expedition, with no sticker in B's book.
- Visually inspected existing captures: production A victory, desktop English preparation, 568×320 English preparation and scrolled notebook, 568×320 controlled bank, Canvas shell and WebGL shell. These support the reported accessible preparation footer/notebook close, protected French identity, actual victory sticker and matching shell treatment. They are browser-emulated views, not physical-device evidence.

The browser script uses real production bootstrap/native controls for the retained-A/classic/reload/resume/win/new-B sequence. Controlled progression is clearly labeled. The readiness/outcome/shell fixtures are separate and do not add a production hook. The existing tests cover choice counts and readiness but do not cover advice after a full pending friend selection, explaining why R1 is not caught by the green evidence.

No suites were rerun, no server was started, no product file was edited, and nothing was staged, committed, pushed, merged or published. Only this requested review report was written.

## Cannot verify / explicit limits

- The passed suites/browser runs are existing recorded evidence, not independently repeated in this review. This review independently reproduced only R1's pure availability mismatch.
- Actual local French speech playback is unverified; the report states headless Chromium had no installed French voice. Source restricts speech to explicit action with a local French voice.
- Physical touch devices, Android/WebView behavior and APK installation were not exercised here. Task 3 evidence is browser emulation; later release/version/APK work is outside this task.
- There is no natural child playthrough or 36-game human-play claim. One real deterministic production win is recorded; other outcomes/readiness/progression use labeled controlled data.
- Screenshots establish sampled states, not every scroll position and possible user name/language/selection combination. In particular, they do not establish correctness of full-selection preparation advice.

No other actionable in-scope finding was identified.
