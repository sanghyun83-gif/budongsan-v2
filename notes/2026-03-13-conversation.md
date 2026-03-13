# 2026-03-13 Conversation Log

## Context
- Project: `budongsan-v2`
- User goal:
  - Continue Seoul gap backfills by priority (current: 11500)
  - Run geocode/parity after backfill
  - Keep logs and coverage docs up to date

## 1) Gangseo (`11500`) Gap Backfill (Complete)
- Method: monthly ingest + `db:normalize` after each month
- Executed:
  - 202503: fetched 462, raw inserted 429, norm inserted 435
  - 202504: fetched 359, raw inserted 332, norm inserted 339
  - 202505: fetched 508, raw inserted 435, norm inserted 438
  - 202506: fetched 605, raw inserted 573, norm inserted 577
  - 202507: fetched 270, raw inserted 237, norm inserted 239
  - 202508: fetched 285, raw inserted 271, norm inserted 272
  - 202509: fetched 604, raw inserted 592, norm inserted 593
  - 202510: fetched 603, raw inserted 583, norm inserted 587
  - 202511: fetched 188, raw inserted 182, norm inserted 182
  - 202512: fetched 316, raw inserted 300, norm inserted 300
  - 202601: fetched 373, raw inserted 15, norm inserted 67
  - 202602: fetched 314, raw inserted 208, norm inserted 221
- Status: done (202503~202602, 12/12)

## 2) Post-11500 geocode/parity
- `geocode:maintain` strict PASS
  - total 7133, exact 5753, approx 1380, pending 1138, failed 35, permanentFailed 207
  - exactRatio 0.8065, failRatio 0.0049
  - finishedAt 2026-03-12T18:12:25.154Z (UTC)
- `qa:parity` PASS (72/72)
  - report: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.md`
  - data: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-12.json`
  - note: report filename is UTC date

## 3) Docs/Notes updated
- `docs/SEOUL_COVERAGE_PRIORITY_2026-03-10.md`
  - 11500 moved to 완료(12개월 커버)
- `docs/PHASE3_EXECUTION_LOG.md`
  - Added 2026-03-13 execution logs (11500 backfill + post-gate/parity)
- `notes/2026-03-12-conversation.md`
  - Added 11500 backfill + post-gate/parity section

## 4) Dongdaemun (`11230`) Gap Backfill (Complete)
- Method: monthly ingest + `db:normalize` after each month
- Executed:
  - 202503: fetched 425, raw inserted 386, norm inserted 391
  - 202504: fetched 347, raw inserted 295, norm inserted 325
  - 202505: fetched 366, raw inserted 331, norm inserted 334
  - 202506: fetched 574, raw inserted 517, norm inserted 520
  - 202507: fetched 202, raw inserted 183, norm inserted 185
  - 202508: fetched 234, raw inserted 218, norm inserted 220
  - 202509: fetched 506, raw inserted 488, norm inserted 489
  - 202510: fetched 546, raw inserted 521, norm inserted 524
  - 202511: fetched 145, raw inserted 141, norm inserted 141
  - 202512: fetched 285, raw inserted 259, norm inserted 280
  - 202601: fetched 296, raw inserted 4, norm inserted 54
  - 202602: fetched 203, raw inserted 55, norm inserted 78
- Status: done (202503~202602, 12/12)

## 5) Post-11230 geocode/parity
- `geocode:maintain` strict PASS
  - total 7231, exact 5800, approx 1431, pending 1189, failed 38, permanentFailed 204
  - exactRatio 0.8021, failRatio 0.0053
  - finishedAt 2026-03-13T11:58:47.347Z (UTC)
- `qa:parity` PASS (72/72)
  - report: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-13.md`
  - data: `docs/MAP_SEARCH_PARITY_REPORT_2026-03-13.json`
  - note: report filename is UTC date

## 6) Docs/Notes updated
- `docs/SEOUL_COVERAGE_PRIORITY_2026-03-10.md`
  - 11230 moved to 완료(12개월 커버)
- `docs/PHASE3_EXECUTION_LOG.md`
  - Added 2026-03-13 execution logs (11230 backfill + post-gate/parity)
