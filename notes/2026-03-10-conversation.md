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
