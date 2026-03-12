# 2026-03-12 Conversation Log

## Context
- Project: `budongsan-v2`
- User goal:
  - Build Gyeonggi coverage priority report identical in format to Seoul
  - Improve region name mappings for accurate labeling

## 1) Gyeonggi Coverage Priority Report
- Script: `scripts/generate-coverage-priority.mjs`
- Output: `docs/GYEONGGI_COVERAGE_PRIORITY_2026-03-12.md`
- Range: 202503~202602
- Result: Priority groups generated, completed list empty

## 2) Region Name Mapping Overrides
- Added Gyeonggi (41xxx) overrides for city/district names
- Aliases included for split codes (e.g., 안양/부천/화성)
- Report regenerated with corrected names

## 3) Next Mapping Candidates
- Other provinces/city code families: 26xxx, 27xxx, 28xxx, 29xxx, 30xxx, 31xxx, 36xxx, 42xxx, 43xxx, 44xxx, 45xxx, 46xxx, 47xxx, 48xxx, 50xxx
- Recommended next step: list codes with missing/placeholder `name_ko`, then add overrides only where needed

## 4) Seongbuk (`11290`) Gap Backfill (Complete)
- Method: monthly ingest + `db:normalize` after each month
- Executed:
  - 202503: fetched 455, raw inserted 410, norm inserted 415
  - 202504: fetched 346, raw inserted 320, norm inserted 322
  - 202505: fetched 475, raw inserted 424, norm inserted 434
  - 202506: fetched 660, raw inserted 605, norm inserted 620
  - 202507: fetched 232, raw inserted 209, norm inserted 213
  - 202508: fetched 362, raw inserted 314, norm inserted 343
  - 202509: fetched 545, raw inserted 517, norm inserted 522
  - 202510: fetched 514, raw inserted 492, norm inserted 493
  - 202511: fetched 207, raw inserted 198, norm inserted 198
  - 202512: fetched 322, raw inserted 311, norm inserted 314
- Status: done (202503~202602, 12/12)

## 5) 2026-03-12 geocode/parity (post-11290)
- `geocode:maintain` strict PASS
  - total 6566, exact 5267, approx 1299, pending 1053, failed 27, permanentFailed 182
  - exactRatio 0.8022, failRatio 0.0041
- `qa:parity` PASS (72/72)
  - report: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.md`
  - data: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.json`

## 5) Guro (`11530`) Gap Backfill (Complete)
- Method: monthly ingest + `db:normalize` after each month
- Executed:
  - 202503: fetched 359, raw inserted 329, norm inserted 331
  - 202504: fetched 280, raw inserted 260, norm inserted 265
  - 202505: fetched 691, raw inserted 368, norm inserted 670
  - 202506: fetched 495, raw inserted 454, norm inserted 464
  - 202507: fetched 219, raw inserted 200, norm inserted 203
  - 202508: fetched 228, raw inserted 218, norm inserted 220
  - 202509: fetched 350, raw inserted 333, norm inserted 335
  - 202510: fetched 347, raw inserted 339, norm inserted 339
  - 202511: fetched 165, raw inserted 164, norm inserted 164
  - 202512: fetched 283, raw inserted 277, norm inserted 278
- Status: done (202503~202602, 12/12)

## 6) 2026-03-12 geocode/parity (post-11530)
- `geocode:maintain` strict PASS
  - total 6727, exact 5424, approx 1303, pending 1091, failed 22, permanentFailed 190
  - exactRatio 0.8063, failRatio 0.0033
- `qa:parity` PASS (72/72)
  - report: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.md`
  - data: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.json`
