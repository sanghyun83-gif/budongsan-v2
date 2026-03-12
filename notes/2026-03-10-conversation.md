# 2026-03-10 Conversation Log

## Context
- Project: `budongsan-v2`
- User goal:
  - Finish Gangdong target backfill (`202412~202510`)
  - Re-check gate/parity and confirm PASS
  - Save execution logs and provide push commands

## 1) Gangdong Target Backfill Execution
- Scope: `11740` for `202412~202510`
- Method: monthly batch ingest, then `db:normalize` after each batch
- Monthly results:
  - 202510: fetched 587, raw inserted 546, norm inserted 551
  - 202509: fetched 837, raw inserted 794, norm inserted 801
  - 202508: fetched 359, raw inserted 338, norm inserted 341
  - 202507: fetched 214, raw inserted 203, norm inserted 205
  - 202506: fetched 988, raw inserted 887, norm inserted 906
  - 202505: fetched 577, raw inserted 517, norm inserted 530
  - 202504: fetched 327, raw inserted 300, norm inserted 304
  - 202503: fetched 660, raw inserted 602, norm inserted 609
  - 202502: fetched 421, raw inserted 390, norm inserted 396
  - 202501: fetched 206, raw inserted 182, norm inserted 187
  - 202412: fetched 259, raw inserted 211, norm inserted 213
- Total:
  - fetched 5435
  - raw inserted 4970
  - norm inserted 5043

## 2) Gate / Parity Re-check
- `npm run geocode:maintain`
  - final exactRatio: `0.8079`
  - final failRatio: `0.0167`
  - strict gate: PASS
- `npm run qa:parity`
  - final result: PASS `72/72`
  - report files:
    - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-09.md`
    - `docs/MAP_SEARCH_PARITY_REPORT_2026-03-09.json`

## 3) Logs Updated
- `docs/PHASE3_EXECUTION_LOG.md` updated with Gangdong backfill + gate/parity results
- `notes/2026-03-08-conversation.md` appended with same operational summary

## 4) Git Push Command Provided
- Provided commands:
  - `git add docs/PHASE3_EXECUTION_LOG.md notes/2026-03-08-conversation.md docs/MAP_SEARCH_PARITY_REPORT_2026-03-09.md docs/MAP_SEARCH_PARITY_REPORT_2026-03-09.json`
  - `git commit -m "chore: finish gangdong target backfill and confirm gate/parity pass"`
  - `git push origin main`

## 5) Parity Root Cause + Fix
- Parity FAIL root cause:
  - `/api/search` uses `rank_score` as secondary sort for price sorts
  - `/api/map/complexes` lacked `rank_score` tie-breaker
- Fix applied:
  - Added `rank_score` calculation and aligned ORDER BY with search
  - File updated: `app/api/map/complexes/route.ts`

## 6) Gangdong + Gate/Parity Re-check
- `npm run geocode:maintain`: PASS (exactRatio 0.8057, failRatio 0.0167)
- `npm run qa:parity`: 1 FAIL (`brand_xi__seoul_wide__price_asc`)
- Re-ran after fix: PASS 72/72
- Reports: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-10.md/.json`

## 7) Seoul Priority List Generated
- File: `docs/SEOUL_COVERAGE_PRIORITY_2026-03-10.md`
- Priority ordered by missing months, then total_raw

## 8) Gangnam (11680) Gap Backfill
- Months filled: `202503~202509` (monthly + normalize)
- Monthly results:
  - 202503: fetched 917, raw inserted 853, norm inserted 860
  - 202504: fetched 128, raw inserted 113, norm inserted 114
  - 202505: fetched 290, raw inserted 260, norm inserted 265
  - 202506: fetched 610, raw inserted 536, norm inserted 543
  - 202507: fetched 376, raw inserted 338, norm inserted 343
  - 202508: fetched 128, raw inserted 117, norm inserted 118
  - 202509: fetched 232, raw inserted 224, norm inserted 225
- Totals:
  - fetched 2681
  - raw inserted 2441
  - norm inserted 2468

## 9) Gate/Parity After Gangnam
- `npm run geocode:maintain`: PASS (exactRatio 0.8001, failRatio 0.0078)
- `npm run qa:parity`: PASS 72/72

## 10) Priority List Update
- Moved Gangnam (`11680`) to completed list in `docs/SEOUL_COVERAGE_PRIORITY_2026-03-10.md`

## 11) Mapo (11440) Gap Backfill
- Months filled: `202503~202509` (monthly + normalize)
- Monthly results:
  - 202503: fetched 588, raw inserted 534, norm inserted 549
  - 202504: fetched 362, raw inserted 331, norm inserted 339
  - 202505: fetched 476, raw inserted 437, norm inserted 448
  - 202506: fetched 741, raw inserted 668, norm inserted 686
  - 202507: fetched 141, raw inserted 129, norm inserted 132
  - 202508: fetched 193, raw inserted 181, norm inserted 185
  - 202509: fetched 550, raw inserted 532, norm inserted 540
- Totals:
  - fetched 3051
  - raw inserted 2812
  - norm inserted 2879

## 12) Gate/Parity After Mapo
- `npm run geocode:maintain`: PASS (exactRatio 0.8000, failRatio 0.0051)
- `npm run qa:parity`: PASS 72/72

## 13) Seocho (11650) Gap Backfill
- Months filled: `202503~202509` (monthly + normalize)
- Monthly results:
  - 202503: fetched 691, raw inserted 660, norm inserted 665
  - 202504: fetched 62, raw inserted 59, norm inserted 59
  - 202505: fetched 175, raw inserted 159, norm inserted 162
  - 202506: fetched 384, raw inserted 336, norm inserted 345
  - 202507: fetched 234, raw inserted 209, norm inserted 214
  - 202508: fetched 108, raw inserted 100, norm inserted 101
  - 202509: fetched 125, raw inserted 122, norm inserted 122
- Totals:
  - fetched 1779
  - raw inserted 1645
  - norm inserted 1668

## 14) Gate/Parity After Seocho
- `npm run geocode:maintain`: PASS (exactRatio 0.8048, failRatio 0.0047)
- `npm run qa:parity`: PASS 72/72

## 15) Seongdong (11200) Gap Backfill
- Months filled: `202503~202509` (monthly + normalize)
- Monthly results:
  - 202503: fetched 680, raw inserted 602, norm inserted 613
  - 202504: fetched 387, raw inserted 328, norm inserted 334
  - 202505: fetched 592, raw inserted 524, norm inserted 534
  - 202506: fetched 859, raw inserted 778, norm inserted 783
  - 202507: fetched 121, raw inserted 108, norm inserted 109
  - 202508: fetched 233, raw inserted 212, norm inserted 213
  - 202509: fetched 589, raw inserted 566, norm inserted 567
- Totals:
  - fetched 3461
  - raw inserted 3118
  - norm inserted 3153

## 16) Gate/Parity After Seongdong
- `npm run geocode:maintain`: PASS (exactRatio 0.8013, failRatio 0.0046)
- `npm run qa:parity`: PASS 72/72

## 17) Yongsan (11170) Gap Backfill
- Months filled: `202503~202509` (monthly + normalize)
- Monthly results:
  - 202503: fetched 299, raw inserted 278, norm inserted 281
  - 202504: fetched 43, raw inserted 39, norm inserted 40
  - 202505: fetched 92, raw inserted 82, norm inserted 82
  - 202506: fetched 169, raw inserted 149, norm inserted 150
  - 202507: fetched 152, raw inserted 133, norm inserted 139
  - 202508: fetched 148, raw inserted 133, norm inserted 145
  - 202509: fetched 147, raw inserted 121, norm inserted 139
- Totals:
  - fetched 1050
  - raw inserted 935
  - norm inserted 976

## 18) Gate/Parity After Yongsan
- `npm run geocode:maintain`: PASS (exactRatio 0.8061, failRatio 0.0050)
- `npm run qa:parity`: PASS 72/72
