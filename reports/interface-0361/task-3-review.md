# Task 3 — fresh specification and quality review

Reviewed candidate `b73892cd0c2f6560b4b0dbf25c7797876a7fe533` against Task 3 base
`49a1e5aea80a20115a72a0002d72bda24285480a`, the supplied review package, binding
specification and focused current source/evidence. Read `AGENTS.md` first.

**Specification verdict: APPROVE.** Task 3 meets its scoped requirements.

**Quality verdict: APPROVE.** No actionable correctness, preservation,
test-integrity or delivery-integrity defect was established. There are no
severity/file-line findings requiring changes.

## Load-bearing checks

- Historical documentation: independently compared all **84** modified existing
  Markdown files. Apart from the expressly new current-candidate plan section,
  content differs only by spaces and Markdown table separator padding. Compared
  **501 headings, 550 inline-code spans, 289 links and 164 quoted spans** exactly;
  all match. All **17** original audit files and all `CAPRICES.md` table rows are
  byte-identical. The bounded formatter is dry-run by default, excludes audit
  originals, protects headings/fences/quotes/links/identifiers, and has explicit
  vocabulary plus saved safety/idempotence evidence. Its current diff preserves
  versions, hashes, names, announcements and historical decisions.
- Hygiene: independently recomputed Git-blob totals at audit baseline, Task 3
  start, APK source and reviewed HEAD: respectively **670,253,713 / 670,317,902 /
  670,337,761 / 670,363,097 bytes**. File counts match the index. Both proposed
  policies independently reproduce **442 files / 479,717,142 bytes** and
  **466 / 482,811,626**, with the canonical rounded-square reference excluded.
  `docs/HYGIENE-DEPOT-0361.md` distinguishes candidates from guaranteed savings,
  checkout/shallow/full clones, future LFS/artifacts/history rewrite, and requires
  backup/hash/restoration/index review before any later untracking. No migration,
  old evidence removal, upload or Git configuration change appears in this diff.
- Version/configuration: package and lock only bump to **0.36.1**; Android only
  bumps to **47 / 0.36.1**. No dependency, production-rule, serializer or catalogue
  change is present. All **eight frozen production SHA-256 values** independently
  match `source-freeze.json`.
- Family correction: `tests/family-020-browser.mjs:132` onward explicitly asserts
  historical v2 input and the complete literal default album in a current v4
  envelope. The later v1/v2 loop and v3 mission witness retain full equality of
  camp/career/missions and add exact current album expectations. Existing reload,
  round trip, cancel, invalid, profile-only and blocked-write checks remain.
  Production bootstrap already creates/persists this default album, so the
  correction repairs the obsolete fixture without weakening model assertions.
- Recorded checks: read all **18** retained command outcomes/log endings: the
  initial family failure is retained honestly; corrected family and the other
  **17 distinct final commands** pass. Saved evidence reports 506 Node tests,
  196 interface checks, 281 caprice checks, 392 locale checks, audit 13/13 and four
  cold FR/EN portable/normal-offline contexts. No saved failure is hidden by the
  compact final-result list.
- Preservation: independently recomputed all **6,600** historical snapshot hashes
  against current bytes; before/after manifests match exactly. Also compared all
  **5,962** historical tracked report/capture/artifact paths directly to Task 3
  base. The fixed audit output is preserved, as are Gradle settings in the source
  diff. No old proof/schema/source asset is removed.
- APK: independently matched **15,098,101 bytes** and SHA-256
  `a33066836f5d42aa17b3165087c95ae09788fab13539d38e9304cc11e2dd0992`;
  all **34** indexed `assets/public` entries match their hashes and current
  `dist/` byte for byte. Embedded Capacitor configuration has no server/start
  path. Inspected saved compiled badging/manifest/permissions/signature evidence:
  0.36.1/47, same appID/certificate, FR/EN labels, sensorLandscape, no
  INTERNET/BILLING/AD_ID. APK source commit is clearly distinguished from later
  documentation-only commits.
- Archive: independently matched **313,357,893 bytes** and SHA-256
  `8b20478800ad6173c784c1543c51c344c0430da854611dbc430deedf93f55e6e`.
  Read every compressed indexed member and verified **1,315 files /
  319,079,020 bytes** against the manifest, plus the manifest itself. No missing,
  unexpected or mismatched regular member. Source `f87c898` and the local-only
  delivery path are explicit; five small tracked proof/index/review files replace
  raw evidence additions. No remote archive URL is invented.
- Balance: all five bilan rows match saved `balance/summary.json`, including
  **1,080 games**, 108 per arm, mean minima and worst minima. The annex expressly
  preserves both baseline discrepancies, excludes a 44,092-game replication
  claim, states whole-caprice bite scope and old code/checkpoint compatibility
  risk, and applies no tuning. Fixture/device/human limitations are explicit.

## Scope and remaining gates

This is a read-only Task 3 source/evidence review. No suite, build, server,
simulation, packaging process or product edit was run by this reviewer; the
independent operations above only read/hash/compare existing artifacts. Only this
requested review report was written. Recorded test results are author evidence,
not newly executed reviewer suites.

The fresh whole-branch review and six simulated-perspective council remain
coordinator-owned gates, accurately marked pending at this handoff. Physical S24,
Android keyboard/TalkBack, child play and anglophone review are not established
by these proofs. This approval authorizes no merge, publication, storage
migration or balance change.
